/**
 * Marks Entry: exam / class / subject selectors, marks grid, submit.
 * GET /api/examinations/v2/teacher, /api/classes/teacher + /api/classes (enrich),
 * GET /api/students?class=&section=&academic_year=&status=active,
 * GET /api/examinations/marks, POST /api/examinations/marks/submit.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo, useEffect } from 'react';
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
import {
  classPillLabel,
  enrichTeacherClassesFromSchool,
  looksLikeUuid,
  normalizeTeacherClassesFromApi,
  rosterClassQueryParam,
  str,
  unwrapSchoolClassesPayload,
  type TeacherClassRow,
} from '@/lib/teacher-class-roster';
import { teacherService } from '@/services/teacher.service';
import { schoolService } from '@/services/school.service';
import { examinationService } from '@/services/examination.service';
import { useToastStore } from '@/lib/toast';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type ExamSubject = {
  id: string;
  name: string;
};

type ExamRow = {
  id: string;
  /** Some backends use exam_id for marks APIs while list row id is a schedule row */
  exam_id?: string;
  name?: string;
  exam_name?: string;
  title?: string;
  exam_date?: string;
  start_date?: string;
  subjects?: unknown[];
  subject_name?: string;
  subject?: string;
  [k: string]: unknown;
};

type StudentRow = {
  id: string;
  student_id?: string;
  name?: string;
  admission_no?: string;
  student_name?: string;
  full_name?: string;
  [k: string]: unknown;
};

type MarkRow = { student_id: string; marks?: string; grade?: string };

function unwrapTeacherExamsPayload(raw: unknown): ExamRow[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) arr = o.data;
    else if (Array.isArray(o.exams)) arr = o.exams;
    else if (Array.isArray(o.schedules)) arr = o.schedules;
    else if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
      const d = o.data as Record<string, unknown>;
      if (Array.isArray(d.exams)) arr = d.exams;
      else if (Array.isArray(d.data)) arr = d.data;
      else if (Array.isArray(d.schedules)) arr = d.schedules;
      else if (Array.isArray(d.items)) arr = d.items;
    }
  }
  return arr.map(normalizeExamRow).filter((e) => Boolean(str(e.id)));
}

function normalizeExamRow(item: unknown): ExamRow {
  if (!item || typeof item !== 'object') return { id: '' };
  const o = item as Record<string, unknown>;
  const examId = str(o.exam_id ?? o.examination_id);
  const rowId = str(o.id ?? o.schedule_id ?? o.slot_id);
  const id = rowId || examId;
  const name =
    str(o.name) ||
    str(o.exam_name) ||
    str(o.title) ||
    str(o.exam_title) ||
    str(o.examination_name) ||
    str(o.exam_type) ||
    str(o.type);
  const exam_date = str(o.exam_date) || str(o.start_date) || str(o.date) || str(o.scheduled_date);
  const subject_line = str(o.subject_name) || str(o.subject) || str(o.subject_title);
  const subjects = Array.isArray(o.subjects) ? o.subjects : Array.isArray(o.subject_list) ? o.subject_list : undefined;
  return {
    ...o,
    id,
    exam_id: examId || undefined,
    name: name || undefined,
    exam_name: str(o.exam_name) || undefined,
    exam_date: exam_date || undefined,
    start_date: str(o.start_date) || undefined,
    subject_name: subject_line || undefined,
    subjects,
  };
}

function firstSubjectFromExam(e: ExamRow | undefined): ExamSubject | null {
  if (!e) return null;
  const flatId = str((e as { subject_id?: string }).subject_id);
  const flatName = str(e.subject_name) || str(e.subject);
  if (flatId) return { id: flatId, name: flatName || 'Subject' };
  const subs = e.subjects;
  if (Array.isArray(subs) && subs.length > 0) {
    const s = subs[0] as Record<string, unknown>;
    const id = str(s.id ?? s.subject_id);
    if (!id) return null;
    const name = str(s.subject_name) || str(s.name) || str(s.subject) || 'Subject';
    return { id, name };
  }
  return null;
}

function examSubjectsList(e: ExamRow | undefined): ExamSubject[] {
  if (!e) return [];
  const flatId = str((e as { subject_id?: string }).subject_id);
  const flatName = str(e.subject_name) || str(e.subject) || str((e as { subject_title?: string }).subject_title);
  if (flatId) return [{ id: flatId, name: flatName || 'Subject' }];
  if (!e.subjects || !Array.isArray(e.subjects)) return [];
  const out: ExamSubject[] = [];
  for (const raw of e.subjects) {
    if (!raw || typeof raw !== 'object') continue;
    const s = raw as Record<string, unknown>;
    const id = str(s.id ?? s.subject_id);
    if (!id) continue;
    const name = str(s.subject_name) || str(s.name) || str(s.subject) || 'Subject';
    out.push({ id, name });
  }
  return out;
}

