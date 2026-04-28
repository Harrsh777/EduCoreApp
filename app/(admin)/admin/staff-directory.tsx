import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/lib/auth-store';
import { DataList, AppCard, SearchBar, SectionHeader } from '@/components/ui';
import { adminRoleAssignmentService, type AdminStaff } from '@/services/admin-role-assignment.service';

export default function AdminStaffDirectoryScreen() {
  const router = useRouter();
  const { colors: c, spacing } = useTheme();
  const schoolCode = useAuthStore((s) => s.school_code) ?? '';
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ['admin', 'staff-directory', schoolCode, search],
    queryFn: async () => {
      const res = await adminRoleAssignmentService.getStaff(schoolCode, search.trim() || undefined);
      const body = res.data as { data?: AdminStaff[] } | AdminStaff[];
      return Array.isArray(body) ? body : body?.data ?? [];
    },
    enabled: Boolean(schoolCode),
  });

  const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  return (
    <View style={styles.container}>
      <SectionHeader title="Staff Directory (Admin)" subtitle="Assign roles, class teacher and overrides" />
      <View style={{ paddingHorizontal: spacing[4] }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, employee id, department..."
        />
      </View>
      <DataList<AdminStaff>
        data={list}
        loading={isLoading}
        error={isError ? (error as Error)?.message ?? 'Failed to load staff' : null}
        emptyTitle="No staff found"
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: spacing[8] }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: spacing[3] }}>
            <Text style={[styles.name, { color: c.text.primary }]}>{item.full_name ?? item.name ?? item.staff_id ?? 'Staff'}</Text>
            <Text style={[styles.meta, { color: c.text.secondary }]}>
              {(item.staff_id ? `ID: ${item.staff_id}` : 'No employee id')}
              {item.department ? ` • ${item.department}` : ''}
              {item.designation ? ` • ${item.designation}` : ''}
            </Text>
            <View style={[styles.actions, { marginTop: spacing[3] }]}>
              <Pressable style={[styles.cta, { backgroundColor: c.primary[600] }]} onPress={() => router.push(`/admin/assign-role/${item.id}`)}>
                <Text style={[styles.ctaText, { color: c.text.inverse }]}>Assign Role</Text>
              </Pressable>
              <Pressable style={[styles.cta, { backgroundColor: c.surface.subdued }]} onPress={() => router.push(`/admin/permission-override/${item.id}`)}>
                <Text style={[styles.ctaText, { color: c.text.primary }]}>Overrides</Text>
              </Pressable>
            </View>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  cta: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  ctaText: { fontSize: 13, fontWeight: '600' },
});
