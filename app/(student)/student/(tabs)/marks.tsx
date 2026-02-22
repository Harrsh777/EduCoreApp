import { AppCard, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { studentService } from '@/services/student.service';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

export default function StudentMarksScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const student_id = user_id ?? '';

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'marks', school_code, student_id],
    queryFn: async () => {
      const res = await studentService.getMarks({ school_code: school_code!, student_id });
      return res.data;
    },
    enabled: Boolean(school_code && student_id),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="My marks" />
      <DataList
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No marks"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item: Record<string, unknown>, i: number) => String(item.exam_id ?? i)}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }: { item: Record<string, unknown> }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>{String(item.subject ?? item.exam_name ?? '—')}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>Marks: {item.marks ?? '—'} · Grade: {item.grade ?? '—'}</Text>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
});
