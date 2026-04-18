/**
 * Student Examinations — schedules, structures, marks after lock.
 * Primary: GET /api/examinations/v2/student
 * Secondary: GET /api/student/marks (merge by exam_id)
 */

import { useRouter } from 'expo-router';
import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudent } from '@/lib/student-context';
import { env } from '@/lib/env';
import {
  parseStudentExaminationsPayload,
  parseMarksByExamId,
  buildDateSheetHtml,
  formatUsShortRange,
  formatUsShortDate,
  isExamUpcomingOrOngoing,
  deriveExamUiStatus,
  type ExaminationsViewModel,
  type NormalizedExam,
  type ExamMarksBlock,
} from '@/lib/student-examinations';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { examinationService } from '@/services/examination.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const PRIMARY = '#6D28D9';
const BG_TOP = '#FAF5FF';
const BG_BOTTOM = '#FDF2F8';
const CARD = 'rgba(255,255,255,0.85)';
const BORDER = 'rgba(0,0,0,0.06)';
const TEXT = '#1F2937';
const MUTED = '#64748B';
const AMBER_BG = '#FEF3C7';
const AMBER_TEXT = '#B45309';
const RADIUS = 20;
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 };

function statusPillStyle(status: ReturnType<typeof deriveExamUiStatus>) {
  if (status === 'Completed') return { bg: '#F1F5F9', text: MUTED };
  if (status === 'Ongoing') return { bg: 'rgba(109, 40, 217, 0.12)', text: PRIMARY };
  return { bg: 'rgba(59, 130, 246, 0.12)', text: '#1D4ED8' };
}

