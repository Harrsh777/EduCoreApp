import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { StatCard, SectionHeader, EmptyState, LoadingSkeleton } from '@/components/ui';
import { adminService } from '@/services/admin.service';

export default function AdminOverviewScreen() {
  const { spacing, colors: c } = useTheme();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const res = await adminService.getAdminOverview();
      return res.data;
    },
  });

  if (isLoading && !data) return <LoadingSkeleton />;
  if (isError) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="Failed to load" message={error?.message ?? 'Unknown error'} />
      </View>
    );
  }

  const stats = data ?? {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { padding: spacing[4], paddingBottom: spacing[8] }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={c.primary[600]}
        />
      }
    >
      <SectionHeader title="Overview" />
      <View style={[styles.grid, { gap: spacing[4] }]}>
        <StatCard label="Schools" value={stats.schools ?? 0} variant="primary" />
        <StatCard label="Students" value={stats.students ?? 0} variant="success" />
        <StatCard label="Staff" value={stats.staff ?? 0} variant="neutral" />
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
