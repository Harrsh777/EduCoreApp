/**
 * Student Marks: premium UI, hero stats, search/filter, exam cards with subject breakdown.
 * APIs: GET /api/student/marks, GET /api/examinations/v2/student.
 * All data from API; calculations (%, grade) derived from marks.
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStudent } from '@/lib/student-context';
import { env } from '@/lib/env';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { examinationService } from '@/services/examination.service';

const PRIMARY = '#2D62FF';
const BG_START = '#F4F7FF';
const BG_END = '#FFFFFF';
const CARD_BG = '#FFFFFF';
const BORDER = '#E8ECF4';
const TEXT = '#1E293B';
const MUTED = '#64748B';
const RADIUS = 22;
const RADIUS_SM = 16;
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

const GRADE_STYLES: Record<string, { bg: string; text: string }> = {
  A: { bg: '#DCFCE7', text: '#166534' },
  B: { bg: '#DBEAFE', text: '#1D4ED8' },
  C: { bg: '#FEF3C7', text: '#B45309' },
  D: { bg: '#FEE2E2', text: '#B91C1C' },
};
const DEFAULT_GRADE = { bg: '#F1F5F9', text: MUTED };

function percentToGrade(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

type SubjectMark = {
  subject: string;
  marks: number;
  maxMarks: number;
  grade: string;
  percentage: number;
  status: string;
  subject_color?: string;
};

type ExamWithMarks = {
  id: string;
  name: string;
  status: string;
  subjects: SubjectMark[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
};

/** Canonical API shape: { data: [ { exam_id, exam_name, subjects: [ { subject_name, marks_obtained, max_marks, percentage, grade, subject_color, status } ], total_marks, total_max_marks, overall_percentage, overall_grade } ] } */
function parseMarksDataCanonical(body: unknown): ExamWithMarks[] | null {
  const data = (body as Record<string, unknown>)?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const result: ExamWithMarks[] = [];
  for (const exam of data as Record<string, unknown>[]) {
    const subjectsRaw = exam.subjects;
    if (!Array.isArray(subjectsRaw)) continue;
    const subjects: SubjectMark[] = [];
    for (const row of subjectsRaw as Record<string, unknown>[]) {
      const subjectName = String(row.subject_name ?? row.subject ?? row.name ?? '').trim();
      if (!subjectName) continue;
      const marksNum = Number(row.marks_obtained ?? row.marks ?? row.obtained ?? 0) || 0;
      const maxNum = Number(row.max_marks ?? row.max ?? 100) || 100;
      const pct = Number(row.percentage) || (maxNum > 0 ? Math.round((marksNum / maxNum) * 100) : 0);
      const gradeVal = String(row.grade ?? '').trim().toUpperCase() || percentToGrade(pct);
      const grade = gradeVal.charAt(0);
      const status = String(row.status ?? 'final').toLowerCase();
      const subject_color = typeof row.subject_color === 'string' ? row.subject_color : undefined;
      subjects.push({ subject: subjectName, marks: marksNum, maxMarks: maxNum, grade, percentage: pct, status, subject_color });
    }
    if (subjects.length === 0) continue;
    const totalMarks = Number(exam.total_marks) ?? subjects.reduce((s, sub) => s + sub.marks, 0);
    const maxMarks = Number(exam.total_max_marks) ?? subjects.reduce((s, sub) => s + sub.maxMarks, 0);
    const percentage = Number(exam.overall_percentage) ?? (maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0);
    const overallGrade = String(exam.overall_grade ?? '').trim().toUpperCase().charAt(0) || percentToGrade(percentage);
    result.push({
      id: String(exam.exam_id ?? exam.id ?? result.length),
      name: String(exam.exam_name ?? exam.name ?? 'Examination').trim(),
      status: String(exam.status ?? 'final').toLowerCase(),
      subjects,
      totalMarks,
      maxMarks,
      percentage,
      grade: overallGrade,
    });
  }
  if (result.length === 0) return null;
  result.sort((a, b) => b.name.localeCompare(a.name));
  return result;
}

