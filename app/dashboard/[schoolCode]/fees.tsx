/**
 * Fees: dashboard, fee-heads, structures, collection, statements, reports.
 * APIs: GET /api/fees/v2/fee-heads, payments, receipts, reports.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { feesService } from '@/services/fees.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function FeesScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();

  const { data: headsData, isLoading } = useQuery({
    queryKey: ['fees', 'fee-heads', schoolCode],
    queryFn: () => feesService.getFeeHeads(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: paymentsData } = useQuery({
    queryKey: ['fees', 'payments', schoolCode],
    queryFn: () => feesService.getPayments(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const heads = (headsData as { data?: unknown[] })?.data ?? (Array.isArray(headsData) ? headsData : []);
  const payments = (paymentsData as { data?: unknown[] })?.data ?? (Array.isArray(paymentsData) ? paymentsData : []);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Fees</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="Fee heads" />
        {isLoading && !Array.isArray(heads)?.length ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : Array.isArray(heads) && heads.length > 0 ? (
          (heads as { id?: string; name?: string }[]).map((h, i) => (
            <View key={h.id ?? i} style={styles.card}>
              <Text style={styles.cardTitle}>{h.name ?? '—'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No fee heads. Configure in the web app.</Text>
        )}
        <SectionHeader title="Recent payments" />
        <Text style={styles.hint}>{Array.isArray(payments) ? payments.length : 0} payment(s). Use web app for collection and statements.</Text>
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
  empty: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[4] },
  hint: { ...textStyles.bodySm, color: '#6B7280' },
  card: { backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { ...textStyles.body, color: '#111827' },
});
