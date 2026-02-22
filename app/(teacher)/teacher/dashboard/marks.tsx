/**
 * Marks Entry (class teacher): exam/class/subject selector, marks grid, submit.
 * APIs: GET examinations/v2/teacher, classes/teacher, students, examinations/marks, marks/status, POST marks/submit.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { schoolService } from '@/services/school.service';
import { examinationService } from '@/services/examination.service';
import { useToastStore } from '@/lib/toast';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type Exam = { id: string; name?: string; exam_date?: string };
type ClassRow = { id: string; name?: string }
type StudentRow = { id: string; name?: string; admission_no?: string }
type MarkRow = { student_id: string; marks?: string; grade?: string }

export default function TeacherMarksEntryScreen() {
  const router = useRouter();
  const { schoolCode, teacher, path } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});

  const { data: examsRes } = useQuery({
    queryKey: ['teacher', 'exams', schoolCode, teacher?.id],
    queryFn: () => teacherService.getExams({ school_code: schoolCode, teacher_id: teacher?.id ?? '' }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });
  const { data: classesRes } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id],
    queryFn: () => teacherService.getClasses({ school_code: schoolCode, teacher_id: teacher?.id ?? '' }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });
  const { data: studentsRes, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', schoolCode, classId],
    queryFn: () => schoolService.getStudents(schoolCode, classId ? { class: classId } : undefined).then((r) => r.data),
    enabled: Boolean(schoolCode && classId),
  });
  const { data: marksRes, isLoading: loadingMarks } = useQuery({
    queryKey: ['examinations', 'marks', schoolCode, examId, classId, subjectId],
    queryFn: () =>
      examinationService.getExaminationMarks(schoolCode, { exam_id: examId, class_id: classId, subject_id: subjectId }).then((r) => r.data),
    enabled: Boolean(schoolCode && examId && (classId || subjectId)),
  });

  const examsList = (Array.isArray(examsRes) ? examsRes : (examsRes as { data?: Exam[] })?.data ?? []) as Exam[];
  const classesList = (Array.isArray(classesRes) ? classesRes : (classesRes as { data?: ClassRow[] })?.data ?? []) as ClassRow[];
  const studentsList = (Array.isArray(studentsRes) ? studentsRes : (studentsRes as { data?: StudentRow[] })?.data ?? []) as StudentRow[];
  const existingMarks = (marksRes as { marks?: MarkRow[]; data?: MarkRow[] })?.marks ?? (marksRes as { data?: MarkRow[] })?.data ?? [];

  const submitMutation = useMutation({
    mutationFn: (body: { exam_id: string; marks: Array<Record<string, unknown>> }) =>
      examinationService.submitMarks(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations', 'marks', schoolCode, examId, classId, subjectId] });
      showToast('Marks submitted', 'success');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Submit failed', 'error');
    },
  });

  const handleSubmit = useCallback(() => {
    if (!examId) {
      showToast('Select an exam', 'error');
      return;
    }
    const marks = studentsList
      .map((s) => ({ student_id: s.id, marks: marksMap[s.id] ?? '', grade: (marksMap[s.id] ?? '').trim() || undefined }))
      .filter((m) => m.student_id);
    submitMutation.mutate({ exam_id: examId, marks });
  }, [examId, studentsList, marksMap, submitMutation, showToast]);

  const existingMarksMap = Object.fromEntries((existingMarks as MarkRow[]).map((m) => [m.student_id, m.marks ?? m.grade ?? '']));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Marks Entry</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Exam</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {examsList.map((e) => (
            <Pressable key={e.id} style={[styles.chip, examId === e.id && { backgroundColor: TEACHER_GREEN }]} onPress={() => setExamId(e.id)}>
              <Text style={[styles.chipText, examId === e.id && { color: '#fff' }]} numberOfLines={1}>{e.name ?? e.id}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.label}>Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {classesList.map((c) => (
            <Pressable key={c.id} style={[styles.chip, classId === c.id && { backgroundColor: TEACHER_GREEN }]} onPress={() => setClassId(c.id)}>
              <Text style={[styles.chipText, classId === c.id && { color: '#fff' }]}>{c.name ?? c.id}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {(loadingMarks || loadingStudents) && examId && classId ? (
          <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
        ) : studentsList.length > 0 ? (
          <>
            {studentsList.map((s) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.rowName} numberOfLines={1}>{s.name ?? s.admission_no ?? s.id}</Text>
                <TextInput
                  style={styles.marksInput}
                  value={marksMap[s.id] ?? existingMarksMap[s.id] ?? ''}
                  onChangeText={(t) => setMarksMap((p) => ({ ...p, [s.id]: t }))}
                  placeholder="Marks"
                  keyboardType="numeric"
                />
              </View>
            ))}
            <Pressable style={[styles.submitBtn, { backgroundColor: TEACHER_GREEN }]} onPress={handleSubmit} disabled={submitMutation.isPending}>
              <Text style={styles.submitText}>Submit marks</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.hint}>Select exam and class to load students.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 56 },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  label: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 8, marginRight: spacing[2], backgroundColor: '#E5E7EB' },
  chipText: { ...textStyles.body, color: '#374151' },
  loader: { marginVertical: spacing[4] },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowName: { ...textStyles.body, color: '#111827', flex: 1 },
  marksInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: spacing[2], width: 80, ...textStyles.body },
  submitBtn: { marginTop: spacing[6], padding: spacing[4], borderRadius: 12, alignItems: 'center' },
  submitText: { ...textStyles.button, color: '#fff' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
