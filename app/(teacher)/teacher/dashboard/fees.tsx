/**
 * Fees: fee heads, structures, payments. GET fee-heads, fee-structures, payments, receipts.
 * Visible if view_fees or manage_fees. Same APIs/tables as admin.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { feesService } from '@/services/fees.service';
import { SectionHeader, StatCard } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

export default function TeacherFeesScreen() {
  const router = useRouter();
  const { schoolCode } = useTeacher();

  const { data: headsData } = useQuery({
    queryKey: ['fees', 'heads', schoolCode],
    queryFn: () => feesService.getFeeHeads(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: structuresData } = useQuery({
    queryKey: ['fees', 'structures', schoolCode],
    queryFn: () => feesService.getFeeStructures(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['fees', 'payments', schoolCode],
    queryFn: () => feesService.getPayments(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const heads = (Array.isArray(headsData) ? headsData : (headsData as { data?: unknown[] })?.data ?? []) as { id?: string; name?: string }[];
  const structures = (Array.isArray(structuresData) ? structuresData : (structuresData as { data?: unknown[] })?.data ?? []) as { id?: string; name?: string }[];
  const payments = (Array.isArray(paymentsData) ? paymentsData : (paymentsData as { data?: unknown[] })?.data ?? []) as unknown[];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Fees</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Overview" />
        <View style={styles.grid}>
          <View style={styles.cardWrap}><StatCard label="Fee heads" value={heads.length} variant="primary" /></View>
          <View style={styles.cardWrap}><StatCard label="Structures" value={structures.length} variant="success" /></View>
          <View style={styles.cardWrap}><StatCard label="Payments" value={payments.length} variant="neutral" /></View>
        </View>
        <SectionHeader title="Fee heads" />
        {heads.slice(0, 10).map((h) => (
          <View key={h.id} style={styles.row}><Text style={styles.rowText}>{h.name ?? h.id ?? '—'}</Text></View>
        ))}
        {heads.length === 0 && !isLoading && <Text style={styles.hint}>No fee heads.</Text>}
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
  cardWrap: { width: '30%', minWidth: 100 },
  row: { backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  rowText: { ...textStyles.body, color: '#111827' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
