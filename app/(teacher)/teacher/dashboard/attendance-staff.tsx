/**
 * Teacher: My Attendance
 * Design: donut chart, stat cards (Present/Absent/Late/Leaves),
 * date range picker, daily log with check-in/out times + status badges.
 */

import { safeBack } from '@/lib/safe-back';
import { useTeacher } from '@/lib/teacher-context';
import { teacherService } from '@/services/teacher.service';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  green:       '#22C55E',
  greenLight:  '#DCFCE7',
  greenText:   '#16A34A',
  red:         '#EF4444',
  redLight:    '#FEE2E2',
  amber:       '#F59E0B',
  amberLight:  '#FEF3C7',
  purple:      '#A855F7',
  purpleLight: '#F3E8FF',
  orange:      '#F97316',
  orangeLight: '#FFEDD5',
  blue:        '#3B82F6',
  bg:          '#F8FAFC',
  surface:     '#FFFFFF',
  textDark:    '#0F172A',
  textMid:     '#64748B',
  textLight:   '#94A3B8',
  border:      '#E2E8F0',
};

type AttendanceRow = {
  date?: string;
  status?: string;
  check_in?: string;
  check_out?: string;
  note?: string;
  [k: string]: unknown;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function monthEndStr() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDayDate(dateStr?: string) {
  if (!dateStr) return { date: '—', day: '' };
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      day: d.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  } catch {
    return { date: dateStr, day: '' };
  }
}

function formatTime(timeStr?: string) {
  if (!timeStr) return null;
  try {
    // Handle both "HH:MM" and ISO strings
    const t = timeStr.includes('T') ? new Date(timeStr) : new Date(`1970-01-01T${timeStr}`);
    return t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return timeStr;
  }
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  present:   { label: 'PRESENT',   bg: C.greenLight,  text: C.greenText },
  absent:    { label: 'ABSENT',    bg: C.redLight,    text: C.red      },
  late:      { label: 'LATE',      bg: C.amberLight,  text: C.amber    },
  leave:     { label: 'LEAVE',     bg: C.purpleLight, text: C.purple   },
  half_day:  { label: 'HALF DAY', bg: C.orangeLight, text: C.orange   },
  'half day':{ label: 'HALF DAY',  bg: C.orangeLight, text: C.orange   },
  holiday:   { label: 'HOLIDAY',   bg: '#F1F5F9',     text: C.textMid  },
};

