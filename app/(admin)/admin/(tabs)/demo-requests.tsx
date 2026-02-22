import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { DataList, AppCard, SectionHeader } from '@/components/ui';
import { adminService, type DemoRequest } from '@/services/admin.service';

export default function AdminDemoRequestsScreen() {
  const { spacing, colors: c } = useTheme();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'demo-requests'],
    queryFn: async () => {
      const res = await adminService.getAdminDemoRequests();
      return res.data;
    },
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Demo Requests" />
      <DataList<DemoRequest>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No demo requests"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>
              {item.name ?? '—'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>
              {item.email ?? '—'}
            </Text>
            {item.phone ? (
              <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>
                {item.phone}
              </Text>
            ) : null}
            {item.preferred_slot ? (
              <Text style={[styles.slot, { color: c.text.tertiary }]} numberOfLines={1}>
                Slot: {item.preferred_slot}
              </Text>
            ) : null}
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  slot: { fontSize: 12, marginTop: 4 },
});