function examChipLabel(e: ExamRow): string {
  const title = str(e.name) || str(e.exam_name) || str(e.title);
  const date = str(e.exam_date) || str(e.start_date);
  const rowSubj = str(e.subject_name) || str(e.subject);
  const nested = firstSubjectFromExam(e)?.name ?? '';
  const subj = rowSubj || nested;
  if (title && subj && date) return `${title} · ${subj}`;
  if (title && subj) return `${title} · ${subj}`;
  if (title && date) return `${title} (${date})`;
  if (title) return title;
  if (subj && date) return `${subj} (${date})`;
  if (subj) return subj;
  if (date) return `Exam (${date})`;
  return 'Exam';
}

function normalizeStudentsPayload(raw: unknown): StudentRow[] {
  if (Array.isArray(raw)) return raw as StudentRow[];
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data as StudentRow[];
  if (Array.isArray(o.students)) return o.students as StudentRow[];
  const d = o.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data as StudentRow[];
    if (Array.isArray(inner.students)) return inner.students as StudentRow[];
  }
  return [];
}

/** Marks / submit APIs expect examination id when available */
function examIdForApi(e: ExamRow | undefined): string {
  if (!e) return '';
  return str(e.exam_id) || str(e.examination_id) || e.id;
}

export default function TeacherMarksEntryScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});

  const { data: examsRaw, isLoading: loadingExams } = useQuery({
    queryKey: ['teacher', 'exams', schoolCode, teacher?.id, teacher?.staff_id, 'marks'],
    queryFn: () =>
      teacherService
        .getExams({
          school_code: schoolCode,
          teacher_id: teacher?.id ?? '',
          staff_id: teacher?.staff_id,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id, teacher?.staff_id, 'marks'],
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

  const { data: schoolClassesPayload, isLoading: loadingSchoolClasses } = useQuery({
    queryKey: ['school', 'classes', schoolCode, 'marks-enrich'],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
    staleTime: 60_000,
  });

  const examsList = useMemo(() => unwrapTeacherExamsPayload(examsRaw), [examsRaw]);

  const teacherClassesBase = useMemo(() => normalizeTeacherClassesFromApi(classesData), [classesData]);
  const schoolClassesList = useMemo(() => unwrapSchoolClassesPayload(schoolClassesPayload), [schoolClassesPayload]);
  const classesList = useMemo(
    () => enrichTeacherClassesFromSchool(teacherClassesBase, schoolClassesList),
    [teacherClassesBase, schoolClassesList]
  );

  useEffect(() => {
    if (!classId && classesList.length > 0) setClassId(String(classesList[0].id));
  }, [classesList, classId]);

  const selectedClass = useMemo(
    () => classesList.find((c) => String(c.id) === String(classId)),
    [classesList, classId]
  );

  const selectedExam = useMemo(
    () => examsList.find((e) => String(e.id) === String(examId)),
    [examsList, examId]
  );

  const examSubjects = useMemo(() => examSubjectsList(selectedExam), [selectedExam]);
  const examIdApi = examIdForApi(selectedExam);

  useEffect(() => {
    const subs = examSubjectsList(selectedExam);
    if (subs.length === 0) {
      setSubjectId('');
      return;
    }
    setSubjectId((prev) => (prev && subs.some((s) => s.id === prev) ? prev : subs[0].id));
  }, [selectedExam]);

  const rosterClassParam = rosterClassQueryParam(selectedClass);
  const rosterQueryOk =
    Boolean(schoolCode && classId && selectedClass) &&
    Boolean(rosterClassParam) &&
    !looksLikeUuid(rosterClassParam);

  const { data: studentsRaw, isLoading: loadingStudents } = useQuery({
    queryKey: [
      'students',
      'marks-entry',
      schoolCode,
      classId,
      rosterClassParam,
      selectedClass?.section ?? '',
      selectedClass?.academic_year ?? '',
    ],
    queryFn: () => {
      const params: {
        class: string;
        section?: string;
        academic_year?: string;
        status?: string;
      } = { class: rosterClassParam, status: 'active' };
      const sec = selectedClass?.section;
      if (sec != null && String(sec).trim()) params.section = String(sec).trim();
      const ay = selectedClass?.academic_year;
      if (ay != null && String(ay).trim()) params.academic_year = String(ay).trim();
      return schoolService.getStudents(schoolCode, params).then((r) => r.data);
    },
    enabled: rosterQueryOk,
  });

  const marksQueryEnabled =
    Boolean(schoolCode && classId && examIdApi) && (examSubjects.length === 0 || Boolean(subjectId));

  const { data: marksRes, isLoading: loadingMarks } = useQuery({
    queryKey: ['examinations', 'marks', schoolCode, examIdApi, classId, subjectId],
    queryFn: () =>
      examinationService
        .getExaminationMarks(schoolCode, {
          exam_id: examIdApi,
          class_id: classId,
          subject_id: subjectId || undefined,
        })
        .then((r) => r.data),
    enabled: marksQueryEnabled,
  });

  const studentsList = useMemo(() => {
    const raw = normalizeStudentsPayload(studentsRaw);
    return raw.map((s) => ({
      ...s,
      id: String(s.id ?? s.student_id ?? '').trim(),
      name: str(s.name) || str(s.student_name) || str(s.full_name) || str(s.admission_no) || 'Student',
    })).filter((s) => s.id);
  }, [studentsRaw]);

  const existingMarks =
    (marksRes as { marks?: MarkRow[]; data?: MarkRow[] })?.marks ??
    (marksRes as { data?: MarkRow[] })?.data ??
    [];
  const existingMarksMap = Object.fromEntries(
    (existingMarks as MarkRow[]).map((m) => [m.student_id, m.marks ?? m.grade ?? ''])
  );

  const submitMutation = useMutation({
    mutationFn: (body: { exam_id: string; marks: Array<Record<string, unknown>> }) =>
      examinationService.submitMarks(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations', 'marks', schoolCode, examIdApi, classId, subjectId] });
      showToast('Marks submitted', 'success');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Submit failed', 'error');
    },
  });

  const handleSubmit = useCallback(() => {
    if (!examIdApi) {
      showToast('Select an exam', 'error');
      return;
    }
    if (examSubjects.length > 0 && !subjectId) {
      showToast('Select a subject', 'error');
      return;
    }
    const marks = studentsList
      .map((s) => ({
        student_id: s.id,
        marks: marksMap[s.id] ?? '',
        grade: (marksMap[s.id] ?? '').trim() || undefined,
      }))
      .filter((m) => m.student_id);
    submitMutation.mutate({ exam_id: examIdApi, marks });
  }, [examIdApi, examSubjects.length, subjectId, studentsList, marksMap, submitMutation, showToast]);

  const rosterBlocked =
    Boolean(classId && selectedClass) &&
    !rosterQueryOk &&
    !loadingClasses &&
    !loadingSchoolClasses &&
    !loadingStudents;

  const loadingGrid =
    (loadingMarks && marksQueryEnabled) ||
    (loadingStudents && rosterQueryOk) ||
    (Boolean(schoolCode && classesList.length > 0) && loadingSchoolClasses);

  const showStudentGrid = rosterQueryOk && examId && (examSubjects.length === 0 || subjectId);

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
        {loadingExams && examsList.length === 0 ? (
          <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
        ) : examsList.length === 0 ? (
          <Text style={styles.hint}>No exams assigned. Check Examinations or teaching assignments.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {examsList.map((e) => {
              const active = String(examId) === String(e.id);
              return (
                <Pressable
                  key={String(e.id)}
                  style={[styles.chip, active && { backgroundColor: TEACHER_GREEN }]}
                  onPress={() => {
                    setExamId(String(e.id));
                    setMarksMap({});
                    const subs = examSubjectsList(e);
                    setSubjectId(subs[0]?.id ?? '');
                  }}
                >
                  <Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={2}>
                    {examChipLabel(e)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.label}>Class</Text>
        {loadingClasses && classesList.length === 0 ? (
          <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {classesList.map((c: TeacherClassRow) => {
              const active = String(classId) === String(c.id);
              return (
                <Pressable
                  key={String(c.id)}
                  style={[styles.chip, active && { backgroundColor: TEACHER_GREEN }]}
                  onPress={() => {
                    setClassId(String(c.id));
                    setMarksMap({});
                  }}
                >
                  <Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={2}>
                    {classPillLabel(c)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {examSubjects.length > 1 ? (
          <>
            <Text style={styles.label}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {examSubjects.map((s) => {
                const active = subjectId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    style={[styles.chip, active && { backgroundColor: TEACHER_GREEN }]}
                    onPress={() => {
                      setSubjectId(s.id);
                      setMarksMap({});
                    }}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={2}>
                      {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {loadingGrid && showStudentGrid ? (
          <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
        ) : rosterBlocked ? (
          <Text style={styles.hint}>
            Could not resolve class grade/section for this class. Sync Classes in admin and try again.
          </Text>
        ) : showStudentGrid && studentsList.length > 0 ? (
          <>
            {studentsList.map((s) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {s.name}
                </Text>
                <TextInput
                  style={styles.marksInput}
                  value={marksMap[s.id] ?? existingMarksMap[s.id] ?? ''}
                  onChangeText={(t) => setMarksMap((p) => ({ ...p, [s.id]: t }))}
                  placeholder="Marks"
                  keyboardType="numeric"
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
          <Text style={styles.hint}>
            {!examId || !classId
              ? 'Select exam and class to load students.'
              : rosterQueryOk && !loadingStudents && studentsList.length === 0
                ? 'No active students match this class and section.'
                : 'Loading or select a subject if shown above.'}
          </Text>
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
  label: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    marginRight: spacing[2],
    backgroundColor: '#E5E7EB',
    maxWidth: 220,
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
    width: 80,
    ...textStyles.body,
  },
  submitBtn: { marginTop: spacing[6], padding: spacing[4], borderRadius: 12, alignItems: 'center' },
  submitText: { ...textStyles.button, color: '#fff' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
