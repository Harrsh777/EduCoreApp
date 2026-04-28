/**
 * Copy Checking: read-only. Classes teacher handles, timetable grouped by day.
 * GET /api/classes/teacher?...&array=true, GET /api/timetable/slots?teacher_id=
 */

import { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { timetableService } from '@/services/timetable.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

type Slot = {
  id?: string;
  day?: string;
  subject?: string;
  class_name?: string;
  class_id?: string;
  start_time?: string;
  end_time?: string;
  copy_checked?: boolean;
  status?: string;
};

function unwrapSlotsBody(raw: unknown): Slot[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as Slot[];
  if (typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.slots)) return o.slots as Slot[];
  if (Array.isArray(o.data)) return o.data as Slot[];
  const d = o.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.slots)) return inner.slots as Slot[];
    if (Array.isArray(inner.data)) return inner.data as Slot[];
  }
  return [];
}

export default function TeacherCopyCheckingScreen() {
  const { schoolCode, teacher } = useTeacher();
  const teacherId = teacher?.id ?? '';

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacherId, teacher?.staff_id, 'array'],
    queryFn: () =>
      teacherService
        .getClasses({
          school_code: schoolCode,
          teacher_id: teacherId,
          staff_id: teacher?.staff_id,
          array: true,
        })
        .then((r) => {
          const body = r.data;
          if (Array.isArray(body)) return body;
          return (body as { data?: unknown[] })?.data ?? [];
        }),
    enabled: Boolean(schoolCode && teacherId),
  });

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['teacher', 'timetable', 'slots', schoolCode, teacherId],
    queryFn: () =>
      timetableService.getTimetableSlots(schoolCode, { teacher_id: teacherId }).then((r) => unwrapSlotsBody(r.data)),
    enabled: Boolean(schoolCode && teacherId),
  });

  const classesList = (Array.isArray(classesData) ? classesData : []) as { id?: string; name?: string; class_name?: string; section?: string }[];
  const slots = (Array.isArray(slotsData) ? slotsData : []) as Slot[];

  const slotsByDay = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    DAY_ORDER.forEach((d) => (map[d] = []));
    slots.forEach((slot) => {
      const day = (slot.day ?? '').toLowerCase();
      if (DAY_ORDER.includes(day)) map[day].push(slot);
      else if (day && !map[day]) map[day] = [slot];
    });
    return map;
  }, [slots]);
  const progress = useMemo(() => {
    const checked = slots.filter((slot) => {
      if (typeof slot.copy_checked === 'boolean') return slot.copy_checked;
      return String(slot.status ?? '').toLowerCase() === 'checked';
    }).length;
    const pending = Math.max(slots.length - checked, 0);
    return { checked, pending, total: slots.length };
  }, [slots]);

  const isLoading = classesLoading || slotsLoading;

  return (
    <View style={styles.root}>
      <AppHeader title="Copy Checking" />
      <ScreenWrapper scroll loading={isLoading} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Classes you handle</Text>
          {classesList.length === 0 ? (
            <Text style={styles.empty}>No classes assigned.</Text>
          ) : (
            <View style={styles.classRow}>
              {classesList.map((c) => (
                <View key={c.id ?? c.class_name} style={styles.classPill}>
                  <Text style={styles.classPillText}>{c.class_name ?? c.name ?? c.id} {c.section ?? ''}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Completion tracker</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Pending</Text>
              <Text style={styles.metricPending}>{progress.pending}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Checked</Text>
              <Text style={styles.metricChecked}>{progress.checked}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total</Text>
              <Text style={styles.metricTotal}>{progress.total}</Text>
            </View>
          </View>
          <Text style={styles.timelineHint}>
            Timeline below shows class-subject slots day-wise for rapid copy-checking follow-up.
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Timetable by day</Text>
        {DAY_ORDER.map((day) => {
          const list = slotsByDay[day] ?? [];
          return (
            <Card key={day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{DAY_LABELS[day] ?? day}</Text>
              {list.length === 0 ? (
                <Text style={styles.noSlots}>No slots</Text>
              ) : (
                list.map((slot, i) => (
                  <View key={slot.id ?? i} style={styles.slotRow}>
                    <Text style={styles.slotSubject}>{slot.subject ?? '—'}</Text>
                    <Text style={styles.slotClass}>{slot.class_name ?? '—'}</Text>
                    <Text style={styles.slotTime}>
                      {[slot.start_time, slot.end_time].filter(Boolean).join(' – ') || '—'}
                    </Text>
                  </View>
                ))
              )}
            </Card>
          );
        })}
        {slots.length === 0 && !isLoading && (
          <Text style={styles.empty}>No timetable slots.</Text>
        )}
        <View style={styles.bottomPad} />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { marginBottom: s.lg },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: s.md },
  classRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
  classPill: { backgroundColor: colors.primaryLight, paddingHorizontal: s.md, paddingVertical: s.xs, borderRadius: 9999 },
  classPillText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  metricsRow: { flexDirection: 'row', gap: s.sm },
  metricCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: s.md, borderWidth: 1, borderColor: colors.border },
  metricLabel: { ...textStyles.caption, color: colors.textMuted, marginBottom: 2 },
  metricPending: { ...textStyles.body, color: '#B45309', fontWeight: '700' },
  metricChecked: { ...textStyles.body, color: colors.primaryDark, fontWeight: '700' },
  metricTotal: { ...textStyles.body, color: colors.textPrimary, fontWeight: '700' },
  timelineHint: { ...textStyles.caption, color: colors.textMuted, marginTop: s.md },
  dayCard: { marginBottom: s.lg },
  dayTitle: { ...textStyles.body, fontWeight: '700', color: colors.textPrimary, marginBottom: s.md },
  slotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: s.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  slotSubject: { flex: 1, ...textStyles.body, color: colors.textPrimary },
  slotClass: { width: 80, ...textStyles.caption, color: colors.textMuted, textAlign: 'right' },
  slotTime: { width: 90, ...textStyles.caption, color: colors.textSecondary, textAlign: 'right' },
  noSlots: { ...textStyles.caption, color: colors.textMuted, fontStyle: 'italic' },
  empty: { ...textStyles.body, color: colors.textMuted, marginBottom: s.lg },
  bottomPad: { height: 40 },
});
