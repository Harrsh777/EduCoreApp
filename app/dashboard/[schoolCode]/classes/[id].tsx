/**
 * Class detail: GET /api/classes/[id]/subjects; PATCH subject-teacher assignment.
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { useToastStore } from '@/lib/toast';
import { Button, SectionHeader } from '@/components/ui';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

type SubjectRow = { id: string; subject_id?: string; subject_name?: string; teacher_id?: string; teacher_name?: string; [k: string]: unknown };

export default function ClassDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { schoolCode } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const { data: subjectsRes, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['classes', id, 'subjects', schoolCode],
    queryFn: () => schoolService.getClassSubjects(schoolCode, id ?? '').then((r) => r.data),
    enabled: Boolean(schoolCode && id),
  });

  const raw = subjectsRes as { subjects?: SubjectRow[]; data?: SubjectRow[] } | undefined;
  const subjects = (raw?.subjects ?? raw?.data ?? []) as SubjectRow[];

  useEffect(() => {
    if (!subjects.length) return;
    const next: Record<string, string> = {};
    subjects.forEach((s) => {
      const key = s.subject_id ?? s.id;
      if (key) next[key] = String(s.teacher_id ?? s.teacher_name ?? '');
    });
    setAssignments((prev) => (Object.keys(prev).length ? prev : next));
  }, [subjects.length]);

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      schoolService.updateClassSubjects(schoolCode, id ?? '', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', id, 'subjects', schoolCode] });
      queryClient.invalidateQueries({ queryKey: ['classes', schoolCode] });
      showToast('Saved', 'success');
      setEditing(false);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Save failed', 'error');
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate({ subjects: assignments });
  }, [assignments, updateMutation]);

  if (!schoolCode || !id) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Class {id}</Text>
        {!editing ? (
          <Pressable style={styles.headerBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.headerBtn} onPress={() => setEditing(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>
      {isLoading && !subjects.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load subjects'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <SectionHeader title="Subject – Teacher" />
            {subjects.length === 0 ? (
              <Text style={styles.empty}>No subjects for this class.</Text>
            ) : (
              subjects.map((s) => {
                const key = s.subject_id ?? s.id;
                const teacher = assignments[key] ?? s.teacher_name ?? s.teacher_id ?? '';
                return (
                  <View key={key} style={styles.card}>
                    <Text style={styles.subjectName}>{s.subject_name ?? s.id ?? '—'}</Text>
                    {editing ? (
                      <FloatingLabelInput
                        label="Teacher ID / name"
                        value={teacher}
                        onChangeText={(v) => setAssignments((a) => ({ ...a, [key]: v }))}
                      />
                    ) : (
                      <Text style={styles.teacherName}>{teacher || '—'}</Text>
                    )}
                  </View>
                );
              })
            )}
            {editing && subjects.length > 0 ? (
              <Button title="Save" onPress={handleSave} loading={updateMutation.isPending} style={styles.saveBtn} />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2] },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  headerBtn: { padding: spacing[2] },
  editText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  cancelText: { fontSize: 16, color: '#6B7280' },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  errorText: { ...textStyles.bodySm, color: '#B91C1C', marginBottom: spacing[4] },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: INDIGO },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: spacing[4], marginBottom: spacing[3], borderWidth: 1, borderColor: '#E5E7EB' },
  subjectName: { ...textStyles.body, color: '#111827', fontWeight: '600', marginBottom: spacing[2] },
  teacherName: { ...textStyles.bodySm, color: '#6B7280' },
  empty: { ...textStyles.bodySm, color: '#6B7280' },
  saveBtn: { marginTop: spacing[6] },
});