function parseMarksResponse(body: unknown): SubjectMark[] {
  const list = Array.isArray(body)
    ? body
    : (body as Record<string, unknown>)?.data ??
      (body as Record<string, unknown>)?.marks ??
      (body as Record<string, unknown>)?.subjects ??
      [];
  if (!Array.isArray(list)) return [];
  return list
    .map((row: Record<string, unknown>) => {
      const subject = String(row.subject ?? row.subject_name ?? row.name ?? '—').trim();
      const marksNum = Number(row.marks ?? row.marks_obtained ?? row.obtained ?? 0) || 0;
      const maxNum = Number(row.max_marks ?? row.total_marks ?? row.max ?? 100) || 100;
      const pct = maxNum > 0 ? Math.round((marksNum / maxNum) * 100) : 0;
      const gradeVal = String(row.grade ?? '').trim().toUpperCase() || percentToGrade(pct);
      const grade = gradeVal.charAt(0);
      const status = String(row.status ?? 'final').toLowerCase();
      const subject_color = typeof row.subject_color === 'string' ? row.subject_color : undefined;
      return { subject, marks: marksNum, maxMarks: maxNum, grade, percentage: pct, status, subject_color };
    })
    .filter((s) => s.subject);
}

function parseExamsResponse(body: unknown): { id: string; name: string; status?: string }[] {
  const list = Array.isArray(body)
    ? body
    : (body as Record<string, unknown>)?.data ??
      (body as Record<string, unknown>)?.examinations ??
      [];
  if (!Array.isArray(list)) return [];
  return list.map((e: Record<string, unknown>) => ({
    id: String(e.id ?? e.exam_id ?? e.examination_id ?? ''),
    name: String(e.name ?? e.title ?? e.examination_name ?? 'Examination').trim(),
    status: String(e.status ?? 'final').toLowerCase(),
  }));
}

function buildExamsWithMarks(
  marksRaw: unknown,
  examsMeta: { id: string; name: string; status?: string }[]
): ExamWithMarks[] {
  const byExamId: Record<string, SubjectMark[]> = {};
  const metaById: Record<string, { name: string; status: string }> = {};
  examsMeta.forEach((e) => {
    if (e.id) metaById[e.id] = { name: e.name || 'Examination', status: e.status || 'final' };
  });

  const body = marksRaw as Record<string, unknown> | unknown[];
  if (Array.isArray(body)) {
    (body as Record<string, unknown>[]).forEach((row) => {
      const eid = String(row.exam_id ?? row.examination_id ?? row.exam ?? 'default');
      if (!byExamId[eid]) byExamId[eid] = [];
      const name = String(row.exam_name ?? row.examination_name ?? row.exam_title ?? '').trim();
      if (name && !metaById[eid]) metaById[eid] = { name, status: 'final' };
      const list = parseMarksResponse([row]);
      if (list.length) byExamId[eid].push(list[0]);
    });
  } else if (body && typeof body === 'object') {
    const data = body.data as Record<string, unknown> | undefined;
    const examinations = (body.examinations ?? (Array.isArray(data) ? data : (data as Record<string, unknown> | undefined)?.examinations ?? data)) as Record<string, unknown>[] | undefined;
    if (Array.isArray(examinations)) {
      examinations.forEach((exam: Record<string, unknown>) => {
        const id = String(exam.id ?? exam.exam_id ?? '');
        if (id) metaById[id] = {
          name: String(exam.name ?? exam.title ?? 'Examination'),
          status: String(exam.status ?? 'final').toLowerCase(),
        };
        const subList = parseMarksResponse(exam.marks ?? exam.subjects ?? exam.data ?? []);
        if (subList.length) byExamId[id] = subList;
      });
    } else {
      const flat = parseMarksResponse(body.data ?? body.marks ?? body);
      const eid = 'default';
      if (flat.length) byExamId[eid] = flat;
    }
  }

  const result: ExamWithMarks[] = [];
  Object.keys(byExamId).forEach((id) => {
    const subjects = byExamId[id];
    const meta = metaById[id] ?? { name: 'Examination', status: 'final' };
    const totalMarks = subjects.reduce((s, sub) => s + sub.marks, 0);
    const maxMarks = subjects.reduce((s, sub) => s + sub.maxMarks, 0);
    const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    const grade = percentToGrade(percentage);
    result.push({
      id,
      name: meta.name,
      status: meta.status,
      subjects,
      totalMarks,
      maxMarks,
      percentage,
      grade,
    });
  });
  result.sort((a, b) => b.name.localeCompare(a.name));
  return result;
}

// ─── Reusable components ───────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function GradePill({ grade }: { grade: string }) {
  const g = (grade || 'F').toUpperCase().charAt(0);
  const style = GRADE_STYLES[g] ?? DEFAULT_GRADE;
  return (
    <View style={[styles.gradePill, { backgroundColor: style.bg }]}>
      <Text style={[styles.gradePillText, { color: style.text }]}>{g}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isDraft = (status || '').toLowerCase() === 'draft';
  return (
    <View style={[styles.statusBadge, { backgroundColor: isDraft ? '#F1F5F9' : '#E0F2FE' }]}>
      <Text style={[styles.statusBadgeText, { color: isDraft ? MUTED : '#0369A1' }]}>
        {isDraft ? 'Draft' : 'Final'}
      </Text>
    </View>
  );
}

