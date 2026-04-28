/**
 * My Class (class teacher).
 * GET /api/classes/teacher?...&array=true; GET /api/students?...&status=active; GET /api/timetable/slots?class_id=
 */

import { useRouter } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { schoolService } from '@/services/school.service';
import { timetableService } from '@/services/timetable.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const TEACHER_GREEN = '#16A34A';

type TeacherClassRow = {
  id: string;
  name?: string;
  class_name?: string;
  section?: string;
  academic_year?: string | number;
};

function classChipLabel(c: TeacherClassRow): string {
  const base = (c.class_name ?? c.name ?? '').trim();
  const sec = (c.section ?? '').trim();
  if (base && sec) return `${base}-${sec}`;
  if (base) return base;
  return c.id;
}

function unwrapTimetableSlots(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.slots)) return o.slots;
  if (Array.isArray(o.data)) return o.data;
  const d = o.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.slots)) return inner.slots;
    if (Array.isArray(inner.data)) return inner.data;
  }
  return [];
}

export default function TeacherMyClassScreen() {
  const router = useRouter();
  const { schoolCode, teacher, path } = useTeacher();
  const [selectedClassId, setSelectedClassId] = useState('');

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacher?.id, teacher?.staff_id, 'array'],
    queryFn: () =>
      teacherService
        .getClasses({
          school_code: schoolCode,
          teacher_id: teacher?.id ?? '',
          staff_id: teacher?.staff_id,
          array: true,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacher?.id),
  });
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['timetable', 'slots', schoolCode, selectedClassId],
    queryFn: () => timetableService.getTimetableSlots(schoolCode, { class_id: selectedClassId }).then((r) => r.data),
    enabled: Boolean(schoolCode && selectedClassId),
  });

  const classesList = (
    Array.isArray(classesData) ? classesData : (classesData as { data?: unknown[] })?.data ?? []
  ) as TeacherClassRow[];

  const selectedClass = useMemo(
    () => classesList.find((c) => c.id === selectedClassId),
    [classesList, selectedClassId]
  );

  const rosterClassParam = (
    (selectedClass?.class_name ?? selectedClass?.name ?? '').trim() || selectedClassId
  ) as string;

  const { data: studentsData } = useQuery({
    queryKey: [
      'students',
      'my-class',
      schoolCode,
      selectedClassId,
      rosterClassParam,
      selectedClass?.section ?? '',
      selectedClass?.academic_year ?? '',
    ],
    queryFn: () =>
      schoolService
        .getStudents(schoolCode, {
          class: rosterClassParam,
          ...(selectedClass?.section != null && String(selectedClass.section).trim()
            ? { section: String(selectedClass.section).trim() }
            : {}),
          ...(selectedClass?.academic_year != null && String(selectedClass.academic_year).trim()
            ? { academic_year: String(selectedClass.academic_year).trim() }
            : {}),
          status: 'active',
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && selectedClassId && selectedClass),
  });

  const slots = unwrapTimetableSlots(slotsData) as Array<{
    day?: string;
    period?: string;
    subject?: string;
    start_time?: string;
    end_time?: string;
  }>;
  const students = (
    Array.isArray(studentsData) ? studentsData : (studentsData as { data?: unknown[] })?.data ?? []
  ) as Array<{ id: string; name?: string; admission_no?: string; student_name?: string; full_name?: string }>;
  const classLabel = selectedClass ? classChipLabel(selectedClass) : '';
  const classStrength = students.length;

  useEffect(() => {
    if (classesList.length > 0 && !selectedClassId) setSelectedClassId(classesList[0].id);
  }, [classesList, selectedClassId]);

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
                  <Text style={[styles.chipText, selectedClassId === c.id && { color: '#fff' }]}>
                    {classChipLabel(c)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        {selectedClassId && (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.profileTitle}>Class Profile</Text>
              <View style={styles.profileGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Class</Text>
                  <Text style={styles.statValue}>{classLabel || '—'}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Section</Text>
                  <Text style={styles.statValue}>{selectedClass?.section ?? '—'}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Strength</Text>
                  <Text style={styles.statValue}>{classStrength}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Academic Year</Text>
                  <Text style={styles.statValue}>{selectedClass?.academic_year ?? '—'}</Text>
                </View>
              </View>
              <View style={styles.quickActions}>
                <Pressable style={styles.quickActionBtn} onPress={() => router.push(path('attendance') as never)}>
                  <Text style={styles.quickActionText}>Take Attendance</Text>
                </Pressable>
                <Pressable style={styles.quickActionBtn} onPress={() => router.push(path('students') as never)}>
                  <Text style={styles.quickActionText}>Open Roster</Text>
                </Pressable>
              </View>
            </View>
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
                <Text style={styles.rowName} numberOfLines={1}>
                  {s.name ?? s.student_name ?? s.full_name ?? s.admission_no ?? s.id}
                </Text>
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
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  profileTitle: { ...textStyles.body, fontWeight: '700', color: '#111827', marginBottom: spacing[2] },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  statBox: {
    width: '48%',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: spacing[2],
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statLabel: { ...textStyles.caption, color: '#6B7280' },
  statValue: { ...textStyles.bodySm, color: '#111827', fontWeight: '600', marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
  quickActionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  quickActionText: { ...textStyles.bodySm, color: '#166534', fontWeight: '700' },
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
