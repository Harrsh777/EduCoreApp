/**
 * Timetable: class/teacher selector, grid. GET slots, period-groups, staff, classes.
 * Visible if view_timetable or manage_timetable. Same APIs/tables as admin.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { timetableService } from '@/services/timetable.service';
import { schoolService } from '@/services/school.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

export default function TeacherTimetableScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const [mode, setMode] = useState<'class' | 'teacher'>('class');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState(teacher?.id ?? '');

  const { data: classesData } = useQuery({
    queryKey: ['classes', schoolCode],
    queryFn: () => schoolService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: staffData } = useQuery({
    queryKey: ['staff', schoolCode],
    queryFn: () => schoolService.getStaff(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['timetable', 'slots', schoolCode, mode, classId, teacherId],
    queryFn: () => timetableService.getTimetableSlots(schoolCode, mode === 'class' ? { class_id: classId } : { teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && (mode === 'class' ? classId : teacherId)),
  });

  const classesList = (Array.isArray(classesData) ? classesData : (classesData as { data?: { id: string; name?: string }[] })?.data ?? []) as { id: string; name?: string }[];
  const staffList = (Array.isArray(staffData) ? staffData : (staffData as { data?: { id: string; name?: string; staff_id?: string }[] })?.data ?? []) as { id: string; name?: string; staff_id?: string }[];
  const slots = (slotsData as { slots?: unknown[]; data?: unknown[] })?.slots ?? (slotsData as { data?: unknown[] })?.data ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Timetable</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>View by</Text>
        <View style={styles.tabs}>
          <Pressable style={[styles.tab, mode === 'class' && { backgroundColor: G }]} onPress={() => setMode('class')}>
            <Text style={[styles.tabText, mode === 'class' && { color: '#fff' }]}>Class</Text>
          </Pressable>
          <Pressable style={[styles.tab, mode === 'teacher' && { backgroundColor: G }]} onPress={() => setMode('teacher')}>
            <Text style={[styles.tabText, mode === 'teacher' && { color: '#fff' }]}>Teacher</Text>
          </Pressable>
        </View>
        {mode === 'class' && (
          <>
            <Text style={styles.label}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {classesList.map((c) => (
                <Pressable key={c.id} style={[styles.chip, classId === c.id && { backgroundColor: G }]} onPress={() => setClassId(c.id)}>
                  <Text style={[styles.chipText, classId === c.id && { color: '#fff' }]}>{c.name ?? c.id}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        {mode === 'teacher' && (
          <>
            <Text style={styles.label}>Teacher</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {staffList.map((s) => (
                <Pressable key={s.id} style={[styles.chip, teacherId === s.id && { backgroundColor: G }]} onPress={() => setTeacherId(s.id)}>
                  <Text style={[styles.chipText, teacherId === s.id && { color: '#fff' }]}>{s.name ?? s.staff_id ?? s.id}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        {isLoading && (classId || teacherId) ? (
          <ActivityIndicator size="small" color={G} style={styles.loader} />
        ) : Array.isArray(slots) && slots.length > 0 ? (
          <View style={styles.slotList}>
            {(slots as { day?: string; period?: string; subject?: string; teacher?: string }[]).map((s, i) => (
              <View key={i} style={styles.slotCard}>
                <Text style={styles.slotDay}>{s.day ?? '—'}</Text>
                <Text style={styles.slotPeriod}>P{s.period ?? '—'}</Text>
                <Text style={styles.slotSubject}>{s.subject ?? '—'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.hint}>Select class or teacher to load slots.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 56 },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  sectionTitle: { ...textStyles.h4, color: '#111827', marginBottom: spacing[2] },
  tabs: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  tab: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: 8, backgroundColor: '#E5E7EB' },
  tabText: { ...textStyles.body, color: '#374151' },
  label: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 8, marginRight: spacing[2], backgroundColor: '#E5E7EB' },
  chipText: { ...textStyles.body, color: '#374151' },
  loader: { marginVertical: spacing[4] },
  slotList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  slotCard: { width: '48%', backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  slotDay: { ...textStyles.caption, color: '#6B7280' },
  slotPeriod: { ...textStyles.bodySm, fontWeight: '600' },
  slotSubject: { ...textStyles.bodySm, color: '#111827' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
