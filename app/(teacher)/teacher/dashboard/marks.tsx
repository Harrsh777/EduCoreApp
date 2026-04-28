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
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [draftMarksBySubject, setDraftMarksBySubject] = useState<Record<string, Record<string, string>>>({});
  const [absentBySubject, setAbsentBySubject] = useState<Record<string, Record<string, boolean>>>({});
  const [auditNote, setAuditNote] = useState('');

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
  const { data: assignmentsRaw } = useQuery({
    queryKey: ['teacher', 'teaching-assignments', schoolCode, teacher?.id],
    queryFn: () =>
      teacherService
        .getTeachingAssignments({
          school_code: schoolCode,
          teacher_id: teacher?.id ?? '',
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });

  const teacherClassesBase = useMemo(() => normalizeTeacherClassesFromApi(classesData), [classesData]);
  const schoolClassesList = useMemo(() => unwrapSchoolClassesPayload(schoolClassesPayload), [schoolClassesPayload]);
  const classesList = useMemo(
    () => enrichTeacherClassesFromSchool(teacherClassesBase, schoolClassesList),
    [teacherClassesBase, schoolClassesList]
  );

  useEffect(() => {
    if (!examId && examsList.length > 0) {
      setExamId(String(examsList[0].id));
    }
  }, [examsList, examId]);

  useEffect(() => {
    if (!classId && classesList.length > 0) setClassId(String(classesList[0].id));
  }, [classesList, classId]);

  const classChoices = useMemo(() => {
    const names = new Set<string>();
    for (const c of classesList) {
      const key = str((c as { class_name?: string }).class_name) || str((c as { class?: string }).class) || str(c.name);
      if (key) names.add(key);
    }
    return Array.from(names);
  }, [classesList]);

  const sectionChoices = useMemo(() => {
    if (!selectedClassName) return [];
    const sections = new Set<string>();
    for (const c of classesList) {
      const className =
        str((c as { class_name?: string }).class_name) || str((c as { class?: string }).class) || str(c.name);
      if (className !== selectedClassName) continue;
      const sec = str(c.section);
      if (sec) sections.add(sec);
    }
    return Array.from(sections);
  }, [classesList, selectedClassName]);

  useEffect(() => {
    if (!selectedClassName && classChoices.length > 0) setSelectedClassName(classChoices[0]);
  }, [classChoices, selectedClassName]);

  useEffect(() => {
    if (!selectedSection && sectionChoices.length > 0) setSelectedSection(sectionChoices[0]);
  }, [sectionChoices, selectedSection]);

  useEffect(() => {
    const match = classesList.find((c) => {
      const className =
        str((c as { class_name?: string }).class_name) || str((c as { class?: string }).class) || str(c.name);
      return className === selectedClassName && str(c.section) === selectedSection;
    });
    if (match && String(match.id) !== String(classId)) setClassId(String(match.id));
  }, [classesList, selectedClassName, selectedSection, classId]);

  const selectedClass = useMemo(
    () => classesList.find((c) => String(c.id) === String(classId)),
    [classesList, classId]
  );

  const selectedExam = useMemo(
    () => examsList.find((e) => String(e.id) === String(examId)),
    [examsList, examId]
  );

  const examSubjects = useMemo(() => {
    const direct = examSubjectsList(selectedExam);
    if (direct.length > 0) return direct;
    const body = assignmentsRaw as { data?: { assignments?: unknown[] } } | undefined;
    const assignments =
      (Array.isArray(body?.data?.assignments) ? body?.data?.assignments : Array.isArray((body as { assignments?: unknown[] })?.assignments) ? (body as { assignments?: unknown[] }).assignments : []) ?? [];
    const out: ExamSubject[] = [];
    for (const raw of assignments) {
      if (!raw || typeof raw !== 'object') continue;
      const a = raw as Record<string, unknown>;
      const id = str(a.subject_id ?? a.id);
      const name = str(a.subject_name ?? a.subject ?? a.name);
      if (!id) continue;
      if (!out.some((x) => x.id === id)) out.push({ id, name: name || 'Subject' });
    }
    return out;
  }, [selectedExam, assignmentsRaw]);
  const examIdApi = examIdForApi(selectedExam);
  const subjectMetaMap = useMemo(() => {
    const out: Record<string, { maxMarks: number }> = {};
    if (selectedExam?.subjects && Array.isArray(selectedExam.subjects)) {
      for (const raw of selectedExam.subjects) {
        if (!raw || typeof raw !== 'object') continue;
        const s = raw as Record<string, unknown>;
        const sid = str(s.id ?? s.subject_id);
        if (!sid) continue;
        const maxRaw = Number(s.max_marks ?? s.maximum_marks ?? s.total_marks ?? s.marks_out_of ?? 100);
        out[sid] = { maxMarks: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 100 };
      }
    }
    return out;
  }, [selectedExam]);
  const selectedSubjectMaxMarks = subjectId ? (subjectMetaMap[subjectId]?.maxMarks ?? 100) : 100;

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
  const currentMarksMap = draftMarksBySubject[subjectId] ?? {};
  const currentAbsentMap = absentBySubject[subjectId] ?? {};

  useEffect(() => {
    if (!subjectId) return;
    setDraftMarksBySubject((prev) => {
      if (prev[subjectId]) return prev;
      return { ...prev, [subjectId]: { ...existingMarksMap } };
    });
  }, [subjectId, existingMarksMap]);

  const deriveGrade = useCallback((pct: number): string => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  }, []);

  const enteredCount = useMemo(
    () =>
      studentsList.filter((s) => {
        const val = String((currentMarksMap[s.id] ?? existingMarksMap[s.id] ?? '')).trim();
        return val.length > 0 || Boolean(currentAbsentMap[s.id]);
      }).length,
    [studentsList, currentMarksMap, existingMarksMap, currentAbsentMap]
  );

  const submitMutation = useMutation({
    mutationFn: (body: { exam_id: string; marks: Array<Record<string, unknown>> }) =>
      examinationService.submitMarks(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations', 'marks', schoolCode, examIdApi, classId, subjectId] });
      setAuditNote(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      showToast('Marks submitted', 'success');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Submit failed', 'error');
    },
  });

  const submitCurrentDraft = useCallback(
    async (opts: { strict?: boolean } = {}) => {
      if (!examIdApi) throw new Error('Select exam');
      if (!subjectId) throw new Error('Select subject');
      if (!classId) throw new Error('Select class and section');
      if (studentsList.length === 0) throw new Error('No students found');
      const marksPayload = studentsList.map((s) => {
        const isAbsent = Boolean(currentAbsentMap[s.id]);
        const rawValue = String(currentMarksMap[s.id] ?? existingMarksMap[s.id] ?? '').trim();
        const parsed = Number(rawValue || 0);
        if (opts.strict && !isAbsent && !rawValue) throw new Error(`Missing marks for ${s.name}`);
        if (!isAbsent && rawValue && (parsed < 0 || parsed > selectedSubjectMaxMarks)) {
          throw new Error(`Marks for ${s.name} must be between 0 and ${selectedSubjectMaxMarks}`);
        }
        if (opts.strict && !isAbsent && parsed <= 0) throw new Error(`${s.name} must be > 0 or marked absent`);
        return {
          student_id: s.id,
          subject_id: subjectId,
          class_id: classId,
          marks: isAbsent ? 0 : rawValue,
          marks_entry_code: isAbsent ? 'AB' : undefined,
          grade: !isAbsent && rawValue ? deriveGrade((parsed / selectedSubjectMaxMarks) * 100) : undefined,
        };
      });
      await submitMutation.mutateAsync({ exam_id: examIdApi, marks: marksPayload });
    },
    [
      examIdApi,
      subjectId,
      classId,
      studentsList,
      currentAbsentMap,
      currentMarksMap,
      existingMarksMap,
      selectedSubjectMaxMarks,
      submitMutation,
      deriveGrade,
    ]
  );

  const hasUnsavedDraft = useMemo(() => {
    if (!subjectId) return false;
    return studentsList.some((s) => {
      const local = String(currentMarksMap[s.id] ?? '').trim();
      const remote = String(existingMarksMap[s.id] ?? '').trim();
      const absent = Boolean(currentAbsentMap[s.id]);
      return local !== remote || absent;
    });
  }, [subjectId, studentsList, currentMarksMap, existingMarksMap, currentAbsentMap]);

  const trySwitchSubject = useCallback(
    async (nextSubjectId: string) => {
      if (nextSubjectId === subjectId) return;
      if (!hasUnsavedDraft) {
        setSubjectId(nextSubjectId);
        return;
      }
      try {
        await submitCurrentDraft();
        setSubjectId(nextSubjectId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Auto-save failed';
        Alert.alert('Unsaved marks', `${msg}. Continue switching and discard unsaved changes?`, [
          { text: 'Stay', style: 'cancel' },
          { text: 'Continue', style: 'destructive', onPress: () => setSubjectId(nextSubjectId) },
        ]);
      }
    },
    [subjectId, hasUnsavedDraft, submitCurrentDraft]
  );

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
  const completionPct = studentsList.length > 0 ? Math.round((enteredCount / studentsList.length) * 100) : 0;

  return (
    <View style={styles.root}>
      <View style={styles.headerBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Marks Entry</Text>
          <Text style={styles.subtitle}>Scholastic</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>Exam Mark Entry</Text>
            <Text style={styles.progressBadgeText}>{completionPct}%</Text>
          </View>
          <Text style={styles.heroSub}>{enteredCount}/{studentsList.length || 0} students updated</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
          </View>
        </View>

        <Text style={styles.label}>Step 1: Select Exam</Text>
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
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setExamId(String(e.id));
                    const subs = examSubjectsList(e);
                    setSubjectId(subs[0]?.id ?? '');
                  }}
                >
                  <Ionicons name="document-text-outline" size={14} color={active ? '#fff' : '#166534'} />
                  <Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={2}>
                    {examChipLabel(e)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.label}>Step 2: Select Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {classChoices.map((name) => {
            const active = selectedClassName === name;
            return (
              <Pressable key={name} style={[styles.chip, active && styles.chipActive]} onPress={() => setSelectedClassName(name)}>
                <Text style={[styles.chipText, active && { color: '#fff' }]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.label}>Step 3: Select Section</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {sectionChoices.map((sec) => {
            const active = selectedSection === sec;
            return (
              <Pressable key={sec} style={[styles.chip, active && styles.chipActive]} onPress={() => setSelectedSection(sec)}>
                <Text style={[styles.chipText, active && { color: '#fff' }]}>{sec}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.label}>Class Mapping</Text>
        {loadingClasses && classesList.length === 0 ? (
          <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {classesList.map((c: TeacherClassRow) => {
              const active = String(classId) === String(c.id);
              return (
                <Pressable
                  key={String(c.id)}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setClassId(String(c.id));
                    const className =
                      str((c as { class_name?: string }).class_name) || str((c as { class?: string }).class) || str(c.name);
                    if (className) setSelectedClassName(className);
                    if (str(c.section)) setSelectedSection(str(c.section));
                  }}
                >
                  <Ionicons name="school-outline" size={14} color={active ? '#fff' : '#166534'} />
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
            <Text style={styles.label}>Step 4: Select Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {examSubjects.map((s) => {
                const active = subjectId === s.id;
                const maxForChip = subjectMetaMap[s.id]?.maxMarks ?? 100;
                return (
                  <Pressable
                    key={s.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => void trySwitchSubject(s.id)}
                  >
                    <Ionicons name="book-outline" size={14} color={active ? '#fff' : '#166534'} />
                    <Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={2}>
                      {s.name} · Max {maxForChip}
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
            <View style={styles.maxBar}>
              <Text style={styles.maxBarText}>Max Marks: {selectedSubjectMaxMarks}</Text>
              <Text style={styles.maxBarText}>Pass: 40%</Text>
            </View>
            {studentsList.map((s, idx) => (
              <View key={s.id} style={styles.rowCard}>
                <View style={styles.rowHead}>
                  <Text style={styles.rowIndex}>{idx + 1}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <View
                    style={[
                      styles.tag,
                      String((currentMarksMap[s.id] ?? existingMarksMap[s.id] ?? '')).trim() || currentAbsentMap[s.id]
                        ? styles.tagDone
                        : styles.tagPending,
                    ]}
                  >
                    <Text style={styles.tagText}>
                      {currentAbsentMap[s.id]
                        ? 'Absent'
                        : String((currentMarksMap[s.id] ?? existingMarksMap[s.id] ?? '')).trim()
                          ? 'Draft'
                          : 'Pending'}
                    </Text>
                  </View>
                </View>
                <View style={styles.entryRow}>
                  <TextInput
                    style={styles.marksInput}
                    value={currentMarksMap[s.id] ?? existingMarksMap[s.id] ?? ''}
                    onChangeText={(t) => {
                      const clean = t.replace(/[^0-9.]/g, '');
                      setDraftMarksBySubject((prev) => ({
                        ...prev,
                        [subjectId]: { ...(prev[subjectId] ?? {}), [s.id]: clean },
                      }));
                      if (Number(clean || 0) > 0) {
                        setAbsentBySubject((prev) => ({
                          ...prev,
                          [subjectId]: { ...(prev[subjectId] ?? {}), [s.id]: false },
                        }));
                      }
                    }}
                    onBlur={() => {
                      const value = Number(String(currentMarksMap[s.id] ?? existingMarksMap[s.id] ?? '').trim() || 0);
                      if (!currentAbsentMap[s.id] && value > selectedSubjectMaxMarks) {
                        showToast(`Max for this subject is ${selectedSubjectMaxMarks}`, 'error');
                      }
                    }}
                    placeholder="Marks"
                    keyboardType="numeric"
                  />
                  <Pressable
                    style={[styles.absentBtn, currentAbsentMap[s.id] && styles.absentBtnActive]}
                    onPress={() => {
                      const next = !currentAbsentMap[s.id];
                      setAbsentBySubject((prev) => ({
                        ...prev,
                        [subjectId]: { ...(prev[subjectId] ?? {}), [s.id]: next },
                      }));
                      if (next) {
                        setDraftMarksBySubject((prev) => ({
                          ...prev,
                          [subjectId]: { ...(prev[subjectId] ?? {}), [s.id]: '0' },
                        }));
                      }
                    }}
                  >
                    <Text style={[styles.absentBtnText, currentAbsentMap[s.id] && { color: '#fff' }]}>Absent</Text>
                  </Pressable>
                </View>
                {(() => {
                  const raw = Number(String(currentMarksMap[s.id] ?? existingMarksMap[s.id] ?? '').trim() || 0);
                  if (currentAbsentMap[s.id]) return <Text style={styles.calcText}>0 / {selectedSubjectMaxMarks} · 0.00% · F</Text>;
                  if (!Number.isFinite(raw) || raw < 0) return <Text style={styles.calcText}>--</Text>;
                  const pct = selectedSubjectMaxMarks > 0 ? (raw / selectedSubjectMaxMarks) * 100 : 0;
                  return (
                    <Text style={styles.calcText}>
                      {raw}/{selectedSubjectMaxMarks} · {pct.toFixed(2)}% · {deriveGrade(pct)}
                    </Text>
                  );
                })()}
              </View>
            ))}
            <Text style={styles.progressText}>
              Entered for {enteredCount}/{studentsList.length} students
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.saveBtn, submitMutation.isPending && styles.btnDisabled]}
                onPress={() =>
                  void submitCurrentDraft().catch((e) => showToast(e instanceof Error ? e.message : 'Save failed', 'error'))
                }
                disabled={submitMutation.isPending}
              >
                <Text style={styles.saveText}>Save Draft</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, submitMutation.isPending && styles.btnDisabled]}
                onPress={() =>
                  void submitCurrentDraft({ strict: true }).catch((e) =>
                    showToast(e instanceof Error ? e.message : 'Submit failed', 'error')
                  )
                }
                disabled={submitMutation.isPending}
              >
                <Text style={styles.submitText}>Finalize & Submit</Text>
              </Pressable>
            </View>
            {auditNote ? (
              <View style={styles.auditSnack}>
                <Ionicons name="checkmark-circle" size={14} color="#14532D" />
                <Text style={styles.auditText}>Audit: {auditNote}</Text>
              </View>
            ) : null}
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
  headerBar: {
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
  subtitle: { ...textStyles.caption, color: '#64748B' },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  heroCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  heroTitle: { ...textStyles.h4, color: '#14532D' },
  heroSub: { ...textStyles.bodySm, color: '#166534' },
  progressBadgeText: { ...textStyles.caption, color: '#14532D', fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: '#DCFCE7', overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#16A34A' },
  label: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 10,
    marginRight: spacing[2],
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    maxWidth: 220,
  },
  chipActive: { backgroundColor: TEACHER_GREEN, borderColor: TEACHER_GREEN },
  chipText: { ...textStyles.body, color: '#374151' },
  loader: { marginVertical: spacing[4] },
  rowCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] },
  rowIndex: {
    ...textStyles.caption,
    color: '#166534',
    width: 22,
    height: 22,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 11,
    overflow: 'hidden',
    marginRight: spacing[2],
  },
  rowName: { ...textStyles.body, color: '#111827', flex: 1, fontWeight: '600' },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagDone: { backgroundColor: '#DCFCE7' },
  tagPending: { backgroundColor: '#F3F4F6' },
  tagText: { ...textStyles.caption, color: '#166534' },
  marksInput: {
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: spacing[2],
    width: '100%',
    ...textStyles.body,
    backgroundColor: '#F8FFFA',
    flex: 1,
  },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  absentBtn: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  absentBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  absentBtnText: { ...textStyles.bodySm, color: '#B91C1C', fontWeight: '600' },
  maxBar: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginBottom: spacing[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  maxBarText: { ...textStyles.bodySm, color: '#166534', fontWeight: '600' },
  calcText: { ...textStyles.caption, color: '#64748B', marginTop: spacing[1] },
  actionRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[4] },
  saveBtn: {
    flex: 1,
    padding: spacing[3],
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  saveText: { ...textStyles.button, color: '#166534' },
  submitBtn: { flex: 1, padding: spacing[3], borderRadius: 12, alignItems: 'center', backgroundColor: TEACHER_GREEN },
  btnDisabled: { opacity: 0.6 },
  progressText: { ...textStyles.bodySm, color: '#64748B', marginTop: spacing[3] },
  submitText: { ...textStyles.button, color: '#fff' },
  auditSnack: {
    marginTop: spacing[3],
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  auditText: { ...textStyles.bodySm, color: '#14532D' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
