/**
 * Staff attendance: date range + GET /api/attendance/staff.
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
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { schoolService } from '@/services/school.service';
import { SectionHeader, EmptyState } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function weekAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export default function StaffAttendanceScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const [startDate, setStartDate] = useState(weekAgoStr());
  const [endDate, setEndDate] = useState(todayStr());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['attendance', 'staff', schoolCode, startDate, endDate],
    queryFn: () =>
      schoolService.getStaffAttendance(schoolCode, { start_date: startDate, end_date: endDate }).then((r) => r.data),
    enabled: Boolean(schoolCode && startDate && endDate),
  });

  const raw = data as { data?: unknown[]; attendance?: unknown[] } | undefined;
  const list = (raw?.data ?? raw?.attendance ?? []) as Array<{ staff_id?: string; name?: string; date?: string; status?: string; [k: string]: unknown }>;

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Staff attendance</Text>
      </View>
      <View style={styles.filters}>
        <SectionHeader title="Date range" />
        <View style={styles.row}>
          <Text style={styles.label}>From</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>To</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <Pressable style={styles.refreshBtn} onPress={() => refetch()}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>
      {isLoading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load attendance'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState title="No attendance" message="No staff attendance for this period." />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {list.map((row, i) => (
            <View key={row.staff_id ?? row.date ?? i} style={styles.card}>
              <Text style={styles.cardName}>{row.name ?? row.staff_id ?? '—'}</Text>
              <Text style={styles.cardMeta}>{row.date ?? ''} · {row.status ?? '—'}</Text>
            </View>
          ))}
        </ScrollView>
      )}
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
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2] },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  filters: { padding: spacing[4], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  row: { marginBottom: spacing[3] },
  label: { ...textStyles.caption, color: '#6B7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: spacing[2], ...textStyles.body },
  refreshBtn: { marginTop: spacing[2] },
  refreshText: { fontSize: 14, color: INDIGO, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[12] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  errorText: { ...textStyles.bodySm, color: '#B91C1C', marginBottom: spacing[4] },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: INDIGO },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: spacing[4], marginBottom: spacing[3], borderWidth: 1, borderColor: '#E5E7EB' },
  cardName: { ...textStyles.body, color: '#111827', fontWeight: '600' },
  cardMeta: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
});
