import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/lib/auth-store';
import { Button, SectionHeader } from '@/components/ui';
import { useToastStore } from '@/lib/toast';
import { adminRoleAssignmentService, type RoleOption } from '@/services/admin-role-assignment.service';

export default function AdminAssignRoleScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const schoolCode = useAuthStore((s) => s.school_code) ?? '';
  const { colors: c, spacing } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', schoolCode],
    queryFn: async () => {
      const res = await adminRoleAssignmentService.getRoles(schoolCode);
      const body = res.data as { data?: RoleOption[] } | RoleOption[];
      return Array.isArray(body) ? body : body?.data ?? [];
    },
    enabled: Boolean(schoolCode),
  });

  useQuery({
    queryKey: ['admin', 'staff-roles', schoolCode, staffId],
    queryFn: async () => {
      const res = await adminRoleAssignmentService.getStaffRoles(schoolCode, staffId);
      const body = res.data as { data?: Array<{ role_id?: string; id?: string }> } | Array<{ role_id?: string; id?: string }>;
      const rows = Array.isArray(body) ? body : body?.data ?? [];
      const ids = rows.map((r) => String(r.role_id ?? r.id ?? '')).filter(Boolean);
      setSelectedIds(ids);
      return rows;
    },
    enabled: Boolean(schoolCode && staffId),
  });

  const saveMutation = useMutation({
    mutationFn: () => adminRoleAssignmentService.saveStaffRoles(schoolCode, staffId, selectedIds),
    onSuccess: () => {
      showToast('Roles updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff-roles', schoolCode, staffId] });
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed to update roles', 'error'),
  });

  const options = useMemo(
    () =>
      (rolesQuery.data ?? []).map((r) => ({
        id: r.id,
        label: r.name ?? r.label ?? r.id,
      })),
    [rolesQuery.data]
  );

  const toggleRole = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <View style={styles.container}>
      <SectionHeader title="Assign Role" subtitle={`Staff ID: ${staffId}`} />
      <View style={{ paddingHorizontal: spacing[4] }}>
        <Text style={[styles.helper, { color: c.text.secondary }]}>Select one or more roles and save changes.</Text>
        <View style={styles.wrap}>
          {options.map((opt) => {
            const selected = selectedIds.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                onPress={() => toggleRole(opt.id)}
                style={[styles.chip, { backgroundColor: selected ? c.primary[600] : c.surface.subdued }]}
              >
                <Text style={{ color: selected ? c.text.inverse : c.text.primary, fontSize: 13 }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.selectedWrap}>
          <Text style={[styles.helper, { color: c.text.secondary }]}>
            Selected: {selectedIds.length ? selectedIds.join(', ') : 'None'}
          </Text>
        </View>
        <Button
          title="Save Roles"
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={!staffId || !selectedIds.length || saveMutation.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  helper: { fontSize: 13, marginBottom: 10 },
  selectedWrap: { marginVertical: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
});