export default function StudentExaminationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';

  const canFetch = Boolean(
    schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no))
  );

  const resolveStudentId = useCallback(async () => {
    let id = studentId;
    if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
      try {
        const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
        const row = (r as { data?: { id?: string } })?.data;
        if (row?.id) id = String(row.id);
      } catch {
        /* keep */
      }
    }
    return id || null;
  }, [schoolCode, student?.admission_no, studentId]);

  const {
    data: examBundle,
    isLoading: examsLoading,
    isError: examsError,
    error: examsErr,
    refetch: refetchExams,
    isRefetching: examsRefetching,
  } = useQuery({
    queryKey: ['examinations', 'student', schoolCode, studentId, student?.admission_no],
    queryFn: async () => {
      const id = await resolveStudentId();
      if (!id || !schoolCode) return null;
      const payload = await examinationService.fetchStudentExaminationsPayload(schoolCode, id);
      return { payload, studentId: id };
    },
    enabled: canFetch,
  });

  const rawPayload = examBundle?.payload;
  const resolvedStudentId = examBundle?.studentId ?? '';

  const {
    data: marksRaw,
    refetch: refetchMarks,
    isRefetching: marksRefetching,
  } = useQuery({
    queryKey: ['student-marks', 'examinations-merge', schoolCode, resolvedStudentId],
    queryFn: async () => {
      if (!schoolCode || !resolvedStudentId) return null;
      return examinationService.fetchStudentMarksPayload(schoolCode, resolvedStudentId);
    },
    enabled: canFetch && Boolean(examBundle && schoolCode && resolvedStudentId),
  });

  const vm: ExaminationsViewModel = useMemo(
    () => parseStudentExaminationsPayload(rawPayload ?? null),
    [rawPayload]
  );

  const marksByExamId: Record<string, ExamMarksBlock> = useMemo(
    () => (marksRaw != null ? parseMarksByExamId(marksRaw) : {}),
    [marksRaw]
  );

  const upcomingExams = useMemo(
    () => vm.examinations.filter(isExamUpcomingOrOngoing),
    [vm.examinations]
  );
  const pastExams = useMemo(
    () => vm.examinations.filter((e) => !isExamUpcomingOrOngoing(e)),
    [vm.examinations]
  );

  const onRefresh = useCallback(() => {
    refetchExams();
    refetchMarks();
  }, [refetchExams, refetchMarks]);

  const refreshing = examsRefetching || marksRefetching;

  const headerPad = Math.max(insets.top, S.md);

  const noClassStructuresOrExams =
    !vm.classInfo && vm.structures.length === 0 && vm.examinations.length === 0;

  const setupButNoExams =
    (vm.classInfo != null || vm.structures.length > 0) && vm.examinations.length === 0;

  if (!canFetch) {
    return (
      <View style={[styles.root, { paddingTop: headerPad }]}>
        <ScreenHeader onBack={() => router.back()} title="Examinations" />
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Sign in again to view your examination schedule.</Text>
        </View>
      </View>
    );
  }

  if (examsLoading && !rawPayload) {
    return (
      <View style={[styles.root, { paddingTop: headerPad }]}>
        <ScreenHeader onBack={() => router.back()} title="Examinations" />
        <Text style={styles.subtitle}>
          Schedules and structures for your class. Published results appear after your school unlocks
          marks.
        </Text>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={[styles.mutedText, { marginTop: S.lg }]}>Loading your schedule…</Text>
        </View>
      </View>
    );
  }

  if (examsError) {
    return (
      <View style={[styles.root, { paddingTop: headerPad }]}>
        <ScreenHeader onBack={() => router.back()} title="Examinations" />
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={MUTED} />
          <Text style={styles.errorText}>
            {(examsErr as Error)?.message ?? 'Could not load examinations.'}
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => refetchExams()}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <View style={[styles.root, { paddingTop: headerPad }]}>
        <ScreenHeader onBack={() => router.back()} title="Examinations" />
        <Text style={styles.subtitle}>
          Schedules and structures for your class. Published results appear after your school unlocks
          marks.
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
        >
          {vm.classInfo ? (
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="school" size={22} color={PRIMARY} />
              </View>
              <View style={styles.heroTextCol}>
                <Text style={styles.heroLabel}>Your class</Text>
                <Text style={styles.heroTitle}>{vm.classLabel || '—'}</Text>
                {vm.academicYear ? (
                  <Text style={styles.heroMeta}>Academic year {vm.academicYear}</Text>
                ) : null}
                <Text style={styles.heroNote}>
                  Content is for this section only. Results appear here after the school publishes
                  (lock).
                </Text>
              </View>
            </View>
          ) : null}

          {noClassStructuresOrExams ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={36} color={MUTED} />
              <Text style={styles.emptyTitle}>Class not matched / no setup</Text>
              <Text style={styles.emptyBody}>Contact your school if this seems wrong.</Text>
            </View>
          ) : null}

          {setupButNoExams ? (
            <View style={[styles.emptyCard, { marginBottom: S.xl }]}>
              <Ionicons name="calendar-outline" size={36} color={MUTED} />
              <Text style={styles.emptyTitle}>No scheduled examinations yet</Text>
              <Text style={styles.emptyBody}>
                Real dated exams will appear below when your school creates them. Pull down to
                refresh.
              </Text>
            </View>
          ) : null}

          {vm.structures.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exam structure & terms</Text>
              <Text style={styles.sectionHint}>
                How terms and assessment types are organized for your grade (read-only).
              </Text>
              {vm.structures.map((st) => (
                <View key={st.id} style={styles.structureCard}>
                  <Text style={styles.structureName}>{st.name || 'Exam structure'}</Text>
                  <Text style={styles.structureSub}>
                    Template exam names and weightages are defined per term.
                  </Text>
                  <View style={styles.structureBody}>
                    {st.terms.length === 0 ? (
                      <Text style={styles.termEmpty}>No terms configured for this structure.</Text>
                    ) : (
                      st.terms.map((term) => (
                        <View key={term.id} style={styles.termBlock}>
                          <Text style={styles.termLine}>
                            Term {term.serial}: {term.name}
                          </Text>
                          {term.templateExams.length > 0 ? (
                            <View style={styles.bulletList}>
                              {term.templateExams.map((te, i) => (
                                <Text key={`${term.id}-te-${i}`} style={styles.bulletItem}>
                                  • {te.name}
                                  {te.weightage ? ` (${te.weightage}% weight)` : ''}
                                </Text>
                              ))}
                            </View>
                          ) : (
                            <Text style={styles.termEmptySm}>
                              No examination types on this term.
                            </Text>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {vm.examinations.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Scheduled examinations</Text>
              {upcomingExams.length > 0 ? (
                <>
                  <Text style={styles.sectionHint}>Upcoming & ongoing</Text>
                  {upcomingExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      marks={marksByExamId[exam.id]}
                    />
                  ))}
                </>
              ) : null}
              {pastExams.length > 0 ? (
                <>
                  <Text style={[styles.sectionHint, upcomingExams.length > 0 ? { marginTop: S.lg } : null]}>
                    Previous examinations
                  </Text>
                  {pastExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      marks={marksByExamId[exam.id]}
                    />
                  ))}
                </>
              ) : null}
            </View>
          ) : null}

          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function ExamCard({ exam, marks }: { exam: NormalizedExam; marks?: ExamMarksBlock }) {
  const uiStatus = deriveExamUiStatus(exam);
  const pill = statusPillStyle(uiStatus);
  const completed = uiStatus === 'Completed';
  const showLockMessage = completed && !marks;
  const termPill = exam.termName ? `Term: ${exam.termName}` : null;

  const handleShare = () => {
    const html = buildDateSheetHtml(exam);
    Share.share({ title: `${exam.name} — date sheet`, message: html }).catch(() =>
      Alert.alert('Date sheet', 'Could not open the share sheet.')
    );
  };

  return (
    <View style={styles.examCard}>
      <View style={styles.examHeaderBlock}>
        <Text style={styles.examTitle} numberOfLines={3}>
          {exam.name}
        </Text>
        <Text style={styles.examDateRange}>
          {formatUsShortRange(exam.startDate, exam.endDate)}
        </Text>
        <View style={styles.badgeRow}>
          {termPill ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{termPill}</Text>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: pill.bg }]}>
            <Text style={[styles.badgeText, { color: pill.text }]}>{uiStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <MetaCell label="Start" value={formatUsShortDate(exam.startDate)} />
        <MetaCell label="End" value={formatUsShortDate(exam.endDate)} />
        <MetaCell label="Year" value={exam.academicYear ?? '—'} />
      </View>

      {exam.description ? (
        <Text style={styles.examDescription}>{exam.description}</Text>
      ) : null}

      {exam.subjectRows.length > 0 ? (
        <View style={styles.subjectList}>
          {exam.subjectRows.map((row, i) => (
            <View
              key={`${exam.id}-sub-${i}`}
              style={[styles.subjectCard, i % 2 === 1 ? styles.subjectCardAlt : null]}
            >
              <Text style={styles.subjectCardTitle}>{row.subject_name}</Text>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Date / time</Text>
                <Text style={styles.kvValue}>{row.dateTimeLine}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Teacher</Text>
                <Text style={styles.kvValue}>{row.teacher_name?.trim() || '—'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Max / Pass</Text>
                <Text style={styles.kvValue}>
                  {row.max_marks ?? '—'} / {row.pass_marks ?? '—'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : exam.schedules.length > 0 ? (
        <View style={styles.subjectList}>
          {exam.schedules.map((s, i) => (
            <View
              key={`${exam.id}-sch-${i}`}
              style={[styles.subjectCard, i % 2 === 1 ? styles.subjectCardAlt : null]}
            >
              <Text style={styles.subjectCardTitle}>{s.subject}</Text>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Date / time</Text>
                <Text style={styles.kvValue}>
                  {formatUsShortDate(s.exam_date || s.date)}
                  {s.time ? ` · ${s.time}` : ''}
                </Text>
              </View>
              {s.teacher_name ? (
                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>Teacher</Text>
                  <Text style={styles.kvValue}>{s.teacher_name}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noSchedule}>Subject timings are not published yet.</Text>
      )}

      {exam.totalMaxMarks != null || exam.totalPassMarks != null ? (
        <Text style={styles.totalsFooter}>
          Total max: {exam.totalMaxMarks ?? '—'} · Total pass: {exam.totalPassMarks ?? '—'}
        </Text>
      ) : null}

      {showLockMessage ? (
        <View style={styles.amberBox}>
          <Text style={styles.amberText}>
            Results are not shown until your school publishes them (lock).
          </Text>
        </View>
      ) : null}

      {marks ? (
        <View style={styles.resultsBox}>
          <Text style={styles.resultsTitle}>Your Results</Text>
          <Text style={styles.resultsLine}>
            Marks: {marks.totalObtained} / {marks.totalMax} ({marks.percentage}%)
          </Text>
          <View style={styles.resultsRow}>
            <View style={styles.gradeChip}>
              <Text style={styles.gradeChipText}>{marks.grade}</Text>
            </View>
            {marks.passFail !== 'unknown' ? (
              <View
                style={[
                  styles.passChip,
                  marks.passFail === 'pass' ? styles.passChipOk : styles.passChipBad,
                ]}
              >
                <Text
                  style={[
                    styles.passChipText,
                    marks.passFail === 'pass' ? styles.passChipTextOk : styles.passChipTextBad,
                  ]}
                >
                  {marks.passFail === 'pass' ? 'Pass' : 'Fail'}
                </Text>
              </View>
            ) : null}
          </View>
          {marks.remarks ? (
            <Text style={styles.remarksText}>Remarks: {marks.remarks}</Text>
          ) : null}
        </View>
      ) : null}

      <Pressable style={styles.downloadBtnActive} onPress={handleShare}>
        <Ionicons name="download-outline" size={18} color="#fff" />
        <Text style={styles.downloadBtnText}>Download date sheet</Text>
      </Pressable>
    </View>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function ScreenHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.headerRow}>
      <Pressable style={styles.backBtn} onPress={onBack} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={TEXT} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  root: { flex: 1, backgroundColor: 'transparent' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingBottom: S.sm,
  },
  backBtn: { padding: S.xs, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerTitle: {
    ...textStyles.h4,
    color: TEXT,
    flex: 1,
    textAlign: 'center',
    lineHeight: 24,
  },
  subtitle: {
    ...textStyles.bodySm,
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: S.xl,
    paddingTop: S.xs,
    paddingBottom: S.md,
    marginBottom: S.sm,
    lineHeight: 22,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: S.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: S.xl },
  mutedText: { ...textStyles.body, color: MUTED, textAlign: 'center', lineHeight: 24 },
  errorText: {
    ...textStyles.body,
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: S.md,
    lineHeight: 24,
  },
  retryBtn: {
    marginTop: S.lg,
    backgroundColor: PRIMARY,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderRadius: 999,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD,
    borderRadius: RADIUS,
    padding: S.lg,
    marginBottom: S.xl,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 98, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  heroTextCol: { flex: 1, minWidth: 0 },
  heroLabel: {
    ...textStyles.caption,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  heroTitle: { ...textStyles.h4, color: TEXT, marginTop: 6, lineHeight: 26 },
  heroMeta: { ...textStyles.bodySm, color: MUTED, marginTop: 6, lineHeight: 20 },
  heroNote: { ...textStyles.caption, color: MUTED, marginTop: S.md, lineHeight: 20 },
  section: { marginBottom: S.xl },
  sectionTitle: { ...textStyles.h4, color: TEXT, marginBottom: 6, lineHeight: 26 },
  sectionHint: { ...textStyles.bodySm, color: MUTED, marginBottom: S.md, lineHeight: 22 },
  structureCard: {
    backgroundColor: CARD,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: S.md,
    padding: S.lg,
  },
  structureName: { ...textStyles.body, fontWeight: '700', color: TEXT, lineHeight: 24 },
  structureSub: { ...textStyles.caption, color: MUTED, marginTop: 6, lineHeight: 20 },
  structureBody: { marginTop: S.md },
  termBlock: { marginBottom: S.lg },
  termLine: { ...textStyles.body, fontWeight: '600', color: TEXT, lineHeight: 24 },
  bulletList: { marginTop: 6, marginLeft: S.sm },
  bulletItem: { ...textStyles.bodySm, color: TEXT, marginTop: 6, lineHeight: 22 },
  termEmpty: { ...textStyles.bodySm, color: MUTED, lineHeight: 22 },
  termEmptySm: {
    ...textStyles.caption,
    color: MUTED,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  examCard: {
    backgroundColor: CARD,
    borderRadius: RADIUS,
    padding: S.lg,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  examHeaderBlock: { marginBottom: S.md },
  examDateRange: { ...textStyles.bodySm, color: MUTED, marginTop: 6, lineHeight: 20 },
  examTitle: { ...textStyles.h4, color: TEXT, lineHeight: 26 },
  examDescription: { ...textStyles.bodySm, color: MUTED, marginBottom: S.md, lineHeight: 22 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  badge: {
    backgroundColor: 'rgba(45, 98, 255, 0.12)',
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderRadius: 999,
  },
  badgeText: { ...textStyles.caption, color: PRIMARY, fontWeight: '700', lineHeight: 16 },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.md,
    marginBottom: S.md,
  },
  metaCell: { flexGrow: 1, minWidth: 100, maxWidth: '100%' },
  metaLabel: { ...textStyles.caption, color: MUTED, fontWeight: '600', lineHeight: 16 },
  metaValue: { ...textStyles.bodySm, color: TEXT, marginTop: 4, flexShrink: 1, lineHeight: 20 },
  subjectList: { marginTop: S.xs },
  subjectCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: S.md,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: S.sm,
  },
  subjectCardAlt: { backgroundColor: '#F3F4F6' },
  subjectCardTitle: {
    ...textStyles.body,
    fontWeight: '700',
    color: TEXT,
    marginBottom: S.sm,
    lineHeight: 24,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: S.md,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  kvLabel: {
    ...textStyles.caption,
    color: MUTED,
    fontWeight: '600',
    minWidth: 96,
    maxWidth: '40%',
    lineHeight: 18,
  },
  kvValue: {
    ...textStyles.bodySm,
    color: TEXT,
    flex: 1,
    flexShrink: 1,
    minWidth: 140,
    textAlign: 'right',
    lineHeight: 22,
  },
  noSchedule: { ...textStyles.bodySm, color: MUTED, fontStyle: 'italic', lineHeight: 22 },
  totalsFooter: {
    ...textStyles.caption,
    color: MUTED,
    marginTop: S.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  amberBox: {
    backgroundColor: AMBER_BG,
    borderRadius: 12,
    padding: S.md,
    marginTop: S.md,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.25)',
  },
  amberText: { ...textStyles.bodySm, color: AMBER_TEXT, fontWeight: '600', lineHeight: 22 },
  resultsBox: {
    marginTop: S.md,
    padding: S.md,
    borderRadius: 12,
    backgroundColor: 'rgba(109, 40, 217, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.15)',
  },
  resultsTitle: { ...textStyles.body, fontWeight: '700', color: TEXT, lineHeight: 24 },
  resultsLine: { ...textStyles.bodySm, color: TEXT, marginTop: 6, lineHeight: 22 },
  resultsRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.sm, flexWrap: 'wrap' },
  gradeChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: S.md,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeChipText: { fontWeight: '800', color: '#166534' },
  passChip: { paddingHorizontal: S.md, paddingVertical: 4, borderRadius: 8 },
  passChipOk: { backgroundColor: '#DCFCE7' },
  passChipBad: { backgroundColor: '#FEE2E2' },
  passChipText: { fontWeight: '700', fontSize: 12 },
  passChipTextOk: { color: '#166534' },
  passChipTextBad: { color: '#B91C1C' },
  remarksText: { ...textStyles.bodySm, color: MUTED, marginTop: S.sm, lineHeight: 22 },
  downloadBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    backgroundColor: PRIMARY,
    marginTop: S.lg,
    paddingVertical: S.md,
    borderRadius: 12,
  },
  downloadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, lineHeight: 20 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: RADIUS,
    padding: S.xl,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: S.xl,
  },
  emptyTitle: {
    ...textStyles.h4,
    color: TEXT,
    marginTop: S.md,
    textAlign: 'center',
    lineHeight: 26,
  },
  emptyBody: {
    ...textStyles.bodySm,
    color: MUTED,
    textAlign: 'center',
    marginTop: S.sm,
    lineHeight: 22,
  },
});
