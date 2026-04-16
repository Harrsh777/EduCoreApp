/**
 * My Leaves: list with filter tabs (All | Pending | Approved | Rejected), status badge, withdraw if pending.
 * GET /api/leave/requests, POST /api/leave/requests/:id/withdraw.
 */

import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { leaveService } from '@/services/leave.service';
import { useToastStore } from '@/lib/toast';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, PrimaryButton, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

type Filter = 'all' | 'pending' | 'approved' | 'rejected';
type Request = {
  id: string;
  leave_type_id?: string;
  leave_type_name?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  reason?: string;
  days?: number;
};

function dayCount(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  if (a.getTime() > b.getTime()) return 0;
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

function StatusPill({ status }: { status?: string }) {
  const st = (status ?? 'pending').toLowerCase();
  const isApproved = st === 'approved';
  const isRejected = st === 'rejected';
  const bg = isApproved ? colors.primaryLight : isRejected ? colors.dangerLight : colors.warningLight;
  const text = isApproved ? colors.primaryDark : isRejected ? colors.danger : colors.warning;
  const label = (status ?? 'Pending').charAt(0).toUpperCase() + (status ?? 'pending').slice(1);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: text }]}>{label}</Text>
    </View>
  );
}

export default function TeacherMyLeavesScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');

  const staffId = teacher?.staff_id ?? teacher?.id ?? '';
  const { data: typesData } = useQuery({
    queryKey: ['leave', 'types', schoolCode],
    queryFn: () => leaveService.getLeaveTypes(schoolCode).then((r) => (r as { data?: Array<{ id: string; name?: string }> })?.data ?? []),
    enabled: Boolean(schoolCode),
  });
  const leaveTypeNameById = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(typesData) ? typesData : []).forEach((t) => {
      if (t?.id) map.set(String(t.id), t.name ?? '');
    });
    return map;
  }, [typesData]);

  const { data: requestsData, refetch, isRefetching, isLoading, error } = useQuery({
    queryKey: ['leave', 'requests', schoolCode, staffId],
    queryFn: () =>
      leaveService.getStaffLeaveRequests(schoolCode, { staff_id: staffId }).then((r) => (r as { data?: Request[] })?.data ?? []),
    enabled: Boolean(schoolCode && staffId),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => leaveService.withdrawStaffLeaveRequest(schoolCode, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests', schoolCode, staffId] });
      showToast('Request withdrawn', 'success');
    },
    onError: (err: Error) => showToast(err?.message ?? 'Withdraw failed', 'error'),
  });

  const requests = (Array.isArray(requestsData) ? requestsData : []) as Request[];
  const filtered = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((r) => (r.status ?? 'pending').toLowerCase() === filter);
  }, [requests, filter]);

  if (error) {
    return (
      <View style={styles.root}>
        <AppHeader title="My Leaves" />
        <ScreenWrapper scroll={false}>
          <Text style={styles.errorText}>Failed to load leave requests.</Text>
        </ScreenWrapper>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppHeader title="My Leaves" />
      <View style={styles.tabs}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      <ScreenWrapper
        scroll
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        loading={isLoading && requests.length === 0}
        contentContainerStyle={styles.content}
      >
        {filtered.map((r) => {
          const days = r.days ?? dayCount(r.start_date, r.end_date);
          const isPending = (r.status ?? 'pending').toLowerCase() === 'pending';
          return (
            <Card key={r.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>
                  {r.leave_type_name?.trim() ||
                    leaveTypeNameById.get(String(r.leave_type_id ?? ''))?.trim() ||
                    'Leave'}
                </Text>
                <StatusPill status={r.status} />
              </View>
              <Text style={styles.cardDates}>{r.start_date ?? ''} – {r.end_date ?? ''}</Text>
              <Text style={styles.cardDays}>{days} day{days !== 1 ? 's' : ''}</Text>
              {r.reason ? <Text style={styles.cardReason} numberOfLines={2}>{r.reason}</Text> : null}
              {isPending && (
                <Pressable
                  style={styles.withdrawBtn}
                  onPress={() => withdrawMutation.mutate(r.id)}
                  disabled={withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Text style={styles.withdrawText}>Withdraw</Text>
                  )}
                </Pressable>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && !isLoading && (
          <Text style={styles.empty}>No leave requests{filter !== 'all' ? ` (${filter})` : ''}.</Text>
        )}
        <View style={styles.bottomPad} />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: s.sm },
  tab: { flex: 1, paddingVertical: s.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.xs },
  cardTitle: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  cardDates: { ...textStyles.caption, color: colors.textMuted },
  cardDays: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
  cardReason: { ...textStyles.caption, color: colors.textSecondary, marginTop: s.sm },
  pill: { paddingHorizontal: s.sm, paddingVertical: 4, borderRadius: 9999 },
  pillText: { fontSize: 12, fontWeight: '600' },
  withdrawBtn: { marginTop: s.md, alignSelf: 'flex-start', paddingVertical: s.sm, paddingHorizontal: s.lg },
  withdrawText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', marginTop: s.xl },
  errorText: { ...textStyles.body, color: colors.danger, padding: s.lg },
  bottomPad: { height: 40 },
});
