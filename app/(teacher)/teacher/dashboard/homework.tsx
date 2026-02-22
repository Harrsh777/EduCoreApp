/**
 * Digital Diary / Homework: academic year, paginated list, Create/Edit/Delete, form modal.
 * GET /api/diary, GET /api/diary/stats, POST, PUT, DELETE, POST /api/diary/upload.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { diaryService } from '@/services/diary.service';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, PrimaryButton, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

const PAGE_SIZE = 10;
const TYPES = ['homework', 'notice', 'circular', 'other'] as const;

type DiaryEntry = {
  id: string;
  title?: string;
  content?: string;
  type?: string;
  created_at?: string;
  target_classes?: string[];
  attachment_count?: number;
};

export default function TeacherHomeworkScreen() {
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<string>('homework');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const { data: classesData } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => (r as { data?: { id: string; name?: string; class_name?: string }[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });
  const classesList = (Array.isArray(classesData) ? classesData : []) as { id: string; name?: string; class_name?: string }[];

  const { data: diaryData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['diary', schoolCode, academicYear, page],
    queryFn: () =>
      diaryService.getDiary(schoolCode, { academic_year: academicYear, page, limit: PAGE_SIZE }).then((r) => (r as { data?: DiaryEntry[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });
  const { data: statsData } = useQuery({
    queryKey: ['diary', 'stats', schoolCode],
    queryFn: () => diaryService.getDiaryStats(schoolCode).then((r) => (r as { data?: unknown })?.data),
    enabled: Boolean(schoolCode),
  });

  const entries = (Array.isArray(diaryData) ? diaryData : []) as DiaryEntry[];

  const createMutation = useMutation({
    mutationFn: () =>
      diaryService.postDiary(schoolCode, {
        title: formTitle.trim(),
        content: formContent.trim(),
        type: formType,
        academic_year: academicYear,
        target_class_ids: selectedClassIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', schoolCode] });
      showToast('Entry created', 'success');
      closeModal();
      refetch();
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed', 'error'),
  });
  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      diaryService.putDiary(schoolCode, id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        type: formType,
        target_class_ids: selectedClassIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', schoolCode] });
      showToast('Entry updated', 'success');
      closeModal();
      refetch();
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed', 'error'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => diaryService.deleteDiary(schoolCode, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', schoolCode] });
      showToast('Entry deleted', 'success');
      refetch();
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed', 'error'),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormType('homework');
    setSelectedClassIds([]);
    setModalOpen('create');
  };
  const openEdit = (e: DiaryEntry) => {
    setEditingId(e.id);
    setFormTitle(e.title ?? '');
    setFormContent(e.content ?? '');
    setFormType(e.type ?? 'homework');
    setSelectedClassIds(Array.isArray(e.target_classes) ? e.target_classes : []);
    setModalOpen('edit');
  };
  const closeModal = () => {
    setModalOpen(null);
    setEditingId(null);
  };
  const handleDelete = (e: DiaryEntry) => {
    Alert.alert('Delete entry', `Delete "${e.title ?? 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(e.id) },
    ]);
  };
  const submitForm = () => {
    if (!formTitle.trim()) {
      showToast('Enter a title', 'error');
      return;
    }
    if (editingId) updateMutation.mutate(editingId);
    else createMutation.mutate();
  };
  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const yearOptions = [String(new Date().getFullYear() - 1), String(new Date().getFullYear()), String(new Date().getFullYear() + 1)];

  return (
    <View style={styles.root}>
      <AppHeader title="Digital Diary" right={<Pressable onPress={openCreate}><Text style={styles.addText}>+ Create</Text></Pressable>} />
      <ScreenWrapper scroll refreshing={isRefetching} onRefresh={() => refetch()} contentContainerStyle={styles.content}>
        <View style={styles.controls}>
          <Text style={styles.label}>Academic year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {yearOptions.map((y) => (
              <Pressable key={y} style={[styles.chip, academicYear === y && styles.chipActive]} onPress={() => setAcademicYear(y)}>
                <Text style={[styles.chipText, academicYear === y && styles.chipTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {isLoading && entries.length === 0 ? (
          <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : (
          <>
            {entries.map((e) => (
              <Card key={e.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{e.title ?? 'Untitled'}</Text>
                  <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{(e.type ?? 'homework').toUpperCase()}</Text></View>
                </View>
                {e.content ? <Text style={styles.cardPreview} numberOfLines={2}>{e.content}</Text> : null}
                {Array.isArray(e.target_classes) && e.target_classes.length > 0 ? (
                  <Text style={styles.cardMeta}>Classes: {e.target_classes.join(', ')}</Text>
                ) : null}
                <View style={styles.cardBottom}>
                  <Text style={styles.cardTime}>{e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</Text>
                  {(e.attachment_count ?? 0) > 0 && <Text style={styles.attachCount}>{e.attachment_count} attachment(s)</Text>}
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openEdit(e)}><Text style={styles.actionLink}>Edit</Text></Pressable>
                  <Pressable onPress={() => handleDelete(e)}><Text style={[styles.actionLink, styles.actionDelete]}>Delete</Text></Pressable>
                </View>
              </Card>
            ))}
            {entries.length === 0 && !isLoading && <Text style={styles.empty}>No diary entries.</Text>}
            {entries.length >= PAGE_SIZE && (
              <View style={styles.pagination}>
                <Pressable onPress={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <Text style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}>Previous</Text>
                </Pressable>
                <Text style={styles.pageNum}>Page {page + 1}</Text>
                <Pressable onPress={() => setPage((p) => p + 1)} disabled={entries.length < PAGE_SIZE}>
                  <Text style={[styles.pageBtn, entries.length < PAGE_SIZE && styles.pageBtnDisabled]}>Next</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
        <View style={styles.bottomPad} />
      </ScreenWrapper>

      <Modal visible={modalOpen !== null} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalOpen === 'edit' ? 'Edit entry' : 'Create entry'}</Text>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="Title"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formContent}
              onChangeText={setFormContent}
              placeholder="Content"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <Pressable key={t} style={[styles.chip, formType === t && styles.chipActive]} onPress={() => setFormType(t)}>
                  <Text style={[styles.chipText, formType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Target classes</Text>
            <View style={styles.classList}>
              {classesList.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.classChip, selectedClassIds.includes(c.id) && styles.chipActive]}
                  onPress={() => toggleClass(c.id)}
                >
                  <Text style={[styles.chipText, selectedClassIds.includes(c.id) && styles.chipTextActive]}>{c.class_name ?? c.name ?? c.id}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <PrimaryButton title="Cancel" variant="outline" onPress={closeModal} />
              <PrimaryButton
                title={modalOpen === 'edit' ? 'Save' : 'Create'}
                onPress={submitForm}
                loading={createMutation.isPending || updateMutation.isPending}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  addText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  controls: { marginBottom: s.lg },
  label: { ...textStyles.caption, color: colors.textMuted, marginBottom: s.xs, marginTop: s.sm },
  chipRow: { marginBottom: s.sm },
  chip: { paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: 9999, marginRight: s.sm, marginBottom: s.xs, backgroundColor: colors.border },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: '#fff' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
  classList: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginBottom: s.md },
  classChip: { paddingHorizontal: s.md, paddingVertical: s.xs, borderRadius: 9999, backgroundColor: colors.border },
  card: { marginBottom: s.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.xs },
  cardTitle: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  typeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: s.sm, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  cardPreview: { ...textStyles.caption, color: colors.textMuted, marginTop: s.xs },
  cardMeta: { ...textStyles.caption, color: colors.textSecondary, marginTop: s.xs },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s.sm },
  cardTime: { ...textStyles.caption, color: colors.textMuted },
  attachCount: { fontSize: 12, color: colors.textMuted },
  cardActions: { flexDirection: 'row', gap: s.lg, marginTop: s.md },
  actionLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
  actionDelete: { color: colors.danger },
  loader: { padding: s['3xl'] },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', marginTop: s.xl },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.lg, marginTop: s.lg },
  pageBtn: { fontSize: 14, fontWeight: '600', color: colors.primary },
  pageBtnDisabled: { opacity: 0.5 },
  pageNum: { fontSize: 14, color: colors.textMuted },
  bottomPad: { height: 40 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: s.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll: { maxHeight: '80%' },
  modalBox: { backgroundColor: colors.surface, borderRadius: 16, padding: s.xl },
  modalTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: s.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: s.md, fontSize: 14, color: colors.textPrimary, marginBottom: s.sm },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: s.md, justifyContent: 'flex-end', marginTop: s.lg },
});
