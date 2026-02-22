/**
 * Copy Checking: status cards (Excellent / Good / Needs Imp.), content type & status filters, list or empty state.
 * Matches provided UI: summary cards, Class Work | Homework, All Status | Checked | Incomplete, empty state with icon.
 * API: GET /api/student/copy-checking (student_id) or GET /api/copy-checking (school_code).
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
import { studentService } from '@/services/student.service';
import { copyCheckingService } from '@/services/copy-checking.service';

// Match image colour scheme
const PRIMARY_BLUE = '#2196F3';
const TITLE_DARK = '#333333';
const GREY_MUTED = '#888888';
const GREY_PILL = '#F0F0F0';
const EXCELLENT_BG = '#E8F5E9';
const EXCELLENT_TEXT = '#4CAF50';
const GOOD_BG = '#E3F2FD';
const GOOD_TEXT = '#2196F3';
const NEEDS_BG = '#FFF8E1';
const NEEDS_TEXT = '#FF9800';
const CARD_SHADOW = { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 };

const CONTENT_TYPES = ['Class Work', 'Homework'] as const;
const STATUS_FILTERS = ['All Status', 'Checked', 'Incomplete'] as const;
type ContentType = (typeof CONTENT_TYPES)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

function normalizeStatus(s: string): 'excellent' | 'good' | 'needs_improvement' | null {
  const lower = (s ?? '').toLowerCase().replace(/\s/g, '_');
  if (lower === 'excellent') return 'excellent';
  if (lower === 'good') return 'good';
  if (lower === 'needs_improvement' || lower === 'needs_imp') return 'needs_improvement';
  return null;
}

function normalizeContentType(s: string): 'class_work' | 'homework' {
  const lower = (s ?? '').toLowerCase().replace(/\s/g, '_');
  if (lower === 'homework') return 'homework';
  return 'class_work';
}

type CopyRecord = {
  id: string;
  subject?: string;
  subject_name?: string;
  status: 'excellent' | 'good' | 'needs_improvement';
  content_type: 'class_work' | 'homework';
  checked: boolean;
  date?: string;
  staff_name?: string;
  class_name?: string;
};

export default function StudentCopyCheckingScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const [contentType, setContentType] = useState<ContentType>('Class Work');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All Status');

  const canFetch = Boolean(schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no)));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['copy-checking', 'student', schoolCode, studentId, student?.admission_no],
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
      try {
        if (effectiveId) {
          const r = await studentService.getCopyChecking({ school_code: schoolCode, student_id: effectiveId });
          return r?.data ?? r;
        }
      } catch {
        // fallback
      }
      const r = await copyCheckingService.getCopyChecking(schoolCode);
      return r?.data ?? r;
    },
    enabled: Boolean(schoolCode),
  });

  const rawList = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
  const records: CopyRecord[] = useMemo(() => {
    return (rawList as Record<string, unknown>[]).map((r, i) => {
      const status = normalizeStatus((r.status as string) ?? '') ?? 'good';
      const content_type = normalizeContentType((r.content_type as string) ?? (r.type as string) ?? 'class_work');
      const checked = r.checked === true || r.is_checked === true || status != null;
      return {
        id: String(r.id ?? i),
        subject: (r.subject ?? r.subject_name) as string | undefined,
        subject_name: r.subject_name as string | undefined,
        status,
        content_type,
        checked,
        date: (r.date ?? r.checked_at ?? r.created_at) as string | undefined,
        staff_name: r.staff_name as string | undefined,
        class_name: r.class_name as string | undefined,
      };
    });
  }, [rawList]);

  const { excellentCount, goodCount, needsCount, filtered } = useMemo(() => {
    const excellentCount = records.filter((r) => r.status === 'excellent').length;
    const goodCount = records.filter((r) => r.status === 'good').length;
    const needsCount = records.filter((r) => r.status === 'needs_improvement').length;
    const contentMatch = contentType === 'Class Work' ? 'class_work' : 'homework';
    const statusMatch = statusFilter === 'All Status' ? null : statusFilter === 'Checked';
    let list = records.filter((r) => r.content_type === contentMatch);
    if (statusMatch === true) list = list.filter((r) => r.checked);
    if (statusMatch === false) list = list.filter((r) => !r.checked);
    return { excellentCount, goodCount, needsCount, filtered: list };
  }, [records, contentType, statusFilter]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TITLE_DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>Copy Checking</Text>
        <Pressable style={styles.refreshBtn} onPress={() => refetch()} hitSlop={12}>
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
        {/* Summary status cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.excellentCard]}>
            <Text style={[styles.summaryCount, styles.excellentText]}>{excellentCount}</Text>
            <Text style={[styles.summaryLabel, styles.excellentText]}>EXCELLENT</Text>
          </View>
          <View style={[styles.summaryCard, styles.goodCard]}>
            <Text style={[styles.summaryCount, styles.goodText]}>{goodCount}</Text>
            <Text style={[styles.summaryLabel, styles.goodText]}>GOOD</Text>
          </View>
          <View style={[styles.summaryCard, styles.needsCard]}>
            <Text style={[styles.summaryCount, styles.needsText]}>{needsCount}</Text>
            <Text style={[styles.summaryLabel, styles.needsText]}>NEEDS IMP.</Text>
          </View>
        </View>

        {/* Content type filters: Class Work | Homework */}
        <View style={styles.pillRow}>
          {CONTENT_TYPES.map((t) => (
            <Pressable
              key={t}
              style={[styles.contentPill, contentType === t && styles.contentPillActive]}
              onPress={() => setContentType(t)}
            >
              <Text style={[styles.contentPillText, contentType === t && styles.contentPillTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* Status filters: All Status | Checked | Incomplete */}
        <View style={styles.pillRow}>
          {STATUS_FILTERS.map((s) => (
            <Pressable
              key={s}
              style={[styles.statusPill, statusFilter === s && styles.statusPillActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.statusPillText, statusFilter === s && styles.statusPillTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={PRIMARY_BLUE} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <View style={styles.emptyPapers}>
                <Ionicons name="document-text-outline" size={64} color="#90CAF9" />
              </View>
              <View style={styles.emptyCheckBadge}>
                <Ionicons name="checkmark-circle" size={40} color="#90CAF9" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyDesc}>
              Your copy checking status will appear here once marked by your teachers.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((r) => (
              <View key={r.id} style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <Text style={styles.recordSubject}>{r.subject ?? r.subject_name ?? 'Subject'}</Text>
                  <View style={[styles.recordStatusPill, r.status === 'excellent' && styles.pillExcellent, r.status === 'good' && styles.pillGood, r.status === 'needs_improvement' && styles.pillNeeds]}>
                    <Text style={[styles.recordStatusText, r.status === 'excellent' && styles.pillExcellentText, r.status === 'good' && styles.pillGoodText, r.status === 'needs_improvement' && styles.pillNeedsText]}>
                      {r.status === 'needs_improvement' ? 'Needs Imp.' : r.status}
                    </Text>
                  </View>
                </View>
                {r.staff_name ? <Text style={styles.recordMeta}>Checked by {r.staff_name}</Text> : null}
                {r.date ? <Text style={styles.recordMeta}>{new Date(r.date).toLocaleDateString()}</Text> : null}
              </View>
            ))}
          </View>
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
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: TITLE_DARK },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREY_PILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  excellentCard: { backgroundColor: EXCELLENT_BG },
  goodCard: { backgroundColor: GOOD_BG },
  needsCard: { backgroundColor: NEEDS_BG },
  summaryCount: { fontSize: 28, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
  excellentText: { color: EXCELLENT_TEXT },
  goodText: { color: GOOD_TEXT },
  needsText: { color: NEEDS_TEXT },

  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  contentPill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: GREY_PILL,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: GREY_PILL,
    borderLeftColor: 'transparent',
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  contentPillActive: { backgroundColor: '#FFFFFF', borderLeftColor: PRIMARY_BLUE, borderColor: '#E0E0E0' },
  contentPillText: { fontSize: 14, fontWeight: '600', color: GREY_MUTED },
  contentPillTextActive: { color: PRIMARY_BLUE },

  statusPill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: GREY_PILL,
    alignItems: 'center',
  },
  statusPillActive: { backgroundColor: PRIMARY_BLUE },
  statusPillText: { fontSize: 13, fontWeight: '600', color: TITLE_DARK },
  statusPillTextActive: { color: '#FFFFFF' },

  loader: { marginVertical: 24 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyIconWrap: { position: 'relative', marginBottom: 24 },
  emptyPapers: {
    width: 120,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
  },
  emptyCheckBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TITLE_DARK, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: GREY_MUTED, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },

  list: { gap: 12 },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    ...CARD_SHADOW,
  },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  recordSubject: { fontSize: 16, fontWeight: '700', color: TITLE_DARK, flex: 1 },
  recordStatusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  pillExcellent: { backgroundColor: EXCELLENT_BG },
  pillGood: { backgroundColor: GOOD_BG },
  pillNeeds: { backgroundColor: NEEDS_BG },
  recordStatusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  pillExcellentText: { color: EXCELLENT_TEXT },
  pillGoodText: { color: GOOD_TEXT },
  pillNeedsText: { color: NEEDS_TEXT },
  recordMeta: { fontSize: 13, color: GREY_MUTED, marginTop: 2 },
});
