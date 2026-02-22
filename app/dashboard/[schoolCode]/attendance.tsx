/**
 * Attendance: overview (GET /api/attendance/overview), staff attendance. Tables: student_attendance, staff_attendance, classes, staff, students.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { attendanceService } from '@/services/attendance.service';
import { SectionHeader, StatCard } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function AttendanceScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();

  const { data: overviewData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['attendance', 'overview', schoolCode],
    queryFn: () => attendanceService.getAttendanceOverview(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const overview = (overviewData ?? {}) as Record<string, unknown>;
  const studentPct = (overview.student_attendance_pct as number) ?? (overview.students_present as number);
  const staffPct = (overview.staff_attendance_pct as number) ?? (overview.staff_present as number);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Attendance</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Overview" />
        {isLoading && !overviewData ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : isError ? (
          <View>
            <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load'}</Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            <View style={styles.cardWrap}>
              <StatCard label="Student attendance" value={studentPct != null ? `${studentPct}%` : '—'} variant="primary" />
            </View>
            <View style={styles.cardWrap}>
              <StatCard label="Staff attendance" value={staffPct != null ? `${staffPct}%` : '—'} variant="success" />
            </View>
          </View>
        )}
        <SectionHeader title="Staff attendance" />
        <Pressable
          style={styles.linkCard}
          onPress={() => router.push(path('staff-management/attendance') as never)}
        >
          <Text style={styles.linkText}>View staff attendance (by date range)</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  loader: { marginVertical: spacing[4] },
  error: { ...textStyles.bodySm, color: '#B91C1C' },
  retryBtn: { marginTop: spacing[2] },
  retryText: { ...textStyles.button, color: INDIGO },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4], marginBottom: spacing[6] },
  cardWrap: { width: '47%', minWidth: 140 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: spacing[4],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkText: { ...textStyles.body, color: '#111827', flex: 1 },
  chevron: { fontSize: 20, color: '#9CA3AF', marginLeft: spacing[2] },
});
