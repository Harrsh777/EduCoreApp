/**
 * Student fees v2 — GET /api/student/fees with `student_fees` (all rows, student-scoped).
 */

import { env } from '@/lib/env';
import {
  countPaidFeeEntries,
  extractStudentFeesRows,
  feeSourceDisplayName,
  normalizeStudentFees,
  sortFeeLinesByDueDateAsc,
  sumBalancesByFeeSourceThisMonth,
  sumBalancesByFeeSourceThisQuarter,
  type StudentFeeLine,
} from '@/lib/studentFeesV2';
import { useStudent } from '@/lib/student-context';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const C = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryBg: '#EBF3FF',
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  textDark: '#111827',
  textMid: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  red: '#DC2626',
  redBg: '#FEE2E2',
};

type Tab = 'statement' | 'history';

type Receipt = {
  id?: string;
  payment_id?: string;
  receipt_no?: string;
  amount?: number;
  date?: string;
  paid_at?: string;
  fee_name?: string;
  status?: string;
};

function fmtShort(d?: string | null) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

function currency(amount?: number, sym = '₹') {
  if (amount == null) return '—';
  return `${sym}${amount.toLocaleString('en-IN')}`;
}

type StatusKey = 'pending' | 'partial' | 'paid' | 'overdue';

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: C.amberBg, text: C.amber },
  partial: { label: 'Partial', bg: '#FEF9C3', text: '#A16207' },
  paid: { label: 'Paid', bg: C.greenBg, text: C.green },
  overdue: { label: 'Overdue', bg: C.redBg, text: C.red },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[(status as StatusKey) ?? 'pending'] ?? STATUS_CONFIG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function StatementRow({
  line,
  sym,
  onPayNow,
}: {
  line: StudentFeeLine;
  sym: string;
  onPayNow: (line: StudentFeeLine) => void;
}) {
  const status = line.status;
  const amountRight =
    status === 'paid'
      ? currency(line.paid_amount > 0 ? line.paid_amount : line.base_amount, sym)
      : `${currency(line.balance, sym)} due`;

  const dateLine = line.due_date
    ? `Due ${fmtShort(line.due_date)} · Base ${currency(line.base_amount, sym)} · Paid ${currency(line.paid_amount, sym)}`
    : `Base ${currency(line.base_amount, sym)} · Paid ${currency(line.paid_amount, sym)}`;

  return (
    <View style={styles.statementCard}>
      <View style={styles.statementTop}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.statementTitle}>{line.title}</Text>
          {line.subtitle ? <Text style={styles.statementSub}>{line.subtitle}</Text> : null}
          <Text style={styles.statementMeta}>{dateLine}</Text>
        </View>
        <StatusBadge status={status} />
      </View>
      <View style={styles.statementBottom}>
        <Text style={styles.statementSummary}>
          {line.title} → {STATUS_CONFIG[status]?.label ?? status} → {amountRight}
        </Text>
        {status !== 'paid' && line.balance > 0 ? (
          <Pressable onPress={() => onPayNow(line)}>
            <Text style={styles.payNow}>Pay Now →</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ReceiptCard({
  item,
  onDownload,
}: {
  item: Receipt;
  onDownload: (item: Receipt) => void;
}) {
  const displayDate = item.date ?? item.paid_at;
  return (
    <View style={styles.receiptCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.receiptNo}>{item.receipt_no ?? `Receipt #${item.payment_id ?? item.id}`}</Text>
        {item.fee_name ? <Text style={styles.receiptSub}>{item.fee_name}</Text> : null}
        <Text style={styles.receiptMeta}>
          {displayDate ? new Date(displayDate).toLocaleDateString() : '—'} · {currency(item.amount)}
        </Text>
      </View>
      <Pressable
        style={styles.downloadBtn}
        onPress={() => (item.payment_id ?? item.id) && onDownload(item)}
      >
        <Text style={styles.downloadText}>View / Download</Text>
      </Pressable>
    </View>
  );
}

function normalizeReceipt(row: Record<string, unknown>): Receipt {
  return {
    id: row.id != null ? String(row.id) : undefined,
    payment_id: row.payment_id != null ? String(row.payment_id) : undefined,
    receipt_no: (row.receipt_no ?? row.receipt_number) as string | undefined,
    amount: typeof row.amount === 'number' ? row.amount : undefined,
    date: (row.paid_at ?? row.date ?? row.payment_date) as string | undefined,
    paid_at: (row.paid_at ?? row.date) as string | undefined,
    fee_name: (row.fee_name ?? row.component_name) as string | undefined,
    status: row.status as string | undefined,
  };
}

function BalanceBySourceBlock({
  title,
  bySource,
  sym,
}: {
  title: string;
  bySource: Record<string, number>;
  sym: string;
}) {
  const entries = Object.entries(bySource).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    return (
      <View style={styles.balanceBlock}>
        <Text style={styles.balanceBlockTitle}>{title}</Text>
        <Text style={styles.balanceNone}>No balance due</Text>
      </View>
    );
  }
  return (
    <View style={styles.balanceBlock}>
      <Text style={styles.balanceBlockTitle}>{title}</Text>
      {entries.map(([src, amt]) => (
        <View key={src} style={styles.balanceRow}>
          <Text style={styles.balanceSource}>{feeSourceDisplayName(src)}</Text>
          <Text style={styles.balanceAmt}>{currency(amt, sym)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StudentFeesV2Screen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const [tab, setTab] = useState<Tab>('statement');

  async function resolveEffectiveStudentId(): Promise<string> {
    let effectiveId = studentId;
    if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
      try {
        const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
        const row = (r as { data?: { id?: string } })?.data;
        if (row?.id) effectiveId = String(row.id);
      } catch {
        /* keep studentId */
      }
    }
    return effectiveId;
  }

  const canFetch = Boolean(schoolCode && studentId);

  const {
    data: feesPayload,
    isLoading: loadingFees,
    refetch: refetchFees,
    isRefetching: isRefetchingFees,
  } = useQuery({
    queryKey: ['student', 'fees', 'v2', schoolCode, studentId, student?.admission_no],
    queryFn: async () => {
      const effectiveId = await resolveEffectiveStudentId();
      if (!effectiveId) {
        return {
          rows: [] as Record<string, unknown>[],
          meta: {} as Record<string, unknown>,
          effectiveStudentId: '',
        };
      }
      const r = await studentService.getFees({ school_code: schoolCode, student_id: effectiveId });
      const body = (r as { data?: unknown })?.data ?? r;
      const rows = extractStudentFeesRows(body);
      let meta: Record<string, unknown> = {};
      if (body != null && typeof body === 'object' && !Array.isArray(body)) {
        meta = { ...(body as Record<string, unknown>) };
        const inner = meta.data;
        if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
          meta = { ...meta, ...(inner as Record<string, unknown>) };
        }
      }
      return { rows, meta, effectiveStudentId: effectiveId };
    },
    enabled: canFetch,
  });

  const {
    data: receiptsData,
    isLoading: loadingReceipts,
    refetch: refetchReceipts,
    isRefetching: isRefetchingReceipts,
  } = useQuery({
    queryKey: ['student', 'fees', 'receipts', 'v2', schoolCode, studentId, student?.admission_no],
    queryFn: async () => {
      const effectiveId = await resolveEffectiveStudentId();
      if (!effectiveId) return [];
      const r = await studentService.getFeeReceipts({ school_code: schoolCode, student_id: effectiveId });
      const body = (r as { data?: unknown })?.data ?? r;
      const list = Array.isArray(body) ? body : (body as { data?: unknown[] })?.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: canFetch,
  });

  const effectiveStudentIdForNormalize = feesPayload?.effectiveStudentId ?? studentId;

  const feeLines = useMemo(() => {
    const rows = feesPayload?.rows ?? [];
    return normalizeStudentFees(rows, effectiveStudentIdForNormalize);
  }, [feesPayload?.rows, effectiveStudentIdForNormalize]);

  const sortedLines = useMemo(() => sortFeeLinesByDueDateAsc(feeLines), [feeLines]);

  const totalDue = useMemo(() => feeLines.reduce((s, l) => s + l.balance, 0), [feeLines]);
  const totalPaid = useMemo(() => feeLines.reduce((s, l) => s + l.paid_amount, 0), [feeLines]);
  const receiptsCount = useMemo(() => countPaidFeeEntries(feeLines), [feeLines]);

  const monthBySource = useMemo(
    () => sumBalancesByFeeSourceThisMonth(feeLines, new Date()),
    [feeLines],
  );
  const quarterBySource = useMemo(
    () => sumBalancesByFeeSourceThisQuarter(feeLines, new Date()),
    [feeLines],
  );

  const meta = feesPayload?.meta ?? {};
  const sym = (meta.currency as string | undefined) ?? '₹';
  const academicYear = meta.academic_year as string | undefined;

  const receipts: Receipt[] = useMemo(() => {
    const list = Array.isArray(receiptsData)
      ? receiptsData
      : (receiptsData && typeof receiptsData === 'object' && (receiptsData as { data?: unknown[] }).data) ?? [];
    const arr = Array.isArray(list) ? list : [];
    return arr.map((row) => normalizeReceipt(typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {}));
  }, [receiptsData]);

  const refetch = () => {
    refetchFees();
    refetchReceipts();
  };
  const isRefetching = isRefetchingFees || isRefetchingReceipts;

  const handlePayNow = (line: StudentFeeLine) => {
    Alert.alert('Pay Now', `Redirecting to payment for ${line.title}…`);
  };

  const handleDownloadReceipt = (receipt: Receipt) => {
    const id = receipt.payment_id ?? receipt.id;
    if (!id) {
      Alert.alert('Download', 'Receipt ID not available.');
      return;
    }
    const base = (env.API_BASE_URL || '').replace(/\/+$/, '');
    const url = `${base}/api/fees/receipts/${encodeURIComponent(id)}/download?school_code=${encodeURIComponent(schoolCode)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open receipt. Try again later.'));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>Fees</Text>
        </Pressable>

        <Pressable onPress={() => setTab('history')} style={styles.receiptsLink}>
          <Text style={styles.receiptsText}>
            Receipts{receiptsCount > 0 ? ` (${receiptsCount})` : ''}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {loadingFees ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardBlue]}>
                <View style={styles.summaryIcon}>
                  <Text style={styles.summaryIconText}>💳</Text>
                </View>
                <Text style={styles.summaryCardLabel}>TOTAL DUE</Text>
                <Text style={[styles.summaryAmount, { color: C.primary }]}>{currency(totalDue, sym)}</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardGray]}>
                <View style={[styles.summaryIcon, styles.summaryIconGray]}>
                  <Text style={styles.summaryIconText}>✅</Text>
                </View>
                <Text style={styles.summaryCardLabel}>TOTAL PAID</Text>
                <Text style={[styles.summaryAmount, { color: C.textDark }]}>{currency(totalPaid, sym)}</Text>
              </View>
            </View>

            <Text style={styles.inlineSummary}>
              {currency(totalDue, sym)} due | {currency(totalPaid, sym)} paid
            </Text>

            <BalanceBySourceBlock title="This month (by source)" bySource={monthBySource} sym={sym} />
            <BalanceBySourceBlock title="This quarter (by source)" bySource={quarterBySource} sym={sym} />

            <View style={styles.tabRow}>
              <Pressable
                onPress={() => setTab('statement')}
                style={[styles.tabBtn, tab === 'statement' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === 'statement' && styles.tabTextActive]}>Fee Statement</Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('history')}
                style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Payment History</Text>
              </Pressable>
            </View>

            {tab === 'statement' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Entries</Text>
                  {academicYear ? (
                    <Text style={styles.academicYear}>Academic Year {academicYear}</Text>
                  ) : null}
                </View>

                {sortedLines.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>No fees found</Text>
                    <Text style={styles.emptySub}>Check back later</Text>
                  </View>
                ) : (
                  sortedLines.map((line, i) => (
                    <StatementRow key={line.id ?? i} line={line} sym={sym} onPayNow={handlePayNow} />
                  ))
                )}
              </View>
            )}

            {tab === 'history' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Receipts</Text>
                </View>

                {loadingReceipts ? (
                  <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 24 }} />
                ) : receipts.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🧾</Text>
                    <Text style={styles.emptyTitle}>No receipts yet</Text>
                    <Text style={styles.emptySub}>Receipts will appear here after payments</Text>
                  </View>
                ) : (
                  receipts.map((r, i) => (
                    <ReceiptCard
                      key={r.id ?? r.payment_id ?? i}
                      item={r}
                      onDownload={() => handleDownloadReceipt(r)}
                    />
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backIcon: { fontSize: 26, color: C.textDark, lineHeight: 30, fontWeight: '300' },
  backLabel: { fontSize: 22, fontWeight: '700', color: C.textDark, letterSpacing: -0.3 },
  receiptsLink: { paddingHorizontal: 4, paddingVertical: 4 },
  receiptsText: { fontSize: 15, fontWeight: '600', color: C.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, gap: 8 },
  summaryCardBlue: { backgroundColor: C.primaryBg },
  summaryCardGray: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconGray: { backgroundColor: '#F3F4F6' },
  summaryIconText: { fontSize: 18 },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMid,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  summaryAmount: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  inlineSummary: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMid,
    marginBottom: 16,
    textAlign: 'center',
  },
  balanceBlock: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  balanceBlockTitle: { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 8 },
  balanceNone: { fontSize: 13, color: C.textLight },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  balanceSource: { fontSize: 14, color: C.textMid },
  balanceAmt: { fontSize: 14, fontWeight: '700', color: C.textDark },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#EAECF0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    marginTop: 8,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabBtnActive: {
    backgroundColor: C.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: C.textMid },
  tabTextActive: { color: C.primary, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textDark },
  academicYear: { fontSize: 12, color: C.textLight },
  statementCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statementTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statementTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  statementSub: { fontSize: 12, color: C.textMid, marginBottom: 4 },
  statementMeta: { fontSize: 11, color: C.textLight },
  statementBottom: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statementSummary: { flex: 1, fontSize: 13, fontWeight: '600', color: C.textDark },
  payNow: { fontSize: 14, fontWeight: '700', color: C.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  receiptCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
    elevation: 2,
  },
  receiptNo: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  receiptSub: { fontSize: 12, color: C.textMid, marginBottom: 2 },
  receiptMeta: { fontSize: 12, color: C.textLight },
  downloadBtn: { backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  downloadText: { fontSize: 12, fontWeight: '700', color: C.primary },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.textLight, textAlign: 'center' },
});
