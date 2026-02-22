import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { SectionHeader, AppCard, Button, EmptyState, LoadingSkeleton } from '@/components/ui';
import { examinationService } from '@/services/examination.service';
import { useToastStore } from '@/lib/toast';

export default function MarksApprovalScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { data: marksData, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'examination-marks', school_code, examId],
    queryFn: async () => {
      if (!school_code || !examId) throw new Error('Missing params');
      const res = await examinationService.getExaminationMarks(school_code, { exam_id: examId! });
      return res.data;
    },
    enabled: Boolean(school_code && examId),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!school_code || !examId) throw new Error('Missing params');
      return examinationService.approveMarks(school_code, { exam_id: examId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'examination-marks'] });
      showToast('Marks approved', 'success');
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed to approve', 'error'),
  });

  if (!school_code || !examId) return null;
  if (isLoading && !marksData) return <LoadingSkeleton />;
  if (isError) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="Failed to load" message={error?.message ?? 'Unknown error'} />
      </View>
    );
  }

  const summary = (marksData ?? {}) as Record<string, unknown>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title="Marks Approval" />
      <AppCard style={{ marginBottom: spacing[4] }}>
        <Text style={[styles.label, { color: c.text.secondary }]}>Exam ID: {examId}</Text>
        <Text style={[styles.hint, { color: c.text.tertiary }]}>Review and approve marks for this exam.</Text>
        <Button
          title="Approve marks"
          onPress={() => approveMutation.mutate()}
          loading={approveMutation.isPending}
          style={{ marginTop: spacing[4] }}
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  label: { fontSize: 14 },
  hint: { fontSize: 12, marginTop: 4 },
});
