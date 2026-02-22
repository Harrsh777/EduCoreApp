import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useSchool } from '@/hooks/useSchool';
import { SectionHeader, AppCard, EmptyState, LoadingSkeleton, StatusBadge } from '@/components/ui';
import { schoolService } from '@/services/school.service';

type ClassItem = { id: string; class?: string; section?: string; [key: string]: unknown };

export default function SchoolAttendanceScreen() {
  const { spacing, colors: c } = useTheme();
  const { school_code } = useSchool();
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: classesData } = useQuery({
    queryKey: ['school', 'classes', school_code],
    queryFn: async () => {
      if (!school_code) throw new Error('No school');
      const res = await schoolService.getClasses(school_code);
      return res.data;
    },
    enabled: Boolean(school_code),
  });

  const classes = Array.isArray(classesData) ? classesData : [];
  const classId = selectedClassId ?? classes[0]?.id;

  const { data: attendanceData, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['school', 'attendance', school_code, classId, selectedDate],
    queryFn: async () => {
      if (!school_code || !classId) throw new Error('No school or class');
      const res = await schoolService.getAttendanceClass(school_code, { class_id: classId, date: selectedDate });
      return res.data;
    },
    enabled: Boolean(school_code && classId),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { class_id: string; date: string; attendance: Array<{ student_id: string; status: string }> }) =>
      schoolService.updateAttendance({ school_code: school_code!, ...body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'attendance'] });
    },
  });

  const attendance = (attendanceData as { students?: Array<{ student_id: string; name?: string; status?: string }> })?.students ?? [];

  if (!school_code) return null;
  if (classes.length === 0 && !isLoading) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="No classes" message="Add classes first." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={c.primary[600]} />
      }
    >
      <SectionHeader title="Attendance" />
      <View style={[styles.row, { marginBottom: spacing[3], gap: spacing[2] }]}>
        {classes.slice(0, 5).map((cls: ClassItem) => (
          <Pressable
            key={cls.id}
            onPress={() => setSelectedClassId(cls.id)}
            style={[
              styles.chip,
              {
                backgroundColor: classId === cls.id ? c.primary[600] : c.surface.subdued,
                borderRadius: 8,
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
              },
            ]}
          >
            <Text style={[styles.chipText, { color: classId === cls.id ? c.text.inverse : c.text.primary }]}>
              {cls.class ?? ''}{cls.section ? `-${cls.section}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.label, { color: c.text.secondary }]}>Date: {selectedDate}</Text>
      {isLoading && !attendanceData ? (
        <LoadingSkeleton rows={3} />
      ) : isError ? (
        <EmptyState title="Failed to load" message={error?.message ?? 'Unknown error'} />
      ) : (
        <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
          {attendance.map((row: { student_id: string; name?: string; status?: string }) => (
            <AppCard key={row.student_id} style={{ marginBottom: spacing[2] }}>
              <View style={styles.cardRow}>
                <Text style={[styles.cardTitle, { color: c.text.primary }]} numberOfLines={1}>{row.name ?? row.student_id}</Text>
                <StatusBadge label={row.status ?? '—'} variant={row.status === 'present' ? 'approved' : row.status === 'absent' ? 'rejected' : 'pending'} />
              </View>
            </AppCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
  chipText: { fontSize: 14, fontWeight: '500' },
  label: { fontSize: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, flex: 1 },
});
