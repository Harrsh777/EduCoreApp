/**
 * Student Fees Screen
 * UI matches the provided design: summary cards, tab switcher, fee line items + receipts.
 */

import { useStudent } from '@/lib/student-context';
import { feesService } from '@/services/fees.service';
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

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  primary:      '#2563EB',
  primaryLight: '#EFF6FF',
  primaryBg:    '#EBF3FF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  textDark:     '#111827',
  textMid:      '#6B7280',
  textLight:    '#9CA3AF',
  border:       '#E5E7EB',
  green:        '#16A34A',
  greenBg:      '#DCFCE7',
  amber:        '#D97706',
  amberBg:      '#FEF3C7',
  red:          '#DC2626',
  redBg:        '#FEE2E2',
  overdueBg:    '#FFF1F2',
};

type Tab = 'statement' | 'history';

// ─── Types ────────────────────────────────────────────────────────────────────
type FeesSummary = {
  total_due?: number;
  total_paid?: number;
  currency?: string;
  academic_year?: string;
  fees?: FeeItem[];
};

type FeeItem = {
  id?: string;
  name?: string;
  title?: string;
  component_name?: string;
  due_date?: string;
  paid_date?: string;
  base_amount?: number;
  amount?: number;
  paid_amount?: number;
  balance?: number;
  status?: 'pending' | 'partial' | 'paid' | 'overdue';
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

function fmtShort(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
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
  pending:  { label: 'PENDING',  bg: C.amberBg, text: C.amber  },
  partial:  { label: 'PARTIAL',  bg: '#FEF9C3', text: '#A16207' },
  paid:     { label: 'PAID',     bg: C.greenBg, text: C.green  },
  overdue:  { label: 'OVERDUE',  bg: C.redBg,   text: C.red    },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[(status as StatusKey) ?? 'pending'] ?? STATUS_CONFIG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Fee Statement Card ───────────────────────────────────────────────────────
function FeeCard({
  item,
  currency: sym,
  onPayNow,
}: {
  item: FeeItem;
  currency: string;
  onPayNow: (item: FeeItem) => void;
}) {
  const name = item.name || item.title || 'Fee';
  const balance = item.balance ?? (item.base_amount ?? 0) - (item.paid_amount ?? 0);
  const isPaid = item.status === 'paid';
  const dateLabel = isPaid
    ? `📅 Paid on: ${fmtShort(item.paid_date)}`
    : `📅 Due Date: ${fmtShort(item.due_date)}`;

  return (
    <View style={[styles.feeCard, isPaid && styles.feeCardPaid]}>
      {/* Top row */}
      <View style={styles.feeCardTop}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.feeName, isPaid && styles.feeNamePaid]}>{name}</Text>
          <Text style={styles.feeDateLabel}>{dateLabel}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Bottom row — only show for non-paid */}
      {!isPaid && (
        <View style={styles.feeCardBottom}>
          <View>
            <Text style={styles.balanceLabel}>BALANCE</Text>
            <Text style={styles.balanceAmount}>{currency(balance, sym)}</Text>
          </View>
          <Pressable onPress={() => onPayNow(item)}>
            <Text style={styles.payNow}>Pay Now →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Receipt Card ─────────────────────────────────────────────────────────────
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
          {fmt(displayDate)} · {currency(item.amount)}
        </Text>
      </View>
      <Pressable
        style={styles.downloadBtn}
        onPress={() => (item.payment_id ?? item.id) && onDownload(item)}
      >
        <Text style={styles.downloadText}>↓ Receipt</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
/** Normalize API fee component to FeeItem (API: id, component_name, amount, due_date, status) */
function normalizeFeeItem(row: Record<string, unknown>): FeeItem {
  return {
    id: row.id != null ? String(row.id) : undefined,
    name: (row.component_name ?? row.name ?? row.title) as string | undefined,
    title: (row.title ?? row.component_name ?? row.name) as string | undefined,
    due_date: (row.due_date as string | undefined),
    paid_date: (row.paid_date ?? row.paid_at) as string | undefined,
    base_amount: typeof row.amount === 'number' ? row.amount : (row.base_amount as number | undefined),
    amount: typeof row.amount === 'number' ? row.amount : undefined,
    paid_amount: typeof row.paid_amount === 'number' ? row.paid_amount : undefined,
    balance: typeof row.balance === 'number' ? row.balance : undefined,
    status: (row.status as FeeItem['status']) ?? 'pending',
  };
}

/** Normalize API receipt to Receipt (API: id, payment_id, amount, paid_at, status) */
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

export default function StudentFeesScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const [tab, setTab] = useState<Tab>('statement');

  const {
    data: feesData,
    isLoading: loadingFees,
    refetch: refetchFees,
    isRefetching: isRefetchingFees,
  } = useQuery({
    queryKey: ['student', 'fees', schoolCode, studentId],
    queryFn: async () => {
      const r = await studentService.getFees({ school_code: schoolCode, student_id: studentId });
      const body = (r as { data?: unknown })?.data ?? r;
      const list = Array.isArray(body) ? body : (body as { data?: unknown[] })?.data ?? (body as { fees?: unknown[] })?.fees ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(schoolCode && studentId),
  });

  const {
    data: receiptsData,
    isLoading: loadingReceipts,
    refetch: refetchReceipts,
    isRefetching: isRefetchingReceipts,
  } = useQuery({
    queryKey: ['student', 'fees', 'receipts', schoolCode, studentId],
    queryFn: async () => {
      const r = await studentService.getFeeReceipts({ school_code: schoolCode, student_id: studentId });
      const body = (r as { data?: unknown })?.data ?? r;
      const list = Array.isArray(body) ? body : (body as { data?: unknown[] })?.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(schoolCode && studentId),
  });

  const feeItems: FeeItem[] = useMemo(() => {
    const list = Array.isArray(feesData)
      ? feesData
      : (feesData && typeof feesData === 'object' && (feesData as { data?: unknown[] }).data) ?? [];
    const arr = Array.isArray(list) ? list : [];
    return arr.map((row) => normalizeFeeItem(typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {}));
  }, [feesData]);

  const receipts: Receipt[] = useMemo(() => {
    const list = Array.isArray(receiptsData)
      ? receiptsData
      : (receiptsData && typeof receiptsData === 'object' && (receiptsData as { data?: unknown[] }).data) ?? [];
    const arr = Array.isArray(list) ? list : [];
    return arr.map((row) => normalizeReceipt(typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {}));
  }, [receiptsData]);

  const feesSummary = useMemo(() => {
    const raw =
      Array.isArray(feesData) || feesData == null
        ? null
        : (feesData as Record<string, unknown>);
    const summary: { total_due?: number; total_paid?: number; currency: string; academic_year?: string } = {
      currency: (raw && typeof raw === 'object' && (raw.currency as string)) ? (raw.currency as string) : '₹',
      academic_year: raw && typeof raw === 'object' ? (raw.academic_year as string) : undefined,
    };
    if (raw && typeof raw === 'object') {
      if (typeof raw.total_due === 'number') summary.total_due = raw.total_due;
      if (typeof raw.total_paid === 'number') summary.total_paid = raw.total_paid;
    }
    return summary;
  }, [feesData]);

  const fees = useMemo(() => {
    const totalDueFromItems = feeItems.reduce(
      (sum, i) => sum + (i.balance ?? (i.base_amount ?? 0) - (i.paid_amount ?? 0)),
      0
    );
    const totalPaidFromReceipts = receipts.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    return {
      ...feesSummary,
      total_due: feesSummary.total_due ?? (totalDueFromItems > 0 ? totalDueFromItems : undefined),
      total_paid: feesSummary.total_paid ?? (totalPaidFromReceipts > 0 ? totalPaidFromReceipts : undefined),
    };
  }, [feesSummary, feeItems, receipts]);

  const sym = fees.currency ?? '₹';

  const receiptCount = receipts.length;

  const refetch = () => {
    refetchFees();
    refetchReceipts();
  };
  const isRefetching = isRefetchingFees || isRefetchingReceipts;

  // Sort: pending/overdue first, then paid
  const sortedFees = [...feeItems].sort((a, b) => {
    const order: Record<string, number> = { overdue: 0, pending: 1, partial: 2, paid: 3 };
    return (order[a.status ?? 'pending'] ?? 1) - (order[b.status ?? 'pending'] ?? 1);
  });

  const handlePayNow = (item: FeeItem) => {
    Alert.alert('Pay Now', `Redirecting to payment for ${item.name ?? 'this fee'}…`);
    // Navigate to payment screen:
    // router.push({ pathname: '/student/fees/pay', params: { id: item.id } });
  };

  const handleDownloadReceipt = (receipt: Receipt) => {
    const paymentId = receipt.payment_id ?? receipt.id;
    if (!paymentId) {
      Alert.alert('Download', 'Receipt ID not available.');
      return;
    }
    feesService
      .getReceiptViewUrl(schoolCode, paymentId)
      .then((r) => {
        const url = (r.data as { url?: string })?.url;
        if (url) {
          Linking.openURL(url).catch(() =>
            Alert.alert('Error', 'Could not open receipt link.'),
          );
        } else {
          Alert.alert('Download', 'No receipt URL available.');
        }
      })
      .catch(() => Alert.alert('Download', 'Could not load receipt.'));
  };

  const isLoading = loadingFees;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>Fees</Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('history')}
          style={styles.receiptsLink}
        >
          <Text style={styles.receiptsText}>
            Receipts{receiptCount > 0 ? ` (${receiptCount})` : ''}
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
        {isLoading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <View style={styles.summaryRow}>
              {/* Total Due */}
              <View style={[styles.summaryCard, styles.summaryCardBlue]}>
                <View style={styles.summaryIcon}>
                  <Text style={styles.summaryIconText}>💳</Text>
                </View>
                <Text style={styles.summaryCardLabel}>TOTAL DUE</Text>
                <Text style={[styles.summaryAmount, { color: C.primary }]}>
                  {currency(fees.total_due, sym)}
                </Text>
              </View>

              {/* Total Paid */}
              <View style={[styles.summaryCard, styles.summaryCardGray]}>
                <View style={[styles.summaryIcon, styles.summaryIconGray]}>
                  <Text style={styles.summaryIconText}>✅</Text>
                </View>
                <Text style={styles.summaryCardLabel}>TOTAL PAID</Text>
                <Text style={[styles.summaryAmount, { color: C.textDark }]}>
                  {currency(fees.total_paid, sym)}
                </Text>
              </View>
            </View>

            {/* ── Tab Switcher ── */}
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => setTab('statement')}
                style={[styles.tabBtn, tab === 'statement' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === 'statement' && styles.tabTextActive]}>
                  Fee Statement
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('history')}
                style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
                  Payment History
                </Text>
              </Pressable>
            </View>

            {/* ── Fee Statement Tab ── */}
            {tab === 'statement' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Current Fees</Text>
                  {fees.academic_year ? (
                    <Text style={styles.academicYear}>
                      Academic Year {fees.academic_year}
                    </Text>
                  ) : null}
                </View>

                {sortedFees.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>No fees found</Text>
                    <Text style={styles.emptySub}>Check back later</Text>
                  </View>
                ) : (
                  sortedFees.map((item, i) => (
                    <FeeCard
                      key={item.id ?? i}
                      item={item}
                      currency={sym}
                      onPayNow={handlePayNow}
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Payment History Tab ── */}
            {tab === 'history' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Receipts</Text>
                </View>

                {loadingReceipts ? (
                  <ActivityIndicator
                    size="small"
                    color={C.primary}
                    style={{ marginTop: 24 }}
                  />
                ) : receipts.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🧾</Text>
                    <Text style={styles.emptyTitle}>No receipts yet</Text>
                    <Text style={styles.emptySub}>
                      Receipts will appear here after payments
                    </Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backIcon: {
    fontSize: 26,
    color: C.textDark,
    lineHeight: 30,
    fontWeight: '300',
  },
  backLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textDark,
    letterSpacing: -0.3,
  },
  receiptsLink: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  receiptsText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.primary,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  summaryCardBlue: {
    backgroundColor: C.primaryBg,
  },
  summaryCardGray: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconGray: {
    backgroundColor: '#F3F4F6',
  },
  summaryIconText: {
    fontSize: 18,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMid,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Tab switcher
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#EAECF0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: C.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textMid,
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: '700',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textDark,
  },
  academicYear: {
    fontSize: 12,
    color: C.textLight,
  },

  // Fee card
  feeCard: {
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
  feeCardPaid: {
    opacity: 0.7,
  },
  feeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  feeName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 4,
  },
  feeNamePaid: {
    color: C.textMid,
  },
  feeDateLabel: {
    fontSize: 12,
    color: C.textMid,
  },
  feeCardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    marginTop: 4,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    letterSpacing: -0.3,
  },
  payNow: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },

  // Status badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Receipt card
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
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  receiptNo: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 2,
  },
  receiptSub: {
    fontSize: 12,
    color: C.textMid,
    marginBottom: 2,
  },
  receiptMeta: {
    fontSize: 12,
    color: C.textLight,
  },
  downloadBtn: {
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },

  // Empty states
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: C.textLight,
    textAlign: 'center',
  },
});