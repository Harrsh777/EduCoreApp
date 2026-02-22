import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { SectionHeader, AppCard, EmptyState, LoadingSkeleton } from '@/components/ui';
import { examinationService } from '@/services/examination.service';

export default function ReportCardScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data: marksData, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'examination-marks', school_code, examId],
    queryFn: async () => {
      if (!school_code || !examId) throw new Error('Missing params');
      const res = await examinationService.getExaminationMarks(school_code, { exam_id: examId! });
      return res.data;
    },
    enabled: Boolean(school_code && examId),
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

  const data = (marksData ?? {}) as { summary?: Array<{ student_name?: string; total?: number; grade?: string }> };
  const summary = data.summary ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title="Report Card" />
      <Text style={[styles.examLabel, { color: c.text.secondary }]}>Exam: {examId}</Text>
      {summary.length === 0 ? (
        <EmptyState title="No report data" message="Marks may not be approved yet." />
      ) : (
        summary.map((row: { student_name?: string; total?: number; grade?: string }, i: number) => (
          <AppCard key={i} style={{ marginBottom: spacing[2] }}>
            <Text style={[styles.name, { color: c.text.primary }]}>{row.student_name ?? '—'}</Text>
            <View style={styles.row}>
              <Text style={[styles.meta, { color: c.text.secondary }]}>Total: {row.total ?? '—'}</Text>
              <Text style={[styles.meta, { color: c.text.secondary }]}>Grade: {row.grade ?? '—'}</Text>
            </View>
          </AppCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  examLabel: { fontSize: 14, marginBottom: 16 },
  name: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', marginTop: 4, gap: 16 },
  meta: { fontSize: 14 },
});
