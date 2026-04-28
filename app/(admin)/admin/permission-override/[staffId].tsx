import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast';
import { SectionHeader, Button } from '@/components/ui';
import { rbacService } from '@/services/rbac.service';

type SubModule = { name?: string; view_access?: boolean; edit_access?: boolean };
type ModuleRow = { name?: string; sub_modules?: SubModule[] };

export default function AdminPermissionOverrideScreen() {
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const schoolCode = useAuthStore((s) => s.school_code) ?? '';
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const { colors: c, spacing } = useTheme();
  const [draft, setDraft] = useState<Record<string, { view: boolean; edit: boolean }>>({});

  const query = useQuery({
    queryKey: ['admin', 'permission-overrides', schoolCode, staffId],
    queryFn: async () => {
      const res = await rbacService.getStaffPermissionsByStaff(schoolCode, staffId);
      const raw = res.data as { data?: { modules?: ModuleRow[] } } | { modules?: ModuleRow[] };
      const modules = raw?.data?.modules ?? raw?.modules ?? [];
      const next: Record<string, { view: boolean; edit: boolean }> = {};
      modules.forEach((m) => {
        (m.sub_modules ?? []).forEach((sub) => {
          const key = `${m.name ?? 'module'}::${sub.name ?? 'sub'}`;
          next[key] = { view: Boolean(sub.view_access), edit: Boolean(sub.edit_access) };
        });
      });
      setDraft(next);
      return modules;
    },
    enabled: Boolean(schoolCode && staffId),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const permissions = Object.entries(draft).map(([key, v]) => {
        const [module_name, sub_module_name] = key.split('::');
        return {
          module_name,
          sub_module_name,
          view_access: v.view,
          edit_access: v.edit,
        };
      });
      return rbacService.updateStaffPermissions(schoolCode, staffId, { permissions });
    },
    onSuccess: () => {
      showToast('Permission overrides updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'permission-overrides', schoolCode, staffId] });
    },
    onError: (err: Error) => showToast(err?.message ?? 'Failed to update overrides', 'error'),
  });

  const entries = useMemo(() => Object.entries(draft), [draft]);

  return (
    <View style={styles.container}>
      <SectionHeader title="Permission Override" subtitle={`Staff ID: ${staffId}`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: spacing[8] }}>
        {entries.map(([key, val]) => {
          const [, subModule] = key.split('::');
          return (
            <View key={key} style={[styles.row, { borderColor: c.border.default, backgroundColor: c.surface.default }]}>
              <Text style={[styles.rowTitle, { color: c.text.primary }]}>{subModule}</Text>
              <View style={styles.toggleWrap}>
                <Pressable
                  style={[styles.toggle, { backgroundColor: val.view ? c.primary[600] : c.surface.subdued }]}
                  onPress={() => setDraft((prev) => ({ ...prev, [key]: { ...prev[key], view: !prev[key].view } }))}
                >
                  <Text style={{ color: val.view ? c.text.inverse : c.text.primary }}>View</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggle, { backgroundColor: val.edit ? c.primary[600] : c.surface.subdued }]}
                  onPress={() => setDraft((prev) => ({ ...prev, [key]: { ...prev[key], edit: !prev[key].edit } }))}
                >
                  <Text style={{ color: val.edit ? c.text.inverse : c.text.primary }}>Edit</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        {!query.isLoading && entries.length === 0 && (
          <Text style={{ color: c.text.secondary }}>No permissions available for override.</Text>
        )}
        <View style={{ marginTop: spacing[4] }}>
          <Button
            title="Save Overrides"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!entries.length || mutation.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  rowTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  toggleWrap: { flexDirection: 'row', gap: 8 },
  toggle: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
});
