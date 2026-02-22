import { View, ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { SectionHeader, EmptyState, LoadingSkeleton, StatCard } from '@/components/ui';
import { adminService } from '@/services/admin.service';

export default function AdminAnalyticsScreen() {
  const { spacing, colors: c } = useTheme();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const res = await adminService.getAdminAnalytics();
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

  const analytics = (data ?? {}) as Record<string, unknown>;
  const entries = Object.entries(analytics).filter(([, v]) => typeof v === 'number' || typeof v === 'string');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { padding: spacing[4], paddingBottom: spacing[8] }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title="Analytics" />
      {entries.length === 0 ? (
        <EmptyState title="No analytics data" message="Data will appear here when available." />
      ) : (
        <View style={[styles.grid, { gap: spacing[4] }]}>
          {entries.map(([key, value]) => (
            <StatCard
              key={key}
              label={key.replace(/_/g, ' ')}
              value={String(value)}
              variant="neutral"
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  grid: {},
});
