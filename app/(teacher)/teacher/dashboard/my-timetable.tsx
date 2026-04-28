/**
 * My Timetable — teaching staff: pre-selected logged-in teacher (web: /teacher/dashboard/my-timetable).
 * APIs: GET /api/timetable/slots?school_code=&teacher_id=
 */

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { timetableService } from '@/services/timetable.service';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const G = '#16A34A';

function asDisplayText(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text || '—';
  }
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const preferred = row.name ?? row.title ?? row.label ?? row.subject_name ?? row.class_name ?? row.day ?? row.period;
    if (preferred != null && (typeof preferred === 'string' || typeof preferred === 'number')) {
      const text = String(preferred).trim();
      if (text) return text;
    }
  }
  return '—';
}

type SlotRow = {
  day?: unknown;
  day_name?: unknown;
  day_of_week?: unknown;
  weekday?: unknown;
  period?: unknown;
  period_order?: unknown;
  period_id?: unknown;
  timetable_period_id?: unknown;
  period_uuid?: unknown;
  period_name?: unknown;
  subject?: unknown;
  subject_name?: unknown;
  class?: unknown;
  class_name?: unknown;
  section?: unknown;
  section_name?: unknown;
  room?: unknown;
  room_no?: unknown;
  room_number?: unknown;
  start_time?: unknown;
  end_time?: unknown;
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function normalizeDay(value: unknown): string {
  const raw = asDisplayText(value);
  if (raw === '—') return 'Unknown';
  const short = raw.slice(0, 3).toLowerCase();
  const match = DAY_ORDER.find((d) => d.toLowerCase().startsWith(short));
  return match ?? raw;
}

function periodKey(row: SlotRow): string {
  const p = asDisplayText(row.period_order ?? row.period);
  const pn = asDisplayText(row.period_name);
  return pn !== '—' ? `${pn}` : p !== '—' ? `P${p}` : 'Period';
}

function periodSortValue(row: SlotRow): number {
  const p = Number(asDisplayText(row.period_order ?? row.period).replace(/[^\d]/g, ''));
  if (!Number.isNaN(p) && p > 0) return p;
  const st = asDisplayText(row.start_time);
  const m = st.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function slotTimeLabel(row: SlotRow): string {
  const st = asDisplayText(row.start_time);
  const et = asDisplayText(row.end_time);
  if (st === '—' && et === '—') return '';
  if (st !== '—' && et !== '—') return `${st} - ${et}`;
  return st !== '—' ? st : et;
}

function unwrapSlotsPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.slots)) return o.slots;
  if (Array.isArray(o.data)) return o.data;
  const inner = o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const d = inner as Record<string, unknown>;
    if (Array.isArray(d.slots)) return d.slots;
    if (Array.isArray(d.data)) return d.data;
  }
  return [];
}

type PeriodColumn = {
  key: string;
  label: string;
  sort: number;
  matchKeys: string[];
};

