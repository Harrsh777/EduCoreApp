import { AppCard, EmptyState, LoadingSkeleton, SectionHeader } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { useToastStore } from '@/lib/toast';
import { teacherService } from '@/services/teacher.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TeacherAttendanceScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code, user_id } = useSession();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes', school_code, user_id],
    queryFn: async () => {
      const res = await teacherService.getClasses({ school_code: school_code!, teacher_id: user_id! });
      return res.data;
    },
    enabled: Boolean(school_code && user_id),
  });

  const classes = Array.isArray(classesData) ? classesData : [];
  const classId = selectedClassId ?? classes[0]?.id;

  const { data: attendanceData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'attendance', school_code, classId, selectedDate],
    queryFn: async () => {
      const res = await teacherService.getClassAttendance({ school_code: school_code!, class_id: classId!, date: selectedDate });
      return res.data;
    },
    enabled: Boolean(school_code && classId),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { class_id: string; date: string; attendance: Array<{ student_id: string; status: string }> }) =>
      teacherService.updateAttendance({ school_code: school_code!, ...body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'attendance'] });
      showToast('Attendance saved', 'success');
    },
  });

  const attendance = (attendanceData as { students?: Array<{ student_id: string; name?: string; status?: string }> })?.students ?? [];

  if (!school_code || !user_id) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title="Mark attendance" />
      <View style={[styles.chips, { gap: spacing[2], marginBottom: spacing[4] }]}>
        {classes.map((cls: { id: string; class?: string; section?: string }) => (
          <Pressable
            key={cls.id}
            onPress={() => setSelectedClassId(cls.id)}
            style={[
              styles.chip,
              {
                backgroundColor: classId === cls.id ? c.primary[600] : c.surface.subdued,
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[4],
                borderRadius: 12,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: classId === cls.id ? c.text.inverse : c.text.primary }]}>
              {cls.class ?? ''}-{cls.section ?? ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.label, { color: c.text.secondary, marginBottom: spacing[2] }]}>Date: {selectedDate}</Text>
      {isLoading && !attendanceData ? (
        <LoadingSkeleton rows={5} />
      ) : attendance.length === 0 ? (
        <EmptyState title="No students" message="Select a class." />
      ) : (
        attendance.map((row: { student_id: string; name?: string; status?: string }) => (
          <AppCard key={row.student_id} style={{ marginBottom: spacing[2] }}>
            <View style={styles.row}>
              <Text style={[styles.name, { color: c.text.primary }]}>{row.name ?? row.student_id}</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    updateMutation.mutate({
                      class_id: classId!,
                      date: selectedDate,
                      attendance: [{ student_id: row.student_id, status: 'present' }],
                    })
                  }
                  style={[styles.btn, { backgroundColor: c.success.light }]}
                >
                  <Text style={[styles.btnText, { color: c.success.dark }]}>P</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    updateMutation.mutate({
                      class_id: classId!,
                      date: selectedDate,
                      attendance: [{ student_id: row.student_id, status: 'absent' }],
                    })
                  }
                  style={[styles.btn, { backgroundColor: c.error.light }]}
                >
                  <Text style={[styles.btnText, { color: c.error.dark }]}>A</Text>
                </Pressable>
              </View>
            </View>
          </AppCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
  chipText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 18, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { fontSize: 16, fontWeight: '700' },
});
