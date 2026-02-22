/**
 * Dashboard summary: stats cards from all APIs; quick links to modules.
 * APIs: calendar/academic, dashboard/stats, stats-detailed, financial-overview,
 * timetable/list, administrative, examinations, classes.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { dashboardService } from '@/services/dashboard.service';
import { StatCard, SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';
const SLATE = '#64748B';

export default function DashboardSummaryScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();

  const queries = {
    calendarAcademic: useQuery({
      queryKey: ['dashboard', 'calendar', 'academic', schoolCode],
      queryFn: () => dashboardService.getCalendarAcademic(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
    stats: useQuery({
      queryKey: ['dashboard', 'stats', schoolCode],
      queryFn: () => dashboardService.getDashboardStats(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
    statsDetailed: useQuery({
      queryKey: ['dashboard', 'stats-detailed', schoolCode],
      queryFn: () => dashboardService.getDashboardStatsDetailed(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
    financial: useQuery({
      queryKey: ['dashboard', 'financial', schoolCode],
      queryFn: () => dashboardService.getDashboardFinancialOverview(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
    timetableList: useQuery({
      queryKey: ['dashboard', 'timetable', 'list', schoolCode],
      queryFn: () => dashboardService.getTimetableList(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
    administrative: useQuery({
      queryKey: ['dashboard', 'administrative', schoolCode],
      queryFn: () => dashboardService.getDashboardAdministrative(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
    examinations: useQuery({
      queryKey: ['dashboard', 'examinations', schoolCode],
      queryFn: () => dashboardService.getExaminations(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
    classes: useQuery({
      queryKey: ['dashboard', 'classes', schoolCode],
      queryFn: () => dashboardService.getClasses(schoolCode).then((r) => r.data),
      enabled: Boolean(schoolCode),
    }),
  };

  const refetchAll = useCallback(() => {
    Object.values(queries).forEach((q) => q.refetch());
  }, [queries]);

  const isLoading = Object.values(queries).some((q) => q.isLoading && !q.data);
  const isRefetching = Object.values(queries).some((q) => q.isRefetching);
  const hasError = Object.values(queries).some((q) => q.isError);

  const stats = (queries.stats.data ?? {}) as Record<string, number>;
  const statsD = (queries.statsDetailed.data ?? {}) as Record<string, unknown>;
  const financialData = (queries.financial.data ?? {}) as Record<string, unknown>;
  const administrative = (queries.administrative.data ?? {}) as Record<string, unknown>;
  const exams = (queries.examinations.data ?? {}) as Record<string, unknown>;
  const classesList = Array.isArray(queries.classes.data) ? queries.classes.data : [];
  const timetableList = Array.isArray(queries.timetableList.data)
    ? queries.timetableList.data
    : (queries.timetableList.data as { data?: unknown[] })?.data ?? [];

  const feeCollected = (financialData.collected as number) ?? (financialData.total_collected as number);
  const feeTotal = (financialData.total as number) ?? (financialData.total_fees as number);
  const feeText =
    feeCollected != null && feeTotal != null
      ? `${feeCollected} / ${feeTotal}`
      : (financialData.today as string) ?? '—';
  const attendanceStudent =
    (statsD.student_attendance_pct as number) ?? (stats.student_attendance as number);
  const attendanceStaff =
    (statsD.staff_attendance_pct as number) ?? (stats.staff_attendance as number);
  const attendanceText =
    attendanceStudent != null && attendanceStaff != null
      ? `S: ${attendanceStudent}% · St: ${attendanceStaff}%`
      : attendanceStudent != null
        ? `${attendanceStudent}%`
        : '—';
  const upcomingExams = (exams.upcoming as number) ?? (exams.count as number) ?? (Array.isArray(exams.list) ? (exams.list as unknown[]).length : 0);
  const noticesCount = (stats.notices as number) ?? (stats.recent_notices as number) ?? '—';
  const visitors = (administrative.visitors as number) ?? (administrative.today_visitors as number);
  const leaves = (administrative.leaves as number) ?? (administrative.pending_leaves as number);

  if (!schoolCode) return null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isLoading}
          onRefresh={refetchAll}
          tintColor={INDIGO}
        />
      }
    >
      <SectionHeader title="Dashboard" />
      {hasError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Some data failed to load.</Text>
          <Pressable style={styles.retryBtn} onPress={refetchAll}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
      {isLoading && !queries.stats.data ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={INDIGO} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <Pressable
              style={styles.cardWrap}
              onPress={() => router.push(path('students') as never)}
            >
              <StatCard
                label="Students"
                value={stats.students ?? stats.total_students ?? '—'}
                variant="primary"
              />
            </Pressable>
            <Pressable
              style={styles.cardWrap}
              onPress={() => router.push(path('staff-management') as never)}
            >
              <StatCard
                label="Staff"
                value={stats.staff ?? stats.total_staff ?? '—'}
                variant="success"
              />
            </Pressable>
            <Pressable
              style={styles.cardWrap}
              onPress={() => router.push(path('fees') as never)}
            >
              <StatCard
                label="Fee collection"
                value={feeText}
                subtitle={financialData.monthly ? `Monthly: ${financialData.monthly}` : undefined}
                variant="warning"
              />
            </Pressable>
            <Pressable
              style={styles.cardWrap}
              onPress={() => router.push(path('staff-management') as never)}
            >
              <StatCard
                label="Today's attendance"
                value={attendanceText}
                variant="neutral"
              />
            </Pressable>
            <Pressable
              style={styles.cardWrap}
              onPress={() => router.push(path('examinations') as never)}
            >
              <StatCard
                label="Upcoming exams"
                value={upcomingExams}
                variant="primary"
              />
            </Pressable>
            <Pressable
              style={styles.cardWrap}
              onPress={() => router.push(path('communication') as never)}
            >
              <StatCard
                label="Recent notices"
                value={noticesCount}
                variant="neutral"
              />
            </Pressable>
          </View>
          <SectionHeader title="Administrative" />
          <View style={styles.grid}>
            <View style={styles.cardWrap}>
              <StatCard label="Visitors" value={visitors ?? '—'} variant="neutral" />
            </View>
            <View style={styles.cardWrap}>
              <StatCard label="Leaves" value={leaves ?? '—'} variant="neutral" />
            </View>
          </View>
          <Pressable
            style={styles.cardWrap}
            onPress={() => router.push(path('classes') as never)}
          >
            <StatCard
              label="Classes"
              value={Array.isArray(classesList) ? classesList.length : (stats.classes ?? '—')}
              variant="primary"
            />
          </Pressable>
          <Pressable
            style={styles.cardWrap}
            onPress={() => router.push(path('timetable') as never)}
          >
            <StatCard
              label="Timetable"
              value={Array.isArray(timetableList) ? timetableList.length : '—'}
              variant="neutral"
            />
          </Pressable>
          <Pressable
            style={styles.cardWrap}
            onPress={() => router.push(path('attendance') as never)}
          >
            <StatCard label="Attendance" value="View" variant="neutral" />
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: spacing[4], paddingBottom: spacing[12] },
  loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[12] },
  loadingText: { ...textStyles.bodySm, color: SLATE, marginTop: spacing[2] },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    padding: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  errorText: { ...textStyles.bodySm, color: '#B91C1C' },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: '#B91C1C' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4], marginBottom: spacing[4] },
  cardWrap: { width: '47%', minWidth: 140 },
});
