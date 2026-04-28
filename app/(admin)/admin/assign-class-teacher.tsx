import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast';
import { SectionHeader, SearchBar, Button } from '@/components/ui';
import { adminRoleAssignmentService, type AdminStaff, type ClassItem } from '@/services/admin-role-assignment.service';

export default function AdminAssignClassTeacherScreen() {
  const { colors: c, spacing } = useTheme();
  const schoolCode = useAuthStore((s) => s.school_code) ?? '';
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const classesQuery = useQuery({
    queryKey: ['admin', 'classes', schoolCode],
    queryFn: async () => {
      const res = await adminRoleAssignmentService.getClasses(schoolCode);
      const body = res.data as { data?: ClassItem[] } | ClassItem[];
      return Array.isArray(body) ? body : body?.data ?? [];
    },
    enabled: Boolean(schoolCode),
  });

  const staffQuery = useQuery({
    queryKey: ['admin', 'staff-teachers', schoolCode, search],
    queryFn: async () => {
      const res = await adminRoleAssignmentService.getStaff(schoolCode, search.trim() || undefined);
      const body = res.data as { data?: AdminStaff[] } | AdminStaff[];
      return Array.isArray(body) ? body : body?.data ?? [];
    },
    enabled: Boolean(schoolCode),
  });

  const teachers = useMemo(
    () =>
      (staffQuery.data ?? []).filter((s) =>
        `${s.designation ?? ''} ${s.department ?? ''}`.toLowerCase().includes('teach')
      ),
    [staffQuery.data]
  );

  const mutation = useMutation({
    mutationFn: () => adminRoleAssignmentService.assignClassTeacher(schoolCode, selectedClassId, selectedTeacherId),
    onSuccess: () => {
      showToast('Class teacher assigned', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes', schoolCode] });
    },
    onError: (err: Error) => showToast(err?.message ?? 'Assignment failed', 'error'),
  });

  return (
    <View style={styles.container}>
      <SectionHeader title="Assign Class Teacher" subtitle="Map class with responsible teacher" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: spacing[8] }}>
        <Text style={[styles.label, { color: c.text.secondary }]}>Select class</Text>
        <View style={styles.chipsWrap}>
          {(classesQuery.data ?? []).map((cls) => (
            <Pressable
              key={cls.id}
              onPress={() => setSelectedClassId(cls.id)}
              style={[styles.chip, { backgroundColor: selectedClassId === cls.id ? c.primary[600] : c.surface.subdued }]}
            >
              <Text style={{ color: selectedClassId === cls.id ? c.text.inverse : c.text.primary, fontSize: 13 }}>
                {cls.class_name ?? cls.class ?? 'Class'} {cls.section ? `- ${cls.section}` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.label, { color: c.text.secondary, marginTop: spacing[4] }]}>Select teacher</Text>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search teacher..." />
        <View style={styles.chipsWrap}>
          {teachers.map((staff) => (
            <Pressable
              key={staff.id}
              onPress={() => setSelectedTeacherId(staff.id)}
              style={[styles.chip, { backgroundColor: selectedTeacherId === staff.id ? c.primary[600] : c.surface.subdued }]}
            >
              <Text style={{ color: selectedTeacherId === staff.id ? c.text.inverse : c.text.primary, fontSize: 13 }}>
                {staff.full_name ?? staff.name ?? staff.staff_id ?? staff.id}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: spacing[4] }}>
          <Button
            title="Save Class Teacher Mapping"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!selectedClassId || !selectedTeacherId || mutation.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, marginBottom: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
});
