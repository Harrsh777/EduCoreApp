import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { DataList, AppCard, SectionHeader } from '@/components/ui';
import { adminService, type AdminUser } from '@/services/admin.service';

export default function AdminUsersScreen() {
  const { spacing, colors: c } = useTheme();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await adminService.getAdminUsers();
      return res.data;
    },
  });

  const list = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <SectionHeader title="Users" />
      <DataList<AdminUser>
        data={list}
        loading={isLoading}
        error={isError ? (error?.message ?? 'Failed to load') : null}
        emptyTitle="No users"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>
              {(item as { name?: string }).name ?? item.id}
            </Text>
            <Text style={[styles.cardSubtitle, { color: c.text.secondary }]} numberOfLines={1}>
              ID: {item.id}
            </Text>
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
});