function normalizeMatchKey(value: unknown): string {
  const s = asDisplayText(value);
  if (s === '—') return '';
  return s.trim().toLowerCase();
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function getSlotPeriodMatchKeys(row: SlotRow): string[] {
  const id = normalizeMatchKey(row.period_id ?? row.timetable_period_id ?? row.period_uuid);
  const name = normalizeMatchKey(row.period_name);
  const orderRaw = asDisplayText(row.period_order ?? row.period);
  const orderNum = orderRaw.replace(/[^\d]/g, '');
  const fromOrder = orderNum ? [`p${orderNum}`, orderNum] : [];
  const fromRaw = normalizeMatchKey(row.period);
  return uniqueNonEmpty([id, name, fromRaw, ...fromOrder, normalizeMatchKey(periodKey(row))]);
}

export default function TeacherMyTimetableScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();
  const [teacherId, setTeacherId] = useState(teacher?.id ?? teacher?.staff_id ?? '');
  const [activeDay, setActiveDay] = useState<string>('');

  useEffect(() => {
    if (teacher?.id || teacher?.staff_id) setTeacherId(teacher?.id ?? teacher?.staff_id ?? '');
  }, [teacher?.id, teacher?.staff_id]);

  const staffId = teacher?.staff_id ?? '';

  const effectiveTeacherId = teacherId || staffId;

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['timetable', 'slots', 'my', schoolCode, teacherId, staffId],
    queryFn: async () => {
      const ids = new Set(
        [teacher?.id, teacherId, teacher?.staff_id, staffId]
          .map((v) => String(v ?? '').trim().toLowerCase())
          .filter(Boolean)
      );

      const matchesTeacher = (row: Record<string, unknown>): boolean => {
        const candidates = [
          row.teacher_id,
          row.staff_id,
          row.staff_code,
          (row.staff as Record<string, unknown> | undefined)?.id,
          (row.staff as Record<string, unknown> | undefined)?.staff_id,
          (row.teacher as Record<string, unknown> | undefined)?.id,
          (row.teacher as Record<string, unknown> | undefined)?.staff_id,
          (row.teacher as Record<string, unknown> | undefined)?.teacher_id,
        ]
          .map((v) => String(v ?? '').trim().toLowerCase())
          .filter(Boolean);
        return candidates.some((v) => ids.has(v));
      };

      const primaryRes = await timetableService.getTimetableSlots(schoolCode, {
        teacher_id: effectiveTeacherId || undefined,
        staff_id: staffId || undefined,
      });
      const primaryBody = primaryRes.data;
      const primarySlots = unwrapSlotsPayload(primaryBody).filter(
        (r): r is Record<string, unknown> => Boolean(r && typeof r === 'object')
      );
      if (primarySlots.length > 0) return primaryBody;

      // Fallback: some backends ignore teacher filters; fetch all and filter locally.
      const fallbackRes = await timetableService.getTimetableSlots(schoolCode);
      const fallbackBody = fallbackRes.data;
      const fallbackSlots = unwrapSlotsPayload(fallbackBody).filter(
        (r): r is Record<string, unknown> => Boolean(r && typeof r === 'object')
      );
      const filtered = fallbackSlots.filter(matchesTeacher);
      return { data: filtered };
    },
    enabled: Boolean(schoolCode && effectiveTeacherId),
  });

  const { data: periodGroupsData } = useQuery({
    queryKey: ['timetable', 'period-groups', schoolCode],
    queryFn: () => timetableService.getTimetablePeriodGroups(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const slots = unwrapSlotsPayload(slotsData);

  const periodRows =
    (periodGroupsData as { periods?: unknown[]; data?: { periods?: unknown[] } })?.periods ??
    (periodGroupsData as { data?: { periods?: unknown[] } })?.data?.periods ??
    (periodGroupsData as { data?: unknown[] })?.data ??
    [];

  const typedSlots = (Array.isArray(slots) ? slots : []) as SlotRow[];

  const periodColumns = useMemo<PeriodColumn[]>(() => {
    const fromGroups = (Array.isArray(periodRows) ? periodRows : [])
      .map((p) => {
        const row = p as Record<string, unknown>;
        const id = normalizeMatchKey(row.id ?? row.period_id ?? row.timetable_period_id);
        const name = asDisplayText(row.name ?? row.period_name ?? row.label);
        const number = asDisplayText(row.period_no ?? row.period ?? row.id);
        const label = name !== '—' ? name : number !== '—' ? `P${number}` : '';
        if (!label) return null;
        const orderNum = String(number).replace(/[^\d]/g, '');
        const sort = Number(orderNum);
        return {
          key: id || normalizeMatchKey(label),
          label,
          sort: Number.isNaN(sort) ? Number.MAX_SAFE_INTEGER : sort,
          matchKeys: uniqueNonEmpty([
            id,
            normalizeMatchKey(name),
            normalizeMatchKey(number),
            normalizeMatchKey(label),
            orderNum ? `p${orderNum}` : '',
            orderNum,
          ]),
        };
      })
      .filter((x): x is PeriodColumn => Boolean(x));

    if (fromGroups.length > 0) {
      return [...fromGroups].sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
    }

    const fromSlots = typedSlots.map((s) => ({
      key: normalizeMatchKey(periodKey(s)) || periodKey(s),
      label: periodKey(s),
      sort: periodSortValue(s),
      matchKeys: getSlotPeriodMatchKeys(s),
    }));
    const uniq = new Map<string, PeriodColumn>();
    fromSlots.forEach((p) => {
      if (!uniq.has(p.key)) uniq.set(p.key, p);
    });
    return [...uniq.values()].sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
  }, [periodRows, typedSlots]);

  const dayRows = useMemo(() => {
    const daySet = new Map<string, true>();
    typedSlots.forEach((s) => {
      const day = normalizeDay(s.day ?? s.day_name ?? s.day_of_week ?? s.weekday);
      if (day !== 'Unknown') daySet.set(day, true);
    });
    const ordered = DAY_ORDER.filter((d) => daySet.has(d));
    const extras = [...daySet.keys()].filter((d) => !DAY_ORDER.includes(d)).sort();
    return [...ordered, ...extras];
  }, [typedSlots]);

  useEffect(() => {
    if (!activeDay && dayRows.length > 0) setActiveDay(dayRows[0]);
    if (activeDay && dayRows.length > 0 && !dayRows.includes(activeDay)) setActiveDay(dayRows[0]);
  }, [dayRows, activeDay]);

  const slotByDayAndPeriod = useMemo(() => {
    const map = new Map<string, SlotRow>();
    typedSlots.forEach((s) => {
      const day = normalizeDay(s.day ?? s.day_name ?? s.day_of_week ?? s.weekday);
      if (day === 'Unknown') return;
      const periodKeys = getSlotPeriodMatchKeys(s);
      periodKeys.forEach((k) => {
        map.set(`${day}__${k}`, s);
      });
    });
    return map;
  }, [typedSlots]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: G }]}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Timetable</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!effectiveTeacherId ? (
          <Text style={styles.hint}>Could not resolve your staff profile.</Text>
        ) : isLoading ? (
          <ActivityIndicator size="small" color={G} style={styles.loader} />
        ) : typedSlots.length > 0 && periodColumns.length > 0 && dayRows.length > 0 ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
              {dayRows.map((day) => {
                const active = day === activeDay;
                return (
                  <Pressable key={day} style={[styles.dayTab, active && styles.dayTabActive]} onPress={() => setActiveDay(day)}>
                    <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>{day}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.cardsWrap}>
              {periodColumns.map((p) => {
                const slot = p.matchKeys.map((k) => slotByDayAndPeriod.get(`${activeDay}__${k}`)).find(Boolean);
                return (
                  <View key={`${activeDay}-${p.key}`} style={[styles.periodCard, !slot && styles.periodCardFree]}>
                    <View style={styles.periodCardTop}>
                      <Text style={styles.periodLabel}>{p.label}</Text>
                      {slot ? null : <Text style={styles.freeTag}>Free</Text>}
                    </View>
                    {slot ? (
                      <>
                        <Text style={styles.slotSubject} numberOfLines={2}>
                          {asDisplayText(slot.subject ?? slot.subject_name)}
                        </Text>
                        <Text style={styles.slotClass} numberOfLines={1}>
                          {[
                            asDisplayText(slot.class_name ?? slot.class),
                            asDisplayText(slot.section_name ?? slot.section),
                          ]
                            .filter((v) => v !== '—')
                            .join(' - ') || '—'}
                        </Text>
                        <Text style={styles.slotClass} numberOfLines={1}>
                          {asDisplayText(slot.room ?? slot.room_no ?? slot.room_number) !== '—'
                            ? `Room: ${asDisplayText(slot.room ?? slot.room_no ?? slot.room_number)}`
                            : 'Room: —'}
                        </Text>
                        {slotTimeLabel(slot) ? <Text style={styles.slotTime}>{slotTimeLabel(slot)}</Text> : null}
                      </>
                    ) : (
                      <Text style={styles.emptySlot}>No class assigned</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.hint}>No timetable slots found for you.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ECFDF3' },
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
  content: { padding: spacing[4], paddingBottom: spacing[8], gap: spacing[3] },
  loader: { marginVertical: spacing[4] },
  dayTabs: {
    gap: spacing[2],
    paddingBottom: spacing[2],
  },
  dayTab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#ECFDF3',
  },
  dayTabActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  dayTabText: {
    ...textStyles.bodySm,
    color: '#166534',
    fontWeight: '700',
  },
  dayTabTextActive: {
    color: '#FFFFFF',
  },
  cardsWrap: {
    gap: spacing[2],
  },
  periodCard: {
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: spacing[3],
    gap: 4,
  },
  periodCardFree: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  periodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodLabel: {
    ...textStyles.caption,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  freeTag: {
    ...textStyles.caption,
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontWeight: '700',
  },
  slotSubject: { ...textStyles.bodySm, color: '#052E16', fontWeight: '700' },
  slotClass: { ...textStyles.caption, color: '#166534' },
  slotTime: { fontSize: 11, color: '#15803D', fontWeight: '600' },
  emptySlot: { fontSize: 14, color: '#86A892', textAlign: 'center', fontWeight: '600' },
  hint: { ...textStyles.body, color: '#6B7280' },
});
