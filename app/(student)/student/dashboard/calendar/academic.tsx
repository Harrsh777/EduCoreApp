import { useStudent } from '@/lib/student-context';
import { calendarService } from '@/services/calendar.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/* ===========================
   COLOR SYSTEM (Light + Blue)
=========================== */
const BG = '#F3F6FB';
const CARD = '#FFFFFF';
const PRIMARY = '#2563EB';
const PRIMARY_LIGHT = 'rgba(37,99,235,0.12)';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';

/* ===========================
   HELPERS
=========================== */

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(
    day
  ).padStart(2, '0')}`;
}

export default function StudentAcademicCalendarScreen() {
  const { schoolCode, student } = useStudent();
  const today = new Date();

  const [year, setYear] = useState<number>(
    student?.academic_year
      ? Number(student.academic_year)
      : today.getFullYear()
  );

  const [month, setMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* ===========================
     API
  =========================== */
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['academic-calendar', schoolCode, year],
    queryFn: () =>
      calendarService
        .getCalendarAcademic(schoolCode, {
          academic_year: String(year), // ✅ FIXED TS
          include_events: true,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && year),
  });

  const events =
    Array.isArray(data) ? data : (data as { data?: any[] })?.data ?? [];

  /* ===========================
     PRECOMPUTED MAP (Performance)
  =========================== */
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    events.forEach((e: any) => {
      const d = e?.event_date;
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [events]);

  const totalDays = daysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();

  const monthEvents = useMemo(() => {
    return events.filter((e: any) => {
      if (!e?.event_date) return false;
      const d = new Date(e.event_date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [events, month, year]);

  const selectedEvents = selectedDate
    ? eventsByDate[selectedDate] || []
    : [];

  const todayKey = new Date().toISOString().split('T')[0];

  /* ===========================
     RENDER DAY CELL
  =========================== */
  const renderDayCell = (day: number) => {
    const dateKey = formatDateKey(year, month, day);
    const dayEvents = eventsByDate[dateKey] || [];
    const isSelected = selectedDate === dateKey;
    const isToday = dateKey === todayKey;

    return (
      <Pressable
        key={day}
        style={styles.dayCell}
        onPress={() => setSelectedDate(dateKey)}
      >
        <View
          style={[
            styles.dayCircle,
            isToday && styles.todayBorder,
            isSelected && styles.selectedDay,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && { color: '#fff', fontWeight: '700' },
            ]}
          >
            {day}
          </Text>
        </View>

        {dayEvents.length > 0 && (
          <View style={styles.dotRow}>
            {dayEvents.slice(0, 3).map((_, i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  /* ===========================
     UI
  =========================== */
  return (
    <View style={styles.root}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={PRIMARY}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Academic Calendar</Text>
        </View>

        {/* YEAR SELECTOR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearRow}
        >
          {[year - 1, year, year + 1].map((y) => (
            <Pressable key={y} onPress={() => setYear(y)}>
              <Text
                style={[
                  styles.yearText,
                  y === year && styles.yearActive,
                ]}
              >
                {y}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* MONTH NAVIGATION */}
        <View style={styles.monthHeader}>
          <Pressable
            onPress={() =>
              setMonth((m) => (m === 0 ? 11 : m - 1))
            }
          >
            <Text style={styles.arrow}>‹</Text>
          </Pressable>

          <Text style={styles.monthText}>
            {new Date(year, month).toLocaleString('default', {
              month: 'long',
            })}
          </Text>

          <Pressable
            onPress={() =>
              setMonth((m) => (m === 11 ? 0 : m + 1))
            }
          >
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        {/* CALENDAR CARD */}
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
              (d) => (
                <Text key={d} style={styles.weekText}>
                  {d}
                </Text>
              )
            )}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {Array.from({ length: totalDays }).map((_, i) =>
              renderDayCell(i + 1)
            )}
          </View>
        </View>

        {/* ITEMS THIS MONTH */}
        <Text style={styles.sectionTitle}>
          {monthEvents.length} ITEMS THIS MONTH
        </Text>

        {isLoading ? (
          <ActivityIndicator
            color={PRIMARY}
            style={{ marginTop: 20 }}
          />
        ) : monthEvents.length === 0 ? (
          <Text style={styles.emptyMonth}>
            No events this month.
          </Text>
        ) : (
          monthEvents.map((e: any) => (
            <View key={e.id} style={styles.eventCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>
                  {e.title}
                </Text>
                {e.description && (
                  <Text style={styles.eventDesc}>
                    {e.description}
                  </Text>
                )}
              </View>

              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {String(e.event_type ?? e.type ?? '').toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* BOTTOM SHEET */}
      <Modal visible={!!selectedDate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>
              {selectedDate}
            </Text>

            {selectedEvents.length === 0 ? (
              <Text style={{ color: MUTED }}>
                No events this day.
              </Text>
            ) : (
              selectedEvents.map((e: any) => (
                <View key={e.id} style={styles.sheetEvent}>
                  <Text style={styles.eventTitle}>
                    {e.title}
                  </Text>
                  {e.description && (
                    <Text style={styles.eventDesc}>
                      {e.description}
                    </Text>
                  )}
                </View>
              ))
            )}

            <Pressable
              style={styles.closeBtn}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingTop: 60 },

  header: { paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: TEXT },

  yearRow: {
    paddingHorizontal: 24,
    gap: 30,
    marginBottom: 20,
  },

  yearText: {
    color: MUTED,
    fontSize: 16,
    fontWeight: '600',
  },

  yearActive: {
    color: PRIMARY,
    fontSize: 20,
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  monthText: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
  },

  arrow: {
    fontSize: 26,
    color: MUTED,
  },

  calendarCard: {
    marginHorizontal: 20,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  weekText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 18,
  },

  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  todayBorder: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },

  selectedDay: {
    backgroundColor: PRIMARY,
  },

  dayText: {
    color: TEXT,
    fontSize: 14,
  },

  dotRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },

  sectionTitle: {
    marginTop: 30,
    marginLeft: 24,
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  emptyMonth: {
    textAlign: 'center',
    marginTop: 20,
    color: MUTED,
  },

  eventCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
  },

  eventTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
  },

  eventDesc: {
    color: MUTED,
    marginTop: 4,
    fontSize: 13,
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: PRIMARY_LIGHT,
    alignSelf: 'flex-start',
  },

  typeText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  sheetTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  sheetEvent: {
    marginBottom: 16,
  },

  closeBtn: {
    backgroundColor: PRIMARY,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
});