import { AppCard, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { teacherService } from '@/services/teacher.service';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

export default function TeacherMarksEntryScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'exams', school_code, user_id],
    queryFn: async () => {
      const res = await teacherService.getExams({ school_code: school_code!, teacher_id: user_id! });
      return res.data;
    },
    enabled: Boolean(school_code && user_id),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Marks entry" />
      <DataList
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No exams"
        emptyMessage="Select an exam to enter marks (use Examinations module)."
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item: { id: string }) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }: { item: Record<string, unknown> }) => (
          <AppCard style={{ marginBottom: spacing[3], minHeight: 56 }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]}>{String(item.name ?? item.id)}</Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]}>{String(item.academic_year ?? '')}</Text>
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
