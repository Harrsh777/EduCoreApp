/**
 * Admin Role Management: list roles, CRUD, permission matrix per role.
 * APIs: GET/POST/PATCH/DELETE /api/roles, GET/PATCH /api/roles/[id]/permissions.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { rolesService } from '@/services/roles.service';
import { useToastStore } from '@/lib/toast';
import { Button, SectionHeader, EmptyState } from '@/components/ui';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

type Role = { id: string; name?: string; description?: string; [k: string]: unknown };
type Permission = { id: string; name?: string; category?: string; key?: string; [k: string]: unknown };

export default function RolesScreen() {
  const router = useRouter();
  const { schoolCode, path } = useSchoolCode();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [permsModal, setPermsModal] = useState<Role | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: rolesRes, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['roles', schoolCode],
    queryFn: () => rolesService.getRoles(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const rolesList = Array.isArray(rolesRes) ? rolesRes : (rolesRes as { data?: Role[] })?.data ?? (rolesRes as { roles?: Role[] })?.roles ?? [];
  const roles = (Array.isArray(rolesList) ? rolesList : []) as Role[];

  const createMutation = useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      rolesService.createRole(schoolCode, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', schoolCode] });
      showToast('Role created', 'success');
      setAddModal(false);
      setNewName('');
      setNewDesc('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Create failed', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      rolesService.updateRole(schoolCode, id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', schoolCode] });
      showToast('Role updated', 'success');
      setEditingRole(null);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Update failed', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesService.deleteRole(schoolCode, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', schoolCode] });
      showToast('Role deleted', 'success');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Delete failed', 'error');
    },
  });

  const handleCreate = useCallback(() => {
    if (!newName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    createMutation.mutate({ name: newName.trim(), description: newDesc.trim() || undefined });
  }, [newName, newDesc, createMutation, showToast]);

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Role Management</Text>
        <Pressable style={styles.headerBtn} onPress={() => setAddModal(true)}>
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
      {isLoading && !roles.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load roles'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : roles.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState title="No roles" message="Add a role to get started." />
          <Button title="Add role" onPress={() => setAddModal(true)} style={styles.mt4} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <SectionHeader title="Roles" />
          {roles.map((role) => (
            <View key={role.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.roleName}>{role.name ?? role.id}</Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => setPermsModal(role)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Permissions</Text>
                  </Pressable>
                  <Pressable onPress={() => { setEditingRole(role); }} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Alert.alert('Delete role', 'Delete this role?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(role.id) },
                      ]);
                    }}
                    style={[styles.actionBtn, styles.dangerBtn]}
                  >
                    <Text style={styles.dangerText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              {role.description ? (
                <Text style={styles.roleDesc}>{role.description}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add role modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setAddModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <SectionHeader title="Add role" />
              <FloatingLabelInput label="Name" value={newName} onChangeText={setNewName} />
              <FloatingLabelInput label="Description" value={newDesc} onChangeText={setNewDesc} />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setAddModal(false)} />
                <Button title="Create" onPress={handleCreate} loading={createMutation.isPending} />
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit role modal */}
      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSave={(body) => updateMutation.mutate({ id: editingRole.id, body })}
          loading={updateMutation.isPending}
        />
      )}

      {/* Permissions modal */}
      {permsModal && (
        <PermissionsModal
          schoolCode={schoolCode}
          role={permsModal}
          onClose={() => setPermsModal(null)}
        />
      )}
    </View>
  );
}

function EditRoleModal({
  role,
  onClose,
  onSave,
  loading,
}: {
  role: Role;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(role.name ?? '');
  const [description, setDescription] = useState(role.description ?? '');
  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <SectionHeader title="Edit role" />
          <FloatingLabelInput label="Name" value={name} onChangeText={setName} />
          <FloatingLabelInput label="Description" value={description} onChangeText={setDescription} />
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="outline" onPress={onClose} />
            <Button title="Save" onPress={() => onSave({ name, description })} loading={loading} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PermissionsModal({
  schoolCode,
  role,
  onClose,
}: {
  schoolCode: string;
  role: Role;
  onClose: () => void;
}) {
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const { data: permsRes, isLoading } = useQuery({
    queryKey: ['roles', role.id, 'permissions', schoolCode],
    queryFn: () => rolesService.getRolePermissions(schoolCode, role.id).then((r) => r.data),
    enabled: Boolean(role.id && schoolCode),
  });

  const permsData = permsRes as { permissions?: Permission[]; data?: Permission[] } | undefined;
  const permissions = (permsData?.permissions ?? permsData?.data ?? []) as Permission[];
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!permissions.length) return;
    const next: Record<string, boolean> = {};
    permissions.forEach((p) => {
      const key = (p.key ?? p.id) as string;
      next[key] = (p as { enabled?: boolean }).enabled ?? false;
    });
    setSelected((prev) => (Object.keys(prev).length ? prev : next));
  }, [permissions.length]);

  const updatePermsMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      rolesService.updateRolePermissions(schoolCode, role.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', role.id, 'permissions', schoolCode] });
      showToast('Permissions saved', 'success');
      onClose();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Save failed', 'error');
    },
  });

  const toggle = (permId: string, key?: string) => {
    const k = key ?? permId;
    setSelected((s) => ({ ...s, [k]: !s[k] }));
  };

  const handleSave = () => {
    updatePermsMutation.mutate({ permissions: selected });
  };

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalCard, styles.permsModal]}>
          <SectionHeader title={`Permissions: ${role.name ?? role.id}`} />
          {isLoading ? (
            <ActivityIndicator size="small" color={INDIGO} style={styles.mt4} />
          ) : (
            <FlatList
              data={permissions}
              keyExtractor={(item) => item.id ?? String(item.key ?? Math.random())}
              renderItem={({ item }) => {
                const key = (item.key ?? item.id) as string;
                const checked = selected[key] ?? (item as { enabled?: boolean }).enabled ?? false;
                return (
                  <View style={styles.permRow}>
                    <Text style={styles.permName}>{item.name ?? item.key ?? item.id}</Text>
                    <Switch
                      value={checked}
                      onValueChange={() => toggle(item.id, key)}
                      trackColor={{ false: '#E5E7EB', true: INDIGO }}
                      thumbColor="#fff"
                    />
                  </View>
                );
              }}
              style={styles.permList}
            />
          )}
          <View style={styles.modalActions}>
            <Button title="Close" variant="outline" onPress={onClose} />
            <Button title="Save" onPress={handleSave} loading={updatePermsMutation.isPending} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2] },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  headerBtn: { padding: spacing[2] },
  addText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[12] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  errorText: { ...textStyles.bodySm, color: '#B91C1C', marginBottom: spacing[4] },
  retryBtn: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  retryText: { ...textStyles.button, color: INDIGO },
  mt4: { marginTop: spacing[4] },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  roleName: { ...textStyles.h4, color: '#111827' },
  roleDesc: { ...textStyles.bodySm, color: '#6B7280', marginTop: spacing[2] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[2] },
  actionBtn: { paddingVertical: spacing[1], paddingHorizontal: spacing[2] },
  actionText: { fontSize: 14, color: INDIGO, fontWeight: '500' },
  dangerBtn: {},
  dangerText: { fontSize: 14, color: '#B91C1C', fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing[6],
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing[6],
  },
  modalActions: { flexDirection: 'row', gap: spacing[4], marginTop: spacing[6], justifyContent: 'flex-end' },
  permsModal: { maxHeight: '80%' },
  permList: { maxHeight: 320, marginVertical: spacing[4] },
  permRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  permName: { ...textStyles.body, color: '#111827', flex: 1 },
});
