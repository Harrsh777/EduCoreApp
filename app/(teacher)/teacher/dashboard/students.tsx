/**
 * Student Management: directory GET /api/students?school_code=; detail GET /api/student/fees, /api/student/transport.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { schoolService } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { SearchBar } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type StudentRow = { id: string; name?: string; admission_no?: string; class?: string; section?: string };

function unwrapStudentList(raw: unknown): StudentRow[] {
  if (Array.isArray(raw)) return raw as StudentRow[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: StudentRow[] }).data)) {
    return (raw as { data: StudentRow[] }).data;
  }
  return [];
}

export default function TeacherStudentsScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();
  const [search, setSearch] = useState('');
  const [detailStudent, setDetailStudent] = useState<StudentRow | null>(null);

  const searchParam = search.trim().length >= 2 ? search.trim() : undefined;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['students', 'directory', schoolCode, searchParam ?? ''],
    queryFn: () =>
      schoolService.getStudents(schoolCode, searchParam ? { search: searchParam } : undefined).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const rawList = useMemo(() => unwrapStudentList(data), [data]);
  const list = searchParam
    ? rawList
    : rawList;

  const { data: feesRes, isLoading: feesLoading } = useQuery({
    queryKey: ['student', 'fees', schoolCode, detailStudent?.id],
    queryFn: () => studentService.getFees({ school_code: schoolCode, student_id: detailStudent!.id }),
    enabled: Boolean(schoolCode && detailStudent?.id),
  });
  const { data: transportRes, isLoading: transportLoading } = useQuery({
    queryKey: ['student', 'transport', schoolCode, detailStudent?.id],
    queryFn: () => studentService.getTransport({ school_code: schoolCode, student_id: detailStudent!.id }),
    enabled: Boolean(schoolCode && detailStudent?.id),
  });

  const feesPreview = useMemo(() => {
    const d = (feesRes as { data?: unknown })?.data ?? feesRes;
    if (d == null) return '—';
    if (typeof d === 'object') return JSON.stringify(d).slice(0, 800);
    return String(d);
  }, [feesRes]);

  const transportPreview = useMemo(() => {
    const d = (transportRes as { data?: unknown })?.data ?? transportRes;
    if (d == null) return '—';
    if (typeof d === 'object') return JSON.stringify(d).slice(0, 800);
    return String(d);
  }, [transportRes]);

  const renderItem = useCallback(
    ({ item }: { item: StudentRow }) => (
      <Pressable style={styles.row} onPress={() => setDetailStudent(item)}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name ?? item.admission_no ?? item.id}
        </Text>
        <Text style={styles.rowMeta}>
          {item.class ?? ''} {item.section ?? ''}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    ),
    []
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Students</Text>
      </View>
      <View style={styles.toolbar}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search (2+ chars uses API)…" />
      </View>
      {isLoading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEACHER_GREEN} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={[styles.retry, { color: TEACHER_GREEN }]}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No students.</Text>}
        />
      )}

      <Modal visible={detailStudent != null} transparent animationType="fade" onRequestClose={() => setDetailStudent(null)}>
        <View style={styles.modalWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDetailStudent(null)} />
          <View style={styles.modalCardOuter}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {detailStudent?.name ?? detailStudent?.admission_no ?? 'Student'}
              </Text>
              <Text style={styles.modalMeta}>
                {detailStudent?.class ?? ''} {detailStudent?.section ?? ''} · {detailStudent?.id}
              </Text>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.detailHeading}>Fees (GET /api/student/fees)</Text>
                {feesLoading ? (
                  <ActivityIndicator color={TEACHER_GREEN} style={styles.detailLoader} />
                ) : (
                  <Text style={styles.detailBody}>{feesPreview}</Text>
                )}
                <Text style={styles.detailHeading}>Transport (GET /api/student/transport)</Text>
                {transportLoading ? (
                  <ActivityIndicator color={TEACHER_GREEN} style={styles.detailLoader} />
                ) : (
                  <Text style={styles.detailBody}>{transportPreview}</Text>
                )}
              </ScrollView>
              <Pressable style={styles.modalClose} onPress={() => setDetailStudent(null)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  toolbar: { padding: spacing[4], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...textStyles.body, color: '#B91C1C', marginBottom: spacing[2] },
  retry: { ...textStyles.button },
  listContent: { padding: spacing[4], paddingBottom: spacing[8] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowName: { ...textStyles.body, fontWeight: '600', color: '#111827', flex: 1 },
  rowMeta: { ...textStyles.caption, color: '#6B7280', marginRight: spacing[2] },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  empty: { ...textStyles.body, color: '#6B7280' },
  modalWrap: { flex: 1, justifyContent: 'center' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCardOuter: { marginHorizontal: spacing[4] },
  modalCard: {
    maxHeight: '78%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: { ...textStyles.h4, color: '#111827' },
  modalMeta: { ...textStyles.caption, color: '#6B7280', marginBottom: spacing[3] },
  modalScroll: { maxHeight: 360 },
  detailHeading: { ...textStyles.bodySm, fontWeight: '700', color: '#374151', marginTop: spacing[2] },
  detailBody: { ...textStyles.caption, color: '#4B5563', marginTop: 4, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined }) },
  detailLoader: { marginVertical: spacing[2] },
  modalClose: {
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  modalCloseText: { fontWeight: '600', color: TEACHER_GREEN },
});
