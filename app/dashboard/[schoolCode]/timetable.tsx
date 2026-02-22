/**
 * Timetable: class/teacher selector, grid days × periods, edit slots.
 * APIs: GET /api/timetable/slots, period-groups, GET /api/staff, GET /api/classes.
 */

import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSchoolCode } from '@/lib/school-context';
import { timetableService } from '@/services/timetable.service';
import { schoolService } from '@/services/school.service';
import { SectionHeader } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const INDIGO = '#4F46E5';

export default function TimetableScreen() {
  const router = useRouter();
  const { schoolCode } = useSchoolCode();
  const [mode, setMode] = useState<'class' | 'teacher'>('class');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');

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

  const classesList = Array.isArray(classesData) ? classesData : (classesData as { data?: { id: string; name?: string }[] })?.data ?? [];
  const staffList = Array.isArray(staffData) ? staffData : (staffData as { data?: { id: string; name?: string; staff_id?: string }[] })?.data ?? [];

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['timetable', 'slots', schoolCode, mode, classId, teacherId],
    queryFn: () =>
      timetableService.getTimetableSlots(schoolCode, mode === 'class' ? { class_id: classId } : { teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && (mode === 'class' ? classId : teacherId)),
  });

  const slots = (slotsData as { slots?: unknown[]; data?: unknown[] })?.slots ?? (slotsData as { data?: unknown[] })?.data ?? [];

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Timetable</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SectionHeader title="View by" />
        <View style={styles.tabs}>
          <Pressable style={[styles.tab, mode === 'class' && styles.tabActive]} onPress={() => setMode('class')}>
            <Text style={[styles.tabText, mode === 'class' && styles.tabTextActive]}>Class</Text>
          </Pressable>
          <Pressable style={[styles.tab, mode === 'teacher' && styles.tabActive]} onPress={() => setMode('teacher')}>
            <Text style={[styles.tabText, mode === 'teacher' && styles.tabTextActive]}>Teacher</Text>
          </Pressable>
        </View>
        {mode === 'class' ? (
          <Text style={styles.hint}>Select a class to load slots. Grid and edit coming soon.</Text>
        ) : (
          <Text style={styles.hint}>Select a teacher to load slots. Grid and edit coming soon.</Text>
        )}
        {isLoading && (classId || teacherId) ? (
          <ActivityIndicator size="small" color={INDIGO} style={styles.loader} />
        ) : Array.isArray(slots) && slots.length > 0 ? (
          <View style={styles.slotList}>
            {(slots as { day?: string; period?: string; subject?: string; teacher?: string }[]).map((s, i) => (
              <View key={i} style={styles.slotCard}>
                <Text style={styles.slotDay}>{s.day ?? '—'}</Text>
                <Text style={styles.slotMeta}>{s.period ?? ''} · {s.subject ?? ''} · {s.teacher ?? ''}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
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
    minHeight: 56,
  },
  backBtn: { padding: spacing[2], marginRight: spacing[2], minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: INDIGO, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  tabs: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  tab: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: 8, backgroundColor: '#E5E7EB' },
  tabActive: { backgroundColor: INDIGO },
  tabText: { ...textStyles.body, color: '#6B7280' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  hint: { ...textStyles.bodySm, color: '#6B7280', marginBottom: spacing[4] },
  loader: { marginVertical: spacing[4] },
  slotList: { gap: spacing[2] },
  slotCard: { backgroundColor: '#fff', padding: spacing[3], borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  slotDay: { ...textStyles.body, color: '#111827', fontWeight: '600' },
  slotMeta: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
});
