import {
    AppCard,
    Button,
    DataList,
    LoadingSkeleton,
    SectionHeader,
    StatCard,
} from '@/components/ui';
import { useSchool } from '@/hooks/useSchool';
import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/lib/toast';
import { feesService } from '@/services/fees.service';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

type FeeHead = { id: string; name?: string; amount?: number; [key: string]: unknown };
type Payment = { id: string; amount?: number; student_id?: string; fee_id?: string; receipt_no?: string; [key: string]: unknown };

export default function SchoolFeesScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { data: headsData, isLoading: headsLoading } = useQuery({
    queryKey: ['school', 'fee-heads', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await feesService.getFeeHeads(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const { data: paymentsData, isLoading: paymentsLoading, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'fee-payments', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await feesService.getPayments(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const heads = Array.isArray(headsData) ? headsData : [];
  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const totalCollected = payments.reduce((sum: number, p: Payment) => sum + (Number(p.amount) || 0), 0);

  const handleDownloadReceipt = useCallback(
    async (item: Payment) => {
      const id = item.id;
      if (!school_code || !id) return;
      try {
        const res = await feesService.getReceiptViewUrl(school_code, id);
        const url = res.data?.url;
        if (url) {
          const can = await Linking.canOpenURL(url);
          if (can) await Linking.openURL(url);
          else showToast('Cannot open receipt link', 'error');
        } else {
          await feesService.downloadReceipt(school_code, id);
          showToast('Receipt downloaded', 'success');
        }
      } catch {
        showToast('Receipt unavailable', 'error');
      }
    },
    [school_code, showToast]
  );

  if (!school_code) return null;
  if (headsLoading && !headsData) return <LoadingSkeleton />;

  return (
    <View style={styles.container}>
      <SectionHeader title="Fees" />
      <View style={[styles.cards, { gap: spacing[3], marginBottom: spacing[4] }]}>
        <StatCard label="Fee heads" value={heads.length} variant="primary" />
        <StatCard label="Total collected" value={totalCollected} subtitle="This period" variant="success" />
      </View>
      <SectionHeader title="Recent payments" />
      <DataList<Payment>
        data={payments}
        loading={paymentsLoading}
        emptyTitle="No payments"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>Receipt #{item.receipt_no ?? item.id}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>Amount: {item.amount ?? '—'}</Text>
            <Button
              title="Download receipt"
              variant="outline"
              size="sm"
              onPress={() => handleDownloadReceipt(item)}
              style={{ marginTop: spacing[2] }}
            />
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
