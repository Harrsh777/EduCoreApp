import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { StatCard, SectionHeader, LoadingSkeleton, EmptyState } from '@/components/ui';
import { schoolService } from '@/services/school.service';

export default function SchoolDashboardHomeScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'dashboard', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await schoolService.getDashboardStats(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  if (!school_code) return null;
  if (isLoading && !data) return <LoadingSkeleton />;
  if (isError) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="Failed to load" message={error?.message ?? 'Unknown error'} />
      </View>
    );
  }

  const stats = (data ?? {}) as Record<string, number>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { padding: spacing[4], paddingBottom: spacing[8] }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title="Dashboard" />
      <View style={[styles.grid, { gap: spacing[4] }]}>
        <StatCard label="Students" value={stats.students ?? 0} variant="primary" />
        <StatCard label="Staff" value={stats.staff ?? 0} variant="success" />
        <StatCard label="Classes" value={stats.classes ?? 0} variant="neutral" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  grid: {},
});