function StatusBadge({ status }: { status?: string }) {
  const key = (status ?? 'absent').toLowerCase().replace(/\s+/g, '_');
  const cfg = STATUS_CONFIG[key] ?? { label: (status ?? '—').toUpperCase(), bg: C.border, text: C.textMid };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ pct }: { pct: number }) {
  const SIZE   = 180;
  const STROKE = 14;
  const R      = (SIZE - STROKE) / 2;
  const CIRC   = 2 * Math.PI * R;
  const offset = CIRC - (pct / 100) * CIRC;

  return (
    <View style={styles.donutWrap}>
      {/* Glow bg */}
      <View style={styles.donutGlow} />
      <Svg width={SIZE} height={SIZE}>
        {/* Track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#E2E8F0"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={C.green}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      {/* Center label */}
      <View style={styles.donutCenter}>
        <Text style={styles.donutPct}>{pct.toFixed(1)}%</Text>
        <Text style={styles.donutLabel}>ATTENDANCE</Text>
      </View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Daily Log Card ───────────────────────────────────────────────────────────
function LogCard({ row }: { row: AttendanceRow }) {
  const { date, day } = formatDayDate(row.date);
  const checkIn  = formatTime(row.check_in);
  const checkOut = formatTime(row.check_out);
  const status   = (row.status ?? 'absent').toLowerCase();
  const isAbsent = status === 'absent';
  const isLeave  = status === 'leave';

  return (
    <View style={styles.logCard}>
      <View style={styles.logLeft}>
        <View style={styles.logDateRow}>
          <Text style={styles.logDate}>{date}</Text>
          <Text style={styles.logDay}> {day}</Text>
        </View>

        {isAbsent ? (
          <Text style={styles.logNoActivity}>No activity recorded</Text>
        ) : isLeave && row.note ? (
          <View style={styles.logNoteRow}>
            <Text style={styles.logNoteIcon}>💬</Text>
            <Text style={styles.logNote}>{String(row.note)}</Text>
          </View>
        ) : (checkIn || checkOut) ? (
          <View style={styles.logTimesRow}>
            {checkIn  && <Text style={styles.logTime}>→ {checkIn}</Text>}
            {checkOut && <Text style={styles.logTime}>  ⎋ {checkOut}</Text>}
          </View>
        ) : null}
      </View>

      <StatusBadge status={row.status} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TeacherMyAttendanceScreen() {
  const router = useRouter();
  const { schoolCode, teacher } = useTeacher();

  const [startDate, setStartDate] = useState(monthStartStr());
  const [endDate,   setEndDate]   = useState(monthEndStr());

  const staffRowId = teacher?.id ?? '';
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'attendance', schoolCode, staffRowId, startDate, endDate],
    queryFn: async () => {
      try {
        const res = await teacherService.getAttendance({
          school_code: schoolCode,
          teacher_id: staffRowId,
          start_date: startDate,
          end_date: endDate,
        });
        const list = Array.isArray(res.data) ? res.data : [];
        return {
          list,
          error: false,
          message: undefined as string | undefined,
        };
      } catch (err: unknown) {
        const res = err && typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response
          : undefined;
        const status = res?.status;
        const msg = err && typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : '';
        let message = 'Server may be unavailable.';
        if (status === 401) message = 'Session expired or not allowed. Sign in again.';
        else if (status === 404) message = 'Endpoint not found.';
        else if (status === 500) message = 'Server error. Please try again.';
        else if (/network|timeout|failed|econnrefused/i.test(msg)) message = 'Network error. Check connection.';
        return { list: [], error: true, message };
      }
    },
    enabled: Boolean(schoolCode && staffRowId && startDate && endDate),
    retry: false,
  });

  const payload = (data as { list?: AttendanceRow[]; error?: boolean; message?: string } | undefined) ?? { list: [], error: false, message: undefined };
  const list = (payload.list ?? []) as AttendanceRow[];
  const hadError = payload.error === true;
  const errorMessage = payload.message;

  // Sort most recent first
  const sorted = useMemo(
    () => [...list].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
    [list],
  );

  // Stats
  const stats = useMemo(() => {
    const present  = sorted.filter((r) => r.status?.toLowerCase() === 'present').length;
    const absent   = sorted.filter((r) => r.status?.toLowerCase() === 'absent').length;
    const late     = sorted.filter((r) => r.status?.toLowerCase() === 'late').length;
    const leaves   = sorted.filter((r) => ['leave', 'half_day', 'half day'].includes(r.status?.toLowerCase() ?? '')).length;
    const total    = sorted.length;
    const pct      = total > 0 ? (present / total) * 100 : 0;
    return { present, absent, late, leaves, total, pct };
  }, [sorted]);

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  // ─── Date Range Picker (simple inline, no modal dep) ──────────────────────
  // On press we just log — wire to DateTimePicker if needed
  const handleDatePress = (which: 'start' | 'end') => {
    // Placeholder: implement with @react-native-community/datetimepicker
    // For now, show a simple nudge
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => safeBack(router, '/teacher/dashboard')} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={C.green}
            colors={[C.green]}
          />
        }
      >
        {isLoading && !list.length ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={styles.loadingText}>Loading attendance…</Text>
          </View>
        ) : (
          <>
            {/* Error banner when API failed but we still render layout */}
            {hadError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  Could not load attendance. {errorMessage ?? 'Server may be unavailable.'}
                </Text>
                <Pressable onPress={handleRefresh} style={styles.errorBannerBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}

            {/* ── Donut Chart ── */}
            <View style={styles.chartSection}>
              <DonutChart pct={stats.pct} />
            </View>

            {/* ── Stat Cards ── */}
            <View style={styles.statsRow}>
              <StatCard value={stats.present} label="PRESENT" color={C.green}  />
              <StatCard value={stats.absent}  label="ABSENT"  color={C.red}    />
              <StatCard value={stats.late}    label="LATE"    color={C.amber}  />
              <StatCard value={stats.leaves}  label="LEAVES"  color={C.purple} />
            </View>

            {/* ── Date Range Row ── */}
            <View style={styles.dateRangeCard}>
              <Pressable style={styles.dateRangeBtn} onPress={() => handleDatePress('start')}>
                <Text style={styles.dateRangeIcon}>📅</Text>
                <Text style={styles.dateRangeText}>{formatDisplayDate(startDate)}</Text>
              </Pressable>

              <Text style={styles.dateRangeArrow}>→</Text>

              <Pressable style={styles.dateRangeBtn} onPress={() => handleDatePress('end')}>
                <Text style={styles.dateRangeText}>{formatDisplayDate(endDate)}</Text>
              </Pressable>
            </View>

            {/* ── Daily Log ── */}
            {sorted.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No records found</Text>
                <Text style={styles.emptySub}>{hadError ? 'Check your connection and retry.' : 'No attendance data for this date range'}</Text>
              </View>
            ) : (
              <View style={styles.logSection}>
                <View style={styles.logHeader}>
                  <Text style={styles.logHeaderTitle}>DAILY LOG</Text>
                  <Text style={styles.logHeaderRight}>Recent</Text>
                </View>

                {sorted.map((row, i) => (
                  <LogCard key={row.date ?? i} row={row} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: C.textDark,
    fontWeight: '300',
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    letterSpacing: -0.3,
  },
  headerRightSpacer: {
    width: 36,
  },

  scroll: {
    paddingBottom: 48,
  },

  centered: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.textLight,
  },
  errorIcon: { fontSize: 32 },
  errorText: {
    fontSize: 14,
    color: C.red,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.redLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: C.red,
  },
  errorBannerBtn: {
    backgroundColor: C.red,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Donut
  chartSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: C.surface,
  },
  donutWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  donutGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F0FDF4',
    shadowColor: C.green,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutPct: {
    fontSize: 30,
    fontWeight: '800',
    color: C.textDark,
    letterSpacing: -1,
  },
  donutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 0.8,
  },

  // Date range
  dateRangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateRangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRangeIcon: {
    fontSize: 15,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textDark,
  },
  dateRangeArrow: {
    fontSize: 16,
    color: C.textLight,
    marginHorizontal: 8,
  },

  // Log section
  logSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 1,
  },
  logHeaderRight: {
    fontSize: 13,
    fontWeight: '600',
    color: C.green,
  },

  // Log card
  logCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  logLeft: {
    flex: 1,
    marginRight: 12,
  },
  logDateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  logDate: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textDark,
  },
  logDay: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: '400',
  },
  logTimesRow: {
    flexDirection: 'row',
    gap: 14,
  },
  logTime: {
    fontSize: 12,
    color: C.textMid,
  },
  logNoActivity: {
    fontSize: 12,
    color: C.textLight,
    fontStyle: 'italic',
  },
  logNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logNoteIcon: {
    fontSize: 12,
  },
  logNote: {
    fontSize: 12,
    color: C.textMid,
    flex: 1,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textDark,
  },
  emptySub: {
    fontSize: 13,
    color: C.textLight,
    textAlign: 'center',
  },
});