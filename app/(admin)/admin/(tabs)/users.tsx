import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { DataList, AppCard, SectionHeader } from '@/components/ui';
import { adminService, type AdminUser } from '@/services/admin.service';

export default function AdminUsersScreen() {
  const { spacing, colors: c } = useTheme();
  const router = useRouter();

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
      <View style={[styles.quickActions, { paddingHorizontal: spacing[4], marginBottom: spacing[2] }]}>
        <Pressable style={[styles.actionBtn, { backgroundColor: c.primary[600] }]} onPress={() => router.push('/admin/staff-directory')}>
          <Text style={[styles.actionText, { color: c.text.inverse }]}>Staff Directory</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, { backgroundColor: c.surface.subdued }]} onPress={() => router.push('/admin/assign-class-teacher')}>
          <Text style={[styles.actionText, { color: c.text.primary }]}>Class Teacher</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, { backgroundColor: c.surface.subdued }]} onPress={() => router.push('/admin/assign-subject-teacher')}>
          <Text style={[styles.actionText, { color: c.text.primary }]}>Subject Teacher</Text>
        </Pressable>
      </View>
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
  quickActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  actionText: { fontSize: 12, fontWeight: '600' },
});
