import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/lib/auth-store';
import { useToastStore } from '@/lib/toast';
import { SectionHeader, Button } from '@/components/ui';
import { adminRoleAssignmentService, type AdminStaff, type ClassItem } from '@/services/admin-role-assignment.service';

type SubjectRow = { id?: string; subject_id?: string; subject_name?: string; period?: string | number; day?: string };

export default function AdminAssignSubjectTeacherScreen() {
  const { colors: c, spacing } = useTheme();
  const schoolCode = useAuthStore((s) => s.school_code) ?? '';
  const showToast = useToastStore((s) => s.show);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [period, setPeriod] = useState<string>('1');

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
    queryKey: ['admin', 'staff', schoolCode],
    queryFn: async () => {
      const res = await adminRoleAssignmentService.getStaff(schoolCode);
      const body = res.data as { data?: AdminStaff[] } | AdminStaff[];
      return Array.isArray(body) ? body : body?.data ?? [];
    },
    enabled: Boolean(schoolCode),
  });

  const subjectsQuery = useQuery({
    queryKey: ['admin', 'class-subjects', schoolCode, classId],
    queryFn: async () => {
      const res = await adminRoleAssignmentService.getClassSubjects(schoolCode, classId);
      const body = res.data as { data?: SubjectRow[] } | SubjectRow[];
      return Array.isArray(body) ? body : body?.data ?? [];
    },
    enabled: Boolean(schoolCode && classId),
  });

  const teachers = useMemo(() => staffQuery.data ?? [], [staffQuery.data]);
  const periods = useMemo(() => ['1', '2', '3', '4', '5', '6', '7', '8'], []);

  const mutation = useMutation({
    mutationFn: () =>
      adminRoleAssignmentService.assignSubjectTeacher(schoolCode, classId, {
        subject_id: subjectId,
        teacher_id: teacherId,
        period,
      }),
    onSuccess: () => showToast('Subject teacher updated', 'success'),
    onError: (err: Error) => showToast(err?.message ?? 'Update failed', 'error'),
  });

  return (
    <View style={styles.container}>
      <SectionHeader title="Assign Subject Teacher" subtitle="Class x subject x period mapping" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: spacing[8] }}>
        <Text style={[styles.label, { color: c.text.secondary }]}>Class</Text>
        <View style={styles.wrap}>
          {(classesQuery.data ?? []).map((cls) => (
            <Pressable key={cls.id} onPress={() => setClassId(cls.id)} style={[styles.chip, { backgroundColor: classId === cls.id ? c.primary[600] : c.surface.subdued }]}>
              <Text style={{ color: classId === cls.id ? c.text.inverse : c.text.primary }}>{cls.class_name ?? cls.class ?? 'Class'} {cls.section ?? ''}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: c.text.secondary, marginTop: spacing[3] }]}>Subject</Text>
        <View style={styles.wrap}>
          {(subjectsQuery.data ?? []).map((s) => {
            const id = String(s.subject_id ?? s.id ?? '');
            return (
              <Pressable key={id} onPress={() => setSubjectId(id)} style={[styles.chip, { backgroundColor: subjectId === id ? c.primary[600] : c.surface.subdued }]}>
                <Text style={{ color: subjectId === id ? c.text.inverse : c.text.primary }}>{s.subject_name ?? id}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: c.text.secondary, marginTop: spacing[3] }]}>Teacher</Text>
        <View style={styles.wrap}>
          {teachers.map((t) => (
            <Pressable key={t.id} onPress={() => setTeacherId(t.id)} style={[styles.chip, { backgroundColor: teacherId === t.id ? c.primary[600] : c.surface.subdued }]}>
              <Text style={{ color: teacherId === t.id ? c.text.inverse : c.text.primary }}>{t.full_name ?? t.name ?? t.staff_id ?? t.id}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: c.text.secondary, marginTop: spacing[3] }]}>Period</Text>
        <View style={styles.wrap}>
          {periods.map((p) => (
            <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.chip, { backgroundColor: period === p ? c.primary[600] : c.surface.subdued }]}>
              <Text style={{ color: period === p ? c.text.inverse : c.text.primary }}>Period {p}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: spacing[4] }}>
          <Button
            title="Save Subject Mapping"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!classId || !subjectId || !teacherId || mutation.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
});
