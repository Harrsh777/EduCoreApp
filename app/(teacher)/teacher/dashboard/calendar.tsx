/**
 * Academic Calendar: year dropdown, month grid, event days (green dot), tap day → event list.
 * Primary: GET /api/calendar/academic?school_code=&academic_year= (events / exam_schedules merge).
 * Supplement: GET /api/calendar/events?start=&end= when needed.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { calendarService } from '@/services/calendar.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, Card, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type CalendarEvent = { id?: string; title?: string; event_type?: string; description?: string; event_date?: string; start?: string; end?: string };

function getMonthDays(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

export default function TeacherCalendarScreen() {
  const { schoolCode } = useTeacher();
  const now = new Date();
  const [academicYear, setAcademicYear] = useState(String(now.getFullYear()));
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = useMemo(() => {
    const d = new Date(year, month, 1);
    return d.toISOString().slice(0, 10);
  }, [year, month]);
  const monthEnd = useMemo(() => {
    const d = new Date(year, month + 1, 0);
    return d.toISOString().slice(0, 10);
  }, [year, month]);

  const { data: academicData } = useQuery({
    queryKey: ['calendar', 'academic', schoolCode, academicYear],
    queryFn: () =>
      calendarService
        .getCalendarAcademic(schoolCode, { academic_year: academicYear, include_events: true })
        .then((res) => (res as { data?: unknown }).data),
    enabled: Boolean(schoolCode),
  });

  const { data: eventsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar', 'events', schoolCode, monthStart, monthEnd],
    queryFn: () =>
      calendarService.getCalendarEvents(schoolCode, { start: monthStart, end: monthEnd }).then((r) => (r as { data?: CalendarEvent[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });

  const academicEvents = useMemo(() => {
    const raw = academicData;
    if (raw == null) return [] as CalendarEvent[];
    if (Array.isArray(raw)) return raw as CalendarEvent[];
    if (typeof raw !== 'object') return [];
    const o = raw as Record<string, unknown>;
    const out: CalendarEvent[] = [];
    const take = (x: unknown) => {
      if (Array.isArray(x)) out.push(...(x as CalendarEvent[]));
    };
    take(o.events);
    const data = o.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      take((data as Record<string, unknown>).events);
      take((data as Record<string, unknown>).exam_schedules);
    }
    take(o.exam_schedules);
    return out;
  }, [academicData]);

  const eventsFromRange = (Array.isArray(eventsData) ? eventsData : []) as CalendarEvent[];

  const allEvents = useMemo(() => {
    const byKey = new Map<string, CalendarEvent>();
    const add = (e: CalendarEvent) => {
      const k = String(e.id ?? `${(e.event_date ?? e.start ?? '').toString().slice(0, 10)}-${e.title ?? ''}`);
      if (!byKey.has(k)) byKey.set(k, e);
    };
    academicEvents.forEach(add);
    eventsFromRange.forEach(add);
    return Array.from(byKey.values());
  }, [academicEvents, eventsFromRange]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    allEvents.forEach((e) => {
      const d = (e.event_date ?? e.start ?? '').toString().slice(0, 10);
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    });
    return map;
  }, [allEvents]);

  const monthDays = useMemo(() => getMonthDays(year, month), [year, month]);
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [String(y - 1), String(y), String(y + 1)];
  }, [now.getFullYear()]);

  const goPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const goNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Academic Calendar" />
      <ScreenWrapper scroll={false} contentContainerStyle={styles.content}>
        <View style={styles.controls}>
          <Text style={styles.label}>Academic year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {yearOptions.map((y) => (
              <Pressable
                key={y}
                style={[styles.chip, academicYear === y && styles.chipActive]}
                onPress={() => setAcademicYear(y)}
              >
                <Text style={[styles.chipText, academicYear === y && styles.chipTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Card style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <Pressable onPress={goPrevMonth} style={styles.navBtn}>
              <Text style={styles.navText}>←</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
            <Pressable onPress={goNextMonth} style={styles.navBtn}>
              <Text style={styles.navText}>→</Text>
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekDay}>{w}</Text>
            ))}
          </View>
          {monthDays.map((row, ri) => (
            <View key={ri} style={styles.dayRow}>
              {row.map((d, di) => {
                const dateStr = d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
                const hasEvent = dateStr && eventsByDate[dateStr]?.length;
                const isSelected = dateStr === selectedDate;
                return (
                  <Pressable
                    key={di}
                    style={[styles.cell, isSelected && styles.cellSelected]}
                    onPress={() => setSelectedDate(dateStr)}
                  >
                    {d != null ? (
                      <>
                        <Text style={[styles.cellText, isSelected && styles.cellTextSelected]}>{d}</Text>
                        {hasEvent ? <View style={styles.dot} /> : null}
                      </>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Card>

        {selectedDate && (
          <Card style={styles.eventsCard}>
            <Text style={styles.eventsTitle}>Events – {selectedDate}</Text>
            {selectedEvents.length === 0 ? (
              <Text style={styles.empty}>No events this day.</Text>
            ) : (
              selectedEvents.map((e) => (
                <View key={e.id ?? e.title} style={styles.eventRow}>
                  <Text style={styles.eventTitle}>{e.title ?? '—'}</Text>
                  {e.event_type ? <Text style={styles.eventType}>{e.event_type}</Text> : null}
                  {e.description ? <Text style={styles.eventDesc} numberOfLines={2}>{e.description}</Text> : null}
                </View>
              ))
            )}
          </Card>
        )}

        {isLoading && allEvents.length === 0 ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
        {isError ? (
          <Text style={styles.errorText}>Failed to load events.</Text>
        ) : null}
        <View style={styles.bottomPad} />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  controls: { marginBottom: s.md },
  label: { ...textStyles.caption, color: colors.textMuted, marginBottom: s.xs },
  chipRow: { marginBottom: s.sm },
  chip: { paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: 9999, marginRight: s.sm, backgroundColor: colors.border },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: '#fff' },
  calendarCard: { marginBottom: s.lg },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md },
  navBtn: { padding: s.sm },
  navText: { fontSize: 18, fontWeight: '600', color: colors.primary },
  monthTitle: { ...textStyles.h4, color: colors.textPrimary },
  weekRow: { flexDirection: 'row', marginBottom: s.xs },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textMuted },
  dayRow: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellSelected: { backgroundColor: colors.primaryLight, borderRadius: 8 },
  cellText: { fontSize: 13, color: colors.textPrimary },
  cellTextSelected: { color: colors.primary, fontWeight: '600' },
  dot: { position: 'absolute', bottom: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  eventsCard: { marginBottom: s.lg },
  eventsTitle: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary, marginBottom: s.md },
  eventRow: { marginBottom: s.md, paddingBottom: s.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventTitle: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  eventType: { fontSize: 12, color: colors.primary, marginTop: 2 },
  eventDesc: { ...textStyles.caption, color: colors.textMuted, marginTop: 2 },
  empty: { ...textStyles.caption, color: colors.textMuted },
  loader: { padding: s.lg },
  errorText: { ...textStyles.body, color: colors.danger, padding: s.lg },
  bottomPad: { height: 40 },
});
