/**
 * Expense/income: GET/POST finance or expense-income APIs.
 * Visible if view_finances or manage_finances. Same APIs/tables as admin.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { financeService } from '@/services/finance.service';
import { SectionHeader, StatCard } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

export default function TeacherExpenseIncomeScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();

  const { data: expenseData } = useQuery({
    queryKey: ['finance', 'expenses', schoolCode],
    queryFn: () => financeService.getExpenses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: incomeData, isLoading } = useQuery({
    queryKey: ['finance', 'income', schoolCode],
    queryFn: () => financeService.getIncome(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const expenses = (Array.isArray(expenseData) ? expenseData : (expenseData as { data?: unknown[] })?.data ?? []) as unknown[];
  const income = (Array.isArray(incomeData) ? incomeData : (incomeData as { data?: unknown[] })?.data ?? []) as unknown[];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Expense / Income</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Overview" />
        <View style={styles.grid}>
          <View style={styles.cardWrap}><StatCard label="Expense entries" value={expenses.length} variant="warning" /></View>
          <View style={styles.cardWrap}><StatCard label="Income entries" value={income.length} variant="success" /></View>
        </View>
        <SectionHeader title="Expenses" />
        {expenses.length === 0 && !isLoading && <Text style={styles.hint}>No expense entries. Use web app to add.</Text>}
        {expenses.slice(0, 5).map((e: { id?: string; amount?: number; description?: string }, i: number) => (
          <View key={e.id ?? i} style={styles.row}>
            <Text style={styles.rowText}>{e.description ?? '—'}</Text>
            <Text style={styles.rowAmount}>{e.amount != null ? String(e.amount) : '—'}</Text>
          </View>
        ))}
        <SectionHeader title="Income" />
        {income.length === 0 && !isLoading && <Text style={styles.hint}>No income entries.</Text>}
        {income.slice(0, 5).map((e: { id?: string; amount?: number; description?: string }, i: number) => (
          <View key={e.id ?? i} style={styles.row}>
            <Text style={styles.rowText}>{e.description ?? '—'}</Text>
            <Text style={[styles.rowAmount, { color: G }]}>{e.amount != null ? String(e.amount) : '—'}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 56 },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4], marginBottom: spacing[4] },
  cardWrap: { width: '47%', minWidth: 120 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  rowText: { ...textStyles.body, color: '#111827', flex: 1 },
  rowAmount: { ...textStyles.body, fontWeight: '600', color: '#111827' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
