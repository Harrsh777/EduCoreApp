import { AppCard, Button, DataList, SectionHeader, StatCard } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/lib/toast';
import { feesService } from '@/services/fees.service';
import { studentService } from '@/services/student.service';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

export default function StudentFeesScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const student_id = user_id ?? '';
  const showToast = useToastStore((s) => s.show);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'fees', school_code, student_id],
    queryFn: async () => {
      const res = await studentService.getFees({ school_code: school_code!, student_id });
      return res.data;
    },
    enabled: Boolean(school_code && student_id),
  });

  const feeData = (data ?? {}) as Record<string, unknown>;
  const totalDue = Number(feeData.total_due ?? feeData.amount ?? 0);
  const receipts = Array.isArray(feeData.receipts) ? feeData.receipts : [];

  const handleDownloadReceipt = useCallback(
    async (item: Record<string, unknown>) => {
      const id = item.id as string | undefined;
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

  return (
    <View style={styles.container}>
      <SectionHeader title="Fees" />
      <View style={[styles.cards, { gap: spacing[3], marginBottom: spacing[4], paddingHorizontal: spacing[4] }]}>
        <StatCard label="Total due" value={totalDue} variant="warning" />
      </View>
      <SectionHeader title="Receipts" />
      <DataList
        data={receipts}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No receipts"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item: Record<string, unknown>, i: number) => String(item.id ?? item.receipt_no ?? i)}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }: { item: Record<string, unknown> }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>Receipt #{String(item.receipt_no ?? item.id ?? '')}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>Amount: {item.amount ?? '—'}</Text>
            <Button title="Download" variant="outline" size="sm" onPress={() => handleDownloadReceipt(item)} style={{ marginTop: 8 }} />
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cards: { flexDirection: 'row', flexWrap: 'wrap' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
