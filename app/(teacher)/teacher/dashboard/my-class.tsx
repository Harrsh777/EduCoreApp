/**
 * My Class (class teacher): class info, timetable grid, optional student list.
 * APIs: GET classes/teacher, students (filter by class), timetable/slots.
 */

import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { schoolService } from '@/services/school.service';
import { timetableService } from '@/services/timetable.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

export default function TeacherMyClassScreen() {
  const router = useRouter();
  const { schoolCode, teacher, path } = useTeacher();
  const [selectedClassId, setSelectedClassId] = useState('');

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id],
    queryFn: () => teacherService.getClasses({ school_code: schoolCode, teacher_id: teacher?.id ?? '' }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['timetable', 'slots', schoolCode, selectedClassId],
    queryFn: () => timetableService.getTimetableSlots(schoolCode, { class_id: selectedClassId }).then((r) => r.data),
    enabled: Boolean(schoolCode && selectedClassId),
  });
  const { data: studentsData } = useQuery({
    queryKey: ['students', schoolCode, selectedClassId],
    queryFn: () => schoolService.getStudents(schoolCode, selectedClassId ? { class: selectedClassId } : undefined).then((r) => r.data),
    enabled: Boolean(schoolCode && selectedClassId),
  });

  const classesList = (Array.isArray(classesData) ? classesData : (classesData as { data?: unknown[] })?.data ?? []) as Array<{ id: string; name?: string }>;
  const slots = (Array.isArray(slotsData) ? slotsData : (slotsData as { data?: unknown[] })?.data ?? []) as Array<{ day?: string; period?: string; subject?: string; start_time?: string; end_time?: string }>;
  const students = (Array.isArray(studentsData) ? studentsData : (studentsData as { data?: unknown[] })?.data ?? []) as Array<{ id: string; name?: string; admission_no?: string }>;

  useEffect(() => {
    if (classesList.length > 0 && !selectedClassId) setSelectedClassId(classesList[0].id);
  }, [classesList.length, selectedClassId]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: TEACHER_GREEN }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Class</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {classesList.length > 0 && (
          <>
            <Text style={styles.label}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {classesList.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.chip, selectedClassId === c.id && { backgroundColor: TEACHER_GREEN }]}
                  onPress={() => setSelectedClassId(c.id)}
                >
                  <Text style={[styles.chipText, selectedClassId === c.id && { color: '#fff' }]}>{c.name ?? c.id}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        {selectedClassId && (
          <>
            <Text style={styles.sectionTitle}>Timetable</Text>
            {loadingSlots ? (
              <ActivityIndicator size="small" color={TEACHER_GREEN} style={styles.loader} />
            ) : slots.length > 0 ? (
              <View style={styles.grid}>
                {slots.slice(0, 14).map((s, i) => (
                  <View key={i} style={styles.slotCard}>
                    <Text style={styles.slotDay}>{s.day ?? ''}</Text>
                    <Text style={styles.slotPeriod}>P{s.period ?? ''}</Text>
                    <Text style={styles.slotSubject} numberOfLines={1}>{s.subject ?? '—'}</Text>
                    <Text style={styles.slotTime}>{s.start_time ?? ''}-{s.end_time ?? ''}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.hint}>No timetable slots.</Text>
            )}
            <Text style={styles.sectionTitle}>Students ({students.length})</Text>
            {students.slice(0, 10).map((s) => (
              <Pressable key={s.id} style={styles.row} onPress={() => router.push(path(`students`) as never)}>
                <Text style={styles.rowName} numberOfLines={1}>{s.name ?? s.admission_no ?? s.id}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
            {students.length > 10 && <Text style={styles.more}>+{students.length - 10} more</Text>}
          </>
        )}
        {classesList.length === 0 && <Text style={styles.empty}>No class assigned.</Text>}
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
  label: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[2] },
  chipRow: { marginBottom: spacing[4] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 8, marginRight: spacing[2], backgroundColor: '#E5E7EB' },
  chipText: { ...textStyles.body, color: '#374151' },
  sectionTitle: { ...textStyles.h4, color: '#111827', marginTop: spacing[4], marginBottom: spacing[2] },
  loader: { marginVertical: spacing[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  slotCard: { width: '48%', backgroundColor: '#fff', padding: spacing[2], borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  slotDay: { ...textStyles.caption, color: '#6B7280' },
  slotPeriod: { ...textStyles.bodySm, fontWeight: '600' },
  slotSubject: { ...textStyles.bodySm, color: '#111827' },
  slotTime: { ...textStyles.caption, color: '#9CA3AF' },
  hint: { ...textStyles.body, color: '#6B7280', marginBottom: spacing[4] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[3], backgroundColor: '#fff', borderRadius: 8, marginBottom: spacing[2], borderWidth: 1, borderColor: '#E5E7EB' },
  rowName: { ...textStyles.body, color: '#111827', flex: 1 },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  more: { ...textStyles.bodySm, color: '#6B7280', marginTop: spacing[2] },
  empty: { ...textStyles.body, color: '#6B7280' },
});