function SubjectCard({ subject, marks, maxMarks, grade, percentage, status, subject_color }: SubjectMark) {
  const accentColor = subject_color && /^#([0-9A-Fa-f]{3}){1,2}$/.test(subject_color) ? subject_color : undefined;
  return (
    <View style={[styles.subjectCard, accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : undefined]}>
      <View style={styles.subjectRow}>
        <Text style={styles.subjectName} numberOfLines={1}>{subject}</Text>
        <Text style={styles.subjectMarks}>{marks} / {maxMarks}</Text>
        <GradePill grade={grade} />
      </View>
      <View style={styles.subjectMeta}>
        <Text style={styles.subjectPct}>{percentage}%</Text>
        <StatusBadge status={status} />
      </View>
    </View>
  );
}

function ExamCard({ exam }: { exam: ExamWithMarks }) {
  return (
    <View style={styles.examCard}>
      <View style={styles.examHeader}>
        <Text style={styles.examTitle} numberOfLines={1}>{exam.name}</Text>
        <StatusBadge status={exam.status} />
      </View>
      <View style={styles.examHero}>
        <Text style={styles.examPercent}>{exam.percentage}%</Text>
        <Text style={styles.examGradeLabel}>— Grade {exam.grade}</Text>
      </View>
      <View style={styles.examStatsRow}>
        <Text style={styles.examStat}>Total: {exam.totalMarks} / {exam.maxMarks}</Text>
        <Text style={styles.examStat}>Subjects: {exam.subjects.length}</Text>
      </View>
      <View style={styles.subjectList}>
        {exam.subjects.map((s, i) => (
          <SubjectCard key={`${s.subject}-${i}`} {...s} />
        ))}
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function StudentMarksScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'examination' | 'overall'>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const canFetchMarks = Boolean(
    schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no))
  );

  const { data: marksPayload, isLoading: loadingMarks, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'marks', schoolCode, studentId, student?.admission_no],
    queryFn: async () => {
      let effectiveStudentId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveStudentId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveStudentId) return null;
      const r = await studentService.getMarks({ school_code: schoolCode, student_id: effectiveStudentId });
      return r?.data ?? r;
    },
    enabled: canFetchMarks,
  });

  const { data: examsPayload } = useQuery({
    queryKey: ['examinations', 'student', schoolCode, studentId],
    queryFn: async () => {
      let effectiveStudentId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveStudentId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveStudentId) return null;
      const r = await examinationService.getExaminationsStudent(schoolCode, effectiveStudentId);
      return r?.data ?? r;
    },
    enabled: canFetchMarks,
  });

  const examsMeta = useMemo(() => parseExamsResponse(examsPayload ?? []), [examsPayload]);
  const exams = useMemo(() => {
    const canonical = parseMarksDataCanonical(marksPayload ?? null);
    if (canonical && canonical.length > 0) return canonical;
    return buildExamsWithMarks(marksPayload ?? [], examsMeta);
  }, [marksPayload, examsMeta]);

  const { heroAverage, totalExams, totalSubjects, filteredExams } = useMemo(() => {
    const totalSubjects = exams.reduce((s, e) => s + e.subjects.length, 0);
    const totalPct = exams.reduce((s, e) => s + e.percentage, 0);
    const heroAverage = exams.length > 0 ? Math.round(totalPct / exams.length) : 0;
    let list = exams;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
    if (filterType === 'examination') list = list.filter((e) => e.subjects.length > 1);
    if (filterType === 'overall') list = list.filter((e) => e.subjects.length <= 1);
    return { heroAverage, totalExams: exams.length, totalSubjects, filteredExams: list };
  }, [exams, search, filterType]);

  const onDownloadReport = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const base = env.API_BASE_URL || '';
    const url = `${base}/api/marks/export?school_code=${schoolCode}&student_id=${studentId}`;
    (window as unknown as Window).open(url, '_blank');
  }, [schoolCode, studentId]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>Marks</Text>
        <Pressable style={styles.downloadPill} onPress={onDownloadReport} hitSlop={8}>
          <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          <Text style={styles.downloadPillText}>Download Report</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>View all your examination marks and grades</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={PRIMARY} />
        }
      >
        {loadingMarks && exams.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={PRIMARY} />
          </View>
        ) : isError ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>{(error as Error)?.message ?? 'Could not load marks.'}</Text>
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Hero stats card */}
            <View style={styles.heroCard}>
              <View style={styles.heroMain}>
                <Text style={styles.heroPercent}>{heroAverage}%</Text>
                <Text style={styles.heroLabel}>Average Percentage</Text>
              </View>
              <View style={styles.statsGrid}>
                <StatCard label="Total Examinations" value={totalExams} />
                <StatCard label="Total Subjects" value={totalSubjects} />
                <StatCard label="Average Percentage" value={`${heroAverage}%`} />
              </View>
            </View>

            {/* Search + filter */}
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={20} color={MUTED} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by examination name..."
                  placeholderTextColor={MUTED}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <Pressable
                style={styles.filterPill}
                onPress={() => setFilterOpen((o) => !o)}
              >
                <Text style={styles.filterPillText}>
                  {filterType === 'all' ? 'All Types' : filterType === 'examination' ? 'Examination' : 'Overall'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={TEXT} />
              </Pressable>
            </View>
            {filterOpen && (
              <View style={styles.filterDropdown}>
                {(['all', 'examination', 'overall'] as const).map((t) => (
                  <Pressable
                    key={t}
                    style={styles.filterOption}
                    onPress={() => { setFilterType(t); setFilterOpen(false); }}
                  >
                    <Text style={styles.filterOptionText}>
                      {t === 'all' ? 'All' : t === 'examination' ? 'Examination' : 'Overall'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Examination cards */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Examinations</Text>
            </View>
            {filteredExams.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>
                  {exams.length === 0 ? 'No marks available yet.' : 'No examinations match your search.'}
                </Text>
              </View>
            ) : (
              <View style={styles.examList}>
                {filteredExams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: S.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_START },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.sm,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center' },
  downloadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: S.sm,
    paddingHorizontal: S.lg,
    borderRadius: 20,
    backgroundColor: PRIMARY,
  },
  downloadPillText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    paddingBottom: S.lg,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: S.lg, paddingBottom: S.xxxl },
  loaderWrap: { padding: S.xxl, alignItems: 'center' },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: S.xl,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: { fontSize: 15, color: MUTED },
  retryBtn: {
    marginTop: S.lg,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    backgroundColor: PRIMARY,
    borderRadius: RADIUS_SM,
    alignSelf: 'center',
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: S.xxl,
    marginBottom: S.xxl,
    borderWidth: 1,
    borderColor: BORDER,
  },
  heroMain: { alignItems: 'center', marginBottom: S.xxl },
  heroPercent: { fontSize: 36, fontWeight: '800', color: PRIMARY },
  heroLabel: { fontSize: 14, color: MUTED, marginTop: S.xs },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: S.md,
  },
  statCard: {
    width: '31%',
    minWidth: 0,
    backgroundColor: BG_START,
    borderRadius: RADIUS_SM,
    padding: S.lg,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: TEXT },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 4 },

  searchRow: { flexDirection: 'row', gap: S.md, marginBottom: S.md },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: S.lg,
    gap: S.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: S.md,
    fontSize: 15,
    color: TEXT,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: S.md,
    paddingHorizontal: S.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
  },
  filterPillText: { fontSize: 14, fontWeight: '600', color: TEXT },
  filterDropdown: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: S.lg,
    overflow: 'hidden',
  },
  filterOption: { paddingVertical: S.lg, paddingHorizontal: S.xl },
  filterOptionText: { fontSize: 15, color: TEXT },

  sectionHeader: { marginBottom: S.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT },

  examList: { gap: S.xl },
  examCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: S.xl,
    borderWidth: 1,
    borderColor: BORDER,
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.lg,
  },
  examTitle: { fontSize: 18, fontWeight: '700', color: TEXT, flex: 1 },
  examHero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: S.sm,
  },
  examPercent: { fontSize: 28, fontWeight: '800', color: PRIMARY },
  examGradeLabel: { fontSize: 16, fontWeight: '600', color: MUTED, marginLeft: S.sm },
  examStatsRow: { flexDirection: 'row', gap: S.xl, marginBottom: S.xl },
  examStat: { fontSize: 14, color: MUTED },
  subjectList: { gap: S.md },
  subjectCard: {
    backgroundColor: BG_START,
    borderRadius: RADIUS_SM,
    padding: S.lg,
    borderWidth: 1,
    borderColor: BORDER,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  subjectName: { flex: 1, fontSize: 16, fontWeight: '600', color: TEXT },
  subjectMarks: { fontSize: 14, fontWeight: '600', color: TEXT },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.sm },
  subjectPct: { fontSize: 13, color: MUTED },
  gradePill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePillText: { fontSize: 14, fontWeight: '800' },
  statusBadge: {
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
});
