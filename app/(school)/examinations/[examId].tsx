import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { AppCard, SectionHeader, Button, EmptyState, LoadingSkeleton } from '@/components/ui';
import { examinationService } from '@/services/examination.service';

export default function ExamDetailScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data: examsData, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'examinations', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await examinationService.getExaminationsList(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const list = Array.isArray(examsData) ? examsData : [];
  const exam = list.find((e: { id: string }) => e.id === examId) as { id: string; name?: string; academic_year?: string; status?: string } | undefined;

  if (!school_code) return null;
  if (isLoading && !examsData) return <LoadingSkeleton />;
  if (isError) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="Failed to load" message={error?.message ?? 'Unknown error'} />
      </View>
    );
  }
  if (!exam) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="Exam not found" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title={exam.name ?? examId} />
      <AppCard style={{ marginBottom: spacing[3] }}>
        <Text style={[styles.label, { color: c.text.secondary }]}>Academic Year</Text>
        <Text style={[styles.value, { color: c.text.primary }]}>{exam.academic_year ?? '—'}</Text>
        <Text style={[styles.label, { color: c.text.secondary }]}>Status</Text>
        <Text style={[styles.value, { color: c.text.primary }]}>{exam.status ?? '—'}</Text>
      </AppCard>
      <Button
        title="Marks Entry"
        onPress={() => router.push({ pathname: '/school/examinations/marks-entry', params: { examId } } as never)}
        style={{ marginBottom: spacing[2] }}
      />
      <Button
        title="Marks Approval"
        variant="outline"
        onPress={() => router.push({ pathname: '/school/examinations/marks-approval', params: { examId } } as never)}
        style={{ marginBottom: spacing[2] }}
      />
      <Button
        title="Report Card"
        variant="outline"
        onPress={() => router.push({ pathname: '/school/examinations/report-card', params: { examId } } as never)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  label: { fontSize: 12, marginTop: 8 },
  value: { fontSize: 16, fontWeight: '600' },
});
