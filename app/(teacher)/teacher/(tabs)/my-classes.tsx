import { AppCard, DataList, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { teacherService } from '@/services/teacher.service';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

export default function TeacherMyClassesScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const teacher_id = user_id ?? '';

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'classes', school_code, teacher_id],
    queryFn: async () => {
      const res = await teacherService.getClasses({ school_code: school_code!, teacher_id });
      return res.data;
    },
    enabled: Boolean(school_code && teacher_id),
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="My Classes" />
      <DataList
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No classes assigned"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item: { id: string }) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }: { item: Record<string, unknown> }) => (
          <AppCard style={{ marginBottom: spacing[3], minHeight: 56 }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>
              {String(item.class ?? '')}-{String(item.section ?? '')} {String(item.academic_year ?? '')}
            </Text>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
});
