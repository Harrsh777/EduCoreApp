/**
 * Non-Scholastic Marks (class teacher). Same flow as scholastic marks when API does not tag exams;
 * prefers exams with non_scholastic / exam_category / type hints when present.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
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

type Exam = { id: string; name?: string; exam_date?: string; [k: string]: unknown };
type ClassRow = { id: string; name?: string; class_name?: string; section?: string };
type StudentRow = { id: string; name?: string; admission_no?: string };
type MarkRow = { student_id: string; marks?: string; grade?: string };

function isNonScholasticExam(e: Exam): boolean {
  const cat = String(e.exam_category ?? e.category ?? '').toLowerCase();
  if (cat.includes('non')) return true;
  if (e.is_non_scholastic === true) return true;
  const t = String(e.type ?? e.exam_type ?? '').toLowerCase();
  if (t.includes('non')) return true;
  const n = String(e.name ?? '').toLowerCase();
  if (n.includes('non-scholastic') || n.includes('non scholastic') || n.includes('co-scholastic'))
    return true;
  return false;
}

export default function TeacherNonScholasticMarksScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});

  const { data: examsRes } = useQuery({
    queryKey: ['teacher', 'exams', schoolCode, teacher?.id, 'non-scholastic'],
    queryFn: () =>
      teacherService.getExams({ school_code: schoolCode, teacher_id: teacher?.id ?? '' }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });
  const { data: classesRes } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id, teacher?.staff_id],
    queryFn: () =>
      teacherService
        .getClasses({
          school_code: schoolCode,
          teacher_id: teacher?.id ?? '',
          staff_id: teacher?.staff_id,
          array: true,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });
  const { data: studentsRes, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', schoolCode, classId, 'non-scholastic'],
    queryFn: () => schoolService.getStudents(schoolCode, classId ? { class: classId } : undefined).then((r) => r.data),
    enabled: Boolean(schoolCode && classId),
  });
  const { data: marksRes, isLoading: loadingMarks } = useQuery({
    queryKey: ['examinations', 'marks', schoolCode, examId, classId, 'non-scholastic'],
    queryFn: () =>
      examinationService
        .getExaminationMarks(schoolCode, { exam_id: examId, class_id: classId })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && examId && classId),
  });

  const examsListAll = useMemo(() => {
    const raw = Array.isArray(examsRes) ? examsRes : (examsRes as { data?: Exam[] })?.data ?? [];
    return raw as Exam[];
  }, [examsRes]);

  const examsList = useMemo(() => {
    const tagged = examsListAll.filter(isNonScholasticExam);
    return tagged.length > 0 ? tagged : examsListAll;
  }, [examsListAll]);

  const showAllExamsHint = examsListAll.length > 0 && !examsListAll.some(isNonScholasticExam);

  const classesList = (
    Array.isArray(classesRes) ? classesRes : (classesRes as { data?: ClassRow[] })?.data ?? []
  ) as ClassRow[];
  const studentsList = (
    Array.isArray(studentsRes) ? studentsRes : (studentsRes as { data?: StudentRow[] })?.data ?? []
  ) as StudentRow[];
  const existingMarks =
    (marksRes as { marks?: MarkRow[]; data?: MarkRow[] })?.marks ??
    (marksRes as { data?: MarkRow[] })?.data ??
    [];

  const submitMutation = useMutation({
    mutationFn: (body: { exam_id: string; marks: Array<Record<string, unknown>> }) =>
      examinationService.submitMarks(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['examinations', 'marks', schoolCode, examId, classId, 'non-scholastic'],
      });
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
      .map((s) => ({
        student_id: s.id,
        marks: marksMap[s.id] ?? '',
        grade: (marksMap[s.id] ?? '').trim() || undefined,
      }))
      .filter((m) => m.student_id);
    submitMutation.mutate({ exam_id: examId, marks });
  }, [examId, studentsList, marksMap, submitMutation, showToast]);

  const existingMarksMap = Object.fromEntries(
    (existingMarks as MarkRow[]).map((m) => [m.student_id, m.marks ?? m.grade ?? ''])
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Non-Scholastic Marks</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {showAllExamsHint ? (
          <Text style={styles.banner}>
            No exams tagged as non-scholastic in the API response; showing all exams assigned to you.
          </Text>
        ) : null}
        <Text style={styles.label}>Exam</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {examsList.map((e) => (
            <Pressable
              key={e.id}
              style={[styles.chip, examId === e.id && { backgroundColor: TEACHER_GREEN }]}
              onPress={() => setExamId(e.id)}
            >
              <Text style={[styles.chipText, examId === e.id && { color: '#fff' }]} numberOfLines={1}>
                {e.name ?? e.id}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.label}>Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {classesList.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, classId === c.id && { backgroundColor: TEACHER_GREEN }]}
              onPress={() => setClassId(c.id)}
            >
              <Text style={[styles.chipText, classId === c.id && { color: '#fff' }]}>
                {(c.class_name ?? c.name ?? c.id) + (c.section ? `-${c.section}` : '')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {(loadingMarks || loadingStudents) && examId && classId ? (
          <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
        ) : studentsList.length > 0 ? (
          <>
            {studentsList.map((s) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {s.name ?? s.admission_no ?? s.id}
                </Text>
                <TextInput
                  style={styles.marksInput}
                  value={marksMap[s.id] ?? existingMarksMap[s.id] ?? ''}
                  onChangeText={(t) => setMarksMap((p) => ({ ...p, [s.id]: t }))}
                  placeholder="Grade"
                  keyboardType="default"
                />
              </View>
            ))}
            <Pressable
              style={[styles.submitBtn, { backgroundColor: TEACHER_GREEN }]}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
            >
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
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  banner: {
    ...textStyles.bodySm,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[3],
  },
  label: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    marginRight: spacing[2],
    backgroundColor: '#E5E7EB',
  },
  chipText: { ...textStyles.body, color: '#374151' },
  loader: { marginVertical: spacing[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowName: { ...textStyles.body, color: '#111827', flex: 1 },
  marksInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: spacing[2],
    width: 88,
    ...textStyles.body,
  },
  submitBtn: { marginTop: spacing[6], padding: spacing[4], borderRadius: 12, alignItems: 'center' },
  submitText: { ...textStyles.button, color: '#fff' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
