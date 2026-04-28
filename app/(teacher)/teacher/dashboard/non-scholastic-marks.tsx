/**
 * Non-scholastic rubric entry with fast grade chips.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { schoolService } from '@/services/school.service';
import { examinationService } from '@/services/examination.service';
import { useToastStore } from '@/lib/toast';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type Exam = { id: string; name?: string; [k: string]: unknown };
type ClassRow = { id: string; name?: string; class_name?: string; section?: string };
type StudentRow = { id: string; name?: string; admission_no?: string };
type MarkRow = { student_id: string; marks?: string; grade?: string };

function isNonScholasticExam(e: Exam): boolean {
  const cat = String(e.exam_category ?? e.category ?? '').toLowerCase();
  const t = String(e.type ?? e.exam_type ?? '').toLowerCase();
  const n = String(e.name ?? '').toLowerCase();
  return cat.includes('non') || e.is_non_scholastic === true || t.includes('non') || n.includes('non') || n.includes('co-scholastic');
}

export default function TeacherNonScholasticMarksScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [activityFilter, setActivityFilter] = useState('All Activities');
  const gradeScale = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E'];

  const { data: examsRes } = useQuery({
    queryKey: ['teacher', 'exams', schoolCode, teacher?.id, 'non-scholastic'],
    queryFn: () => teacherService.getExams({ school_code: schoolCode, teacher_id: teacher?.id ?? '' }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });

  const { data: classesRes } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id, teacher?.staff_id],
    queryFn: () =>
      teacherService.getClasses({ school_code: schoolCode, teacher_id: teacher?.id ?? '', staff_id: teacher?.staff_id, array: true }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });

  const { data: studentsRes, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', schoolCode, classId, 'non-scholastic'],
    queryFn: () => schoolService.getStudents(schoolCode, classId ? { class: classId } : undefined).then((r) => r.data),
    enabled: Boolean(schoolCode && classId),
  });

  const { data: marksRes, isLoading: loadingMarks } = useQuery({
    queryKey: ['examinations', 'marks', schoolCode, examId, classId, 'non-scholastic'],
    queryFn: () => examinationService.getExaminationMarks(schoolCode, { exam_id: examId, class_id: classId }).then((r) => r.data),
    enabled: Boolean(schoolCode && examId && classId),
  });

  const examsListAll = useMemo(() => (Array.isArray(examsRes) ? examsRes : (examsRes as { data?: Exam[] })?.data ?? []) as Exam[], [examsRes]);
  const examsList = useMemo(() => {
    const tagged = examsListAll.filter(isNonScholasticExam);
    return tagged.length > 0 ? tagged : examsListAll;
  }, [examsListAll]);
  const showAllExamsHint = examsListAll.length > 0 && !examsListAll.some(isNonScholasticExam);

  const classesList = (Array.isArray(classesRes) ? classesRes : (classesRes as { data?: ClassRow[] })?.data ?? []) as ClassRow[];
  const studentsList = (Array.isArray(studentsRes) ? studentsRes : (studentsRes as { data?: StudentRow[] })?.data ?? []) as StudentRow[];
  const existingMarks = (marksRes as { marks?: MarkRow[]; data?: MarkRow[] })?.marks ?? (marksRes as { data?: MarkRow[] })?.data ?? [];
  const existingMarksMap = Object.fromEntries((existingMarks as MarkRow[]).map((m) => [m.student_id, m.marks ?? m.grade ?? '']));
  const enteredCount = useMemo(
    () => studentsList.filter((s) => String((marksMap[s.id] ?? existingMarksMap[s.id] ?? '')).trim().length > 0).length,
    [studentsList, marksMap, existingMarksMap]
  );
  const completionPct = studentsList.length > 0 ? Math.round((enteredCount / studentsList.length) * 100) : 0;

  useEffect(() => {
    if (!examId && examsList.length > 0) setExamId(String(examsList[0].id));
  }, [examId, examsList]);

  useEffect(() => {
    if (!classId && classesList.length > 0) setClassId(String(classesList[0].id));
  }, [classId, classesList]);

  const submitMutation = useMutation({
    mutationFn: (body: { exam_id: string; marks: Array<Record<string, unknown>> }) => examinationService.submitMarks(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations', 'marks', schoolCode, examId, classId, 'non-scholastic'] });
      showToast('Non-scholastic marks saved', 'success');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Submit failed', 'error');
    },
  });

  const handleSubmit = useCallback(() => {
    if (!examId) {
      showToast('Select a term/exam', 'error');
      return;
    }
    const marks = studentsList.map((s) => ({ student_id: s.id, marks: marksMap[s.id] ?? '', grade: (marksMap[s.id] ?? '').trim() || undefined })).filter((m) => m.student_id);
    submitMutation.mutate({ exam_id: examId, marks });
  }, [examId, studentsList, marksMap, submitMutation, showToast]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Non-Scholastic Marks</Text>
          <Text style={styles.subTitle}>Rubric Entry</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#ECFDF3', '#D1FAE5']} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Behavioral & Activity Grades</Text>
              <Text style={styles.heroSub}>{enteredCount}/{studentsList.length || 0} rated</Text>
            </View>
            <Text style={styles.heroPct}>{completionPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
          </View>
        </LinearGradient>

        {showAllExamsHint ? <Text style={styles.banner}>No exams tagged as non-scholastic in API; showing all assigned exams.</Text> : null}

        <Text style={styles.label}>Term</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {examsList.map((e) => (
            <Pressable key={e.id} style={[styles.chip, examId === e.id && styles.chipActive]} onPress={() => setExamId(e.id)}>
              <Ionicons name="calendar-outline" size={14} color={examId === e.id ? '#fff' : '#166534'} />
              <Text style={[styles.chipText, examId === e.id && { color: '#fff' }]} numberOfLines={1}>{e.name ?? e.id}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {classesList.map((c) => (
            <Pressable key={c.id} style={[styles.chip, classId === c.id && styles.chipActive]} onPress={() => setClassId(c.id)}>
              <Ionicons name="school-outline" size={14} color={classId === c.id ? '#fff' : '#166534'} />
              <Text style={[styles.chipText, classId === c.id && { color: '#fff' }]}>{(c.class_name ?? c.name ?? c.id) + (c.section ? `-${c.section}` : '')}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Activity</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {['All Activities', 'Discipline', 'Participation', 'Communication', 'Leadership'].map((x) => (
            <Pressable key={x} style={[styles.chip, activityFilter === x && styles.chipActive]} onPress={() => setActivityFilter(x)}>
              <Text style={[styles.chipText, activityFilter === x && { color: '#fff' }]}>{x}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {(loadingMarks || loadingStudents) && examId && classId ? (
          <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
        ) : studentsList.length > 0 ? (
          <>
            {studentsList.map((s, idx) => (
              <View key={s.id} style={styles.studentCard}>
                <View style={styles.studentHead}>
                  <Text style={styles.studentIndex}>{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName} numberOfLines={1}>{s.name ?? s.admission_no ?? s.id}</Text>
                    <Text style={styles.activityText}>{activityFilter}</Text>
                  </View>
                </View>
                <View style={styles.gradeRow}>
                  {gradeScale.map((g) => {
                    const active = (marksMap[s.id] ?? existingMarksMap[s.id] ?? '') === g;
                    return (
                      <Pressable key={`${s.id}-${g}`} style={[styles.gradeChip, active && styles.gradeChipActive]} onPress={() => setMarksMap((p) => ({ ...p, [s.id]: g }))}>
                        <Text style={[styles.gradeChipText, active && styles.gradeChipTextActive]}>{g}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <Text style={styles.progressText}>Rated {enteredCount}/{studentsList.length} students</Text>
            <Pressable style={[styles.submitBtn, { backgroundColor: TEACHER_GREEN }]} onPress={handleSubmit} disabled={submitMutation.isPending}>
              <Text style={styles.submitText}>Submit marks</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.hint}>Select term and class to load student rubric cards.</Text>
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
  subTitle: { ...textStyles.caption, color: '#64748B' },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  heroCard: { borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 14, padding: spacing[4], marginBottom: spacing[3] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  heroTitle: { ...textStyles.h4, color: '#14532D' },
  heroSub: { ...textStyles.bodySm, color: '#166534' },
  heroPct: { ...textStyles.body, color: '#fff', backgroundColor: '#14532D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: '#DCFCE7', overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#16A34A' },
  banner: { ...textStyles.bodySm, color: '#92400E', backgroundColor: '#FEF3C7', padding: spacing[3], borderRadius: 8, marginBottom: spacing[3] },
  label: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 10, marginRight: spacing[2], backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0' },
  chipActive: { backgroundColor: TEACHER_GREEN, borderColor: TEACHER_GREEN },
  chipText: { ...textStyles.body, color: '#374151' },
  loader: { marginVertical: spacing[4] },
  studentCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7', padding: spacing[3], marginBottom: spacing[2] },
  studentHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] },
  studentIndex: { ...textStyles.caption, color: '#166534', width: 22, height: 22, textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#DCFCE7', borderRadius: 11, overflow: 'hidden', marginRight: spacing[2] },
  rowName: { ...textStyles.body, color: '#111827', flex: 1, fontWeight: '600' },
  activityText: { ...textStyles.caption, color: '#64748B' },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  gradeChip: { minWidth: 40, paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: 999, borderWidth: 1, borderColor: '#BBF7D0', backgroundColor: '#F8FFFA', alignItems: 'center' },
  gradeChipActive: { backgroundColor: TEACHER_GREEN, borderColor: TEACHER_GREEN },
  gradeChipText: { ...textStyles.bodySm, color: '#166534', fontWeight: '600' },
  gradeChipTextActive: { color: '#fff' },
  submitBtn: { marginTop: spacing[6], padding: spacing[4], borderRadius: 12, alignItems: 'center' },
  progressText: { ...textStyles.bodySm, color: '#64748B', marginTop: spacing[3] },
  submitText: { ...textStyles.button, color: '#fff' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
