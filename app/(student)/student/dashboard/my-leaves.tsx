/**
 * My Leaves: status summary cards, filter tabs, list or empty state with Apply CTA.
 * Matches provided UI: approved/rejected/pending cards, All|Approved|Rejected|Pending tabs,
 * empty state with calendar + leaf illustration and "Apply for Leave" button.
 * API: GET /api/leave/student-requests?school_code=&student_id=
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStudent } from '@/lib/student-context';
import { env } from '@/lib/env';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { leaveService } from '@/services/leave.service';

// Match image colour scheme
const PRIMARY_BLUE = '#007bff';
const ACTIVE_TAB_BG = '#e0efff';
const TITLE_DARK = '#1E1E1E';
const GREY_MUTED = '#888888';
const APPROVED_BG = '#e6f9ed';
const APPROVED_TEXT = '#16A34A';
const REJECTED_BG = '#ffebe8';
const REJECTED_TEXT = '#B91C1C';
const PENDING_BG = '#fffde6';
const PENDING_TEXT = '#B45309';
const CARD_SHADOW = { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 };

const FILTERS = ['All', 'Approved', 'Rejected', 'Pending'] as const;
type Filter = (typeof FILTERS)[number];

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function normalizeStatus(s: string): 'approved' | 'rejected' | 'pending' {
  const lower = (s ?? '').toLowerCase();
  if (lower === 'approved') return 'approved';
  if (lower === 'rejected') return 'rejected';
  return 'pending';
}

type LeaveRequest = {
  id: string;
  leave_type_name?: string;
  start_date?: string;
  end_date?: string;
  status: 'approved' | 'rejected' | 'pending';
  reason?: string;
  leave_title?: string;
};

export default function StudentMyLeavesScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const [filter, setFilter] = useState<Filter>('All');

  const canFetch = Boolean(schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no)));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leave', 'student-requests', schoolCode, studentId, student?.admission_no],
    queryFn: async () => {
      let effectiveId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveId) return [];
      const r = await leaveService.getStudentLeaveRequests(schoolCode, effectiveId);
      const raw = r?.data ?? r;
      const list = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
      return list as Record<string, unknown>[];
    },
    enabled: canFetch,
  });

  const requests: LeaveRequest[] = useMemo(() => {
    return (data ?? []).map((r) => ({
      id: String(r.id ?? ''),
      leave_type_name: (r.leave_type_name ?? r.leave_title ?? r.type_name) as string | undefined,
      start_date: (r.start_date ?? r.leave_start_date) as string | undefined,
      end_date: (r.end_date ?? r.leave_end_date) as string | undefined,
      status: normalizeStatus((r.status as string) ?? 'pending'),
      reason: r.reason as string | undefined,
      leave_title: r.leave_title as string | undefined,
    }));
  }, [data]);

  const { approvedCount, rejectedCount, pendingCount, filtered } = useMemo(() => {
    const approvedCount = requests.filter((r) => r.status === 'approved').length;
    const rejectedCount = requests.filter((r) => r.status === 'rejected').length;
    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    let list = requests;
    if (filter === 'Approved') list = list.filter((r) => r.status === 'approved');
    else if (filter === 'Rejected') list = list.filter((r) => r.status === 'rejected');
    else if (filter === 'Pending') list = list.filter((r) => r.status === 'pending');
    return { approvedCount, rejectedCount, pendingCount, filtered: list };
  }, [requests, filter]);

  const goToApply = () => router.push('/student/dashboard/apply-leave' as never);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Leaves</Text>
        <Pressable
          style={styles.refreshBtn}
          onPress={() => refetch()}
          hitSlop={12}
        >
          <Ionicons name="refresh" size={22} color={GREY_MUTED} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={PRIMARY_BLUE} />
        }
      >
        {/* Status summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.approvedCard]}>
            <Text style={[styles.summaryLabel, styles.approvedText]}>APPROVED</Text>
            <Text style={[styles.summaryCount, styles.approvedText]}>{approvedCount}</Text>
          </View>
          <View style={[styles.summaryCard, styles.rejectedCard]}>
            <Text style={[styles.summaryLabel, styles.rejectedText]}>REJECTED</Text>
            <Text style={[styles.summaryCount, styles.rejectedText]}>{rejectedCount}</Text>
          </View>
          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Text style={[styles.summaryLabel, styles.pendingText]}>PENDING</Text>
            <Text style={[styles.summaryCount, styles.pendingText]}>{pendingCount}</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabsRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.tab, filter === f && styles.tabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={PRIMARY_BLUE} style={styles.loader} />
        ) : filtered.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIllustration}>
              <View style={styles.calendarIcon}>
                <Ionicons name="calendar-outline" size={80} color={ACTIVE_TAB_BG} />
              </View>
              <View style={styles.leafBadge}>
                <Ionicons name="leaf" size={28} color={PRIMARY_BLUE} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No leave requests yet</Text>
            <Text style={styles.emptyDesc}>
              Apply for leave when you need time off. Your requests will appear here once submitted.
            </Text>
            <Pressable style={styles.applyBtn} onPress={goToApply}>
              <View style={styles.applyBtnIcon}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.applyBtnText}>Apply for Leave</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {filtered.map((r) => (
              <View key={r.id} style={styles.leaveCard}>
                <View style={styles.leaveCardRow}>
                  <Text style={styles.leaveCardTitle}>
                    {r.leave_type_name ?? r.leave_title ?? 'Leave'}
                  </Text>
                  <View style={[styles.statusPill, r.status === 'approved' && styles.statusApproved, r.status === 'rejected' && styles.statusRejected, r.status === 'pending' && styles.statusPending]}>
                    <Text style={[styles.statusPillText, r.status === 'approved' && styles.statusApprovedText, r.status === 'rejected' && styles.statusRejectedText, r.status === 'pending' && styles.statusPendingText]}>
                      {r.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.leaveCardMeta}>
                  {r.start_date ? formatDate(r.start_date) : '—'} – {r.end_date ? formatDate(r.end_date) : '—'}
                </Text>
                {r.reason ? (
                  <Text style={styles.leaveCardReason} numberOfLines={2}>{r.reason}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        {/* Apply CTA when list exists */}
        {filtered.length > 0 && (
          <Pressable style={styles.applyBtn} onPress={goToApply}>
            <View style={styles.applyBtnIcon}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.applyBtnText}>Apply for Leave</Text>
          </Pressable>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 56,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: TITLE_DARK },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  approvedCard: { backgroundColor: APPROVED_BG },
  rejectedCard: { backgroundColor: REJECTED_BG },
  pendingCard: { backgroundColor: PENDING_BG },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  summaryCount: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  approvedText: { color: APPROVED_TEXT },
  rejectedText: { color: REJECTED_TEXT },
  pendingText: { color: PENDING_TEXT },

  tabsRow: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 24, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  tabActive: { backgroundColor: ACTIVE_TAB_BG },
  tabText: { fontSize: 14, fontWeight: '600', color: GREY_MUTED },
  tabTextActive: { color: PRIMARY_BLUE },

  loader: { marginVertical: 24 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyIllustration: { position: 'relative', marginBottom: 24 },
  calendarIcon: {
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F2FF',
    borderRadius: 16,
  },
  leafBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TITLE_DARK, marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    color: GREY_MUTED,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 28,
    lineHeight: 20,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 10,
    width: '100%',
    maxWidth: 320,
  },
  applyBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  leaveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    ...CARD_SHADOW,
  },
  leaveCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  leaveCardTitle: { fontSize: 16, fontWeight: '700', color: TITLE_DARK, flex: 1 },
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusApproved: { backgroundColor: APPROVED_BG },
  statusRejected: { backgroundColor: REJECTED_BG },
  statusPending: { backgroundColor: PENDING_BG },
  statusPillText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  statusApprovedText: { color: APPROVED_TEXT },
  statusRejectedText: { color: REJECTED_TEXT },
  statusPendingText: { color: PENDING_TEXT },
  leaveCardMeta: { fontSize: 13, color: GREY_MUTED, marginBottom: 4 },
  leaveCardReason: { fontSize: 14, color: '#333333', lineHeight: 20 },
});
