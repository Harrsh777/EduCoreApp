/**
 * My Timetable — teaching staff: pre-selected logged-in teacher (web: /teacher/dashboard/my-timetable).
 * APIs: GET /api/timetable/slots?school_code=&teacher_id=
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { timetableService } from '@/services/timetable.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

export default function TeacherMyTimetableScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const [teacherId, setTeacherId] = useState(teacher?.id ?? '');

  useEffect(() => {
    if (teacher?.id) setTeacherId(teacher.id);
  }, [teacher?.id]);

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['timetable', 'slots', 'my', schoolCode, teacherId],
    queryFn: () =>
      timetableService.getTimetableSlots(schoolCode, { teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });

  const slots =
    (slotsData as { slots?: unknown[]; data?: unknown[] })?.slots ??
    (slotsData as { data?: unknown[] })?.data ??
    [];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Timetable</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!teacherId ? (
          <Text style={styles.hint}>Could not resolve your staff profile.</Text>
        ) : isLoading ? (
          <ActivityIndicator size="small" color={G} style={styles.loader} />
        ) : Array.isArray(slots) && slots.length > 0 ? (
          <View style={styles.slotList}>
            {(slots as { day?: string; period?: string; subject?: string; class_name?: string }[]).map(
              (s, i) => (
                <View key={i} style={styles.slotCard}>
                  <Text style={styles.slotDay}>{s.day ?? '—'}</Text>
                  <Text style={styles.slotPeriod}>P{s.period ?? '—'}</Text>
                  <Text style={styles.slotSubject}>{s.subject ?? '—'}</Text>
                  {s.class_name ? (
                    <Text style={styles.slotClass}>{s.class_name}</Text>
                  ) : null}
                </View>
              )
            )}
          </View>
        ) : (
          <Text style={styles.hint}>No timetable slots found for you.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },
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
  backText: { fontSize: 16, fontWeight: '600' },
  title: { ...textStyles.h4, color: '#111827', flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing[4], paddingBottom: spacing[8] },
  loader: { marginVertical: spacing[4] },
  slotList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  slotCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slotDay: { ...textStyles.caption, color: '#6B7280' },
  slotPeriod: { ...textStyles.bodySm, fontWeight: '600' },
  slotSubject: { ...textStyles.bodySm, color: '#111827' },
  slotClass: { ...textStyles.caption, color: '#6B7280', marginTop: 2 },
  hint: { ...textStyles.body, color: '#6B7280' },
});
