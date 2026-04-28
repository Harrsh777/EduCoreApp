/**
 * Student Attendance: hero progress, 30-day window, daily log cards.
 * API: GET /api/attendance/student?school_code=&student_id=&start_date=&end_date=
 * All data from API; no hardcoded values.
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useStudent } from '@/lib/student-context';
import { env } from '@/lib/env';
import { getStudentByAdmissionNo } from '@/services/school.service';
import { studentService } from '@/services/student.service';

const PRIMARY = '#6D28D9';
const BG_START = '#FAF5FF';
const BG_END = '#FFFFFF';
const CARD_BG = 'rgba(255,255,255,0.85)';
const BORDER = 'rgba(0,0,0,0.06)';
const TEXT = '#1F2937';
const MUTED = '#64748B';
const RADIUS = 20;
const RADIUS_SM = 16;
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

const STATUS = {
  present: { bg: '#DCFCE7', text: '#166534' },
  absent: { bg: '#FEE2E2', text: '#B91C1C' },
  late: { bg: '#FEF3C7', text: '#B45309' },
  not_marked: { bg: '#F1F5F9', text: MUTED },
} as const;

type StatusKey = keyof typeof STATUS;

function getStatusKey(s: string): StatusKey {
  const lower = (s ?? '').toString().toLowerCase().trim();
  if (lower === 'present' || lower === 'p') return 'present';
  if (lower === 'absent' || lower === 'a') return 'absent';
  if (lower === 'late' || lower === 'l') return 'late';
  return 'not_marked';
}

/** Local date as YYYY-MM-DD (same as web so API range matches teacher-marked dates) */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 15-day window: windowIndex 0 = latest 15 days (today-14..today), 1 = previous 15, etc. */
function getDateRange(windowIndex: number): { start: string; end: string; label: string } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - windowIndex * 15);
  const start = new Date(end);
  start.setDate(start.getDate() - 14);
  const startStr = toLocalDateString(start);
  const endStr = toLocalDateString(end);
  const label = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  return { start: startStr, end: endStr, label };
}

/** Last 30 days inclusive: today-29 .. today */
function getLast30DaysRange(): { start: string; end: string; label: string } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end),
    label: `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
  };
}

/** All dates in range (YYYY-MM-DD), local iteration to match web */
function datesInRange(startStr: string, endStr: string): string[] {
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const start = new Date(sy, (sm ?? 1) - 1, sd ?? 1);
  const end = new Date(ey, (em ?? 1) - 1, ed ?? 1);
  const out: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    out.push(toLocalDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function formatDayLabel(dateStr: string): { weekday: string; date: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const d2 = new Date(y, (m ?? 1) - 1, d ?? 1);
  return {
    weekday: d2.toLocaleDateString(undefined, { weekday: 'long' }),
    date: d2.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

function getAcademicYearRange(student: { academic_start_date?: unknown; start_date?: unknown; academic_end_date?: unknown; end_date?: unknown; academic_year?: unknown } | null): { start: string; end: string } {
  const directStart = typeof student?.academic_start_date === 'string' ? student.academic_start_date : typeof student?.start_date === 'string' ? student.start_date : '';
  const directEnd = typeof student?.academic_end_date === 'string' ? student.academic_end_date : typeof student?.end_date === 'string' ? student.end_date : '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(directStart) && /^\d{4}-\d{2}-\d{2}$/.test(directEnd)) {
    return { start: directStart, end: directEnd };
  }

  const academicYear = typeof student?.academic_year === 'string' ? student.academic_year : '';
  const yearMatches = academicYear.match(/\d{4}/g) ?? [];
  if (yearMatches.length >= 2) {
    const y1 = Number(yearMatches[0]);
    const y2 = Number(yearMatches[1]);
    if (Number.isFinite(y1) && Number.isFinite(y2)) {
      return { start: `${y1}-04-01`, end: `${y2}-03-31` };
    }
  } else if (yearMatches.length === 1) {
    const y = Number(yearMatches[0]);
    if (Number.isFinite(y)) return { start: `${y}-04-01`, end: `${y + 1}-03-31` };
  }

  const now = new Date();
  const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { start: `${currentYear}-04-01`, end: `${currentYear + 1}-03-31` };
}

// ─── Reusable components ───────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: StatusKey }) {
  const { bg, text } = STATUS[status];
  const label = status === 'not_marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: text }]}>{label}</Text>
    </View>
  );
}

function AttendanceLogCard({
  dateStr,
  status,
  markedBy,
}: {
  dateStr: string;
  status: StatusKey;
  markedBy?: string;
}) {
  const { weekday, date } = formatDayLabel(dateStr);
  return (
    <View style={styles.logCard}>
      <View>
        <Text style={styles.logWeekday}>{weekday}</Text>
        <Text style={styles.logDate}>{date}</Text>
        {markedBy ? (
          <Text style={styles.logMarkedBy}>Marked by {markedBy}</Text>
        ) : null}
      </View>
      <StatusPill status={status} />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function StudentAttendanceScreen() {
  const router = useRouter();
  const { student, schoolCode } = useStudent();
  const studentId = student?.id ?? '';
  const [windowIndex, setWindowIndex] = useState(0);
  const { start, end, label } = getDateRange(windowIndex);
  const exportRange = useMemo(() => getLast30DaysRange(), []);
  const academicRange = useMemo(() => getAcademicYearRange(student), [student]);

  // Backend expects student_id = students.id (UUID). With Supabase table auth, student.id may be
  // student_login.id; resolve real student UUID by admission_no when needed.
  const canFetchAttendance = Boolean(
    schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no))
  );

  const {
    data: rawData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['student', 'attendance', schoolCode, studentId, student?.admission_no, start, end],
    queryFn: async (): Promise<unknown[]> => {
      let effectiveStudentId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveStudentId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveStudentId) return [];

      const params = {
        school_code: schoolCode,
        student_id: effectiveStudentId,
        start_date: start,
        end_date: end,
      };
      const parse = (raw: unknown): unknown[] => {
        const body = (raw as Record<string, unknown>)?.data ?? raw;
        if (Array.isArray(body)) return body;
        const list =
          (body as Record<string, unknown>)?.data ??
          (body as Record<string, unknown>)?.attendance ??
          (body as Record<string, unknown>)?.records ??
          (body as Record<string, unknown>)?.attendance_records ??
          (body as Record<string, unknown>)?.list ??
          [];
        return Array.isArray(list) ? list : [];
      };
      try {
        const r = await studentService.getAttendanceStudent(params);
        return parse(r?.data ?? r);
      } catch (e) {
        try {
          const r = await studentService.getAttendance({
            ...params,
            start_date: params.start_date,
            end_date: params.end_date,
          });
          return parse(r?.data ?? r);
        } catch {
          throw e;
        }
      }
    },
    enabled: canFetchAttendance,
    retry: 1,
  });

  const records = Array.isArray(rawData) ? rawData : [];

  const { data: exportRawData } = useQuery({
    queryKey: ['student', 'attendance', 'export-30', schoolCode, studentId, student?.admission_no, exportRange.start, exportRange.end],
    queryFn: async (): Promise<unknown[]> => {
      let effectiveStudentId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveStudentId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveStudentId) return [];

      const params = {
        school_code: schoolCode,
        student_id: effectiveStudentId,
        start_date: exportRange.start,
        end_date: exportRange.end,
      };
      const parse = (raw: unknown): unknown[] => {
        const body = (raw as Record<string, unknown>)?.data ?? raw;
        if (Array.isArray(body)) return body;
        const list =
          (body as Record<string, unknown>)?.data ??
          (body as Record<string, unknown>)?.attendance ??
          (body as Record<string, unknown>)?.records ??
          (body as Record<string, unknown>)?.attendance_records ??
          (body as Record<string, unknown>)?.list ??
          [];
        return Array.isArray(list) ? list : [];
      };
      try {
        const r = await studentService.getAttendanceStudent(params);
        return parse(r?.data ?? r);
      } catch (e) {
        try {
          const r = await studentService.getAttendance(params);
          return parse(r?.data ?? r);
        } catch {
          throw e;
        }
      }
    },
    enabled: canFetchAttendance,
    retry: 1,
    staleTime: 60 * 1000,
  });
  const exportRecords = Array.isArray(exportRawData) ? exportRawData : [];

  const { data: summaryRawData } = useQuery({
    queryKey: ['student', 'attendance', 'summary', schoolCode, studentId, student?.admission_no, academicRange.start, academicRange.end],
    queryFn: async (): Promise<unknown[]> => {
      let effectiveStudentId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveStudentId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveStudentId) return [];

      const params = {
        school_code: schoolCode,
        student_id: effectiveStudentId,
        start_date: academicRange.start,
        end_date: academicRange.end,
      };
      const parse = (raw: unknown): unknown[] => {
        const body = (raw as Record<string, unknown>)?.data ?? raw;
        if (Array.isArray(body)) return body;
        const list =
          (body as Record<string, unknown>)?.data ??
          (body as Record<string, unknown>)?.attendance ??
          (body as Record<string, unknown>)?.records ??
          (body as Record<string, unknown>)?.attendance_records ??
          (body as Record<string, unknown>)?.list ??
          [];
        return Array.isArray(list) ? list : [];
      };
      try {
        const r = await studentService.getAttendanceStudent(params);
        return parse(r?.data ?? r);
      } catch (e) {
        try {
          const r = await studentService.getAttendance(params);
          return parse(r?.data ?? r);
        } catch {
          throw e;
        }
      }
    },
    enabled: canFetchAttendance,
    retry: 1,
  });
  const summaryRecords = Array.isArray(summaryRawData) ? summaryRawData : [];

  const { byDate, byDateRecord, sortedDates } = useMemo(() => {
    const byDate: Record<string, StatusKey> = {};
    const byDateRecord: Record<string, Record<string, unknown>> = {};
    let present = 0,
      absent = 0,
      late = 0;
    const toDateStr = (v: string) => (v && v.length >= 10 ? v.slice(0, 10) : '');
    for (const row of records as { attendance_date?: string; date?: string; status?: string; marked_by?: string; marked_by_staff?: { full_name?: string }; staff?: { full_name?: string } }[]) {
      const dateStr = toDateStr(String(row.attendance_date ?? row.date ?? ''));
      if (!dateStr) continue;
      const status = getStatusKey(row.status ?? 'not_marked');
      byDate[dateStr] = status;
      byDateRecord[dateStr] = row as Record<string, unknown>;
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
    }
    const allDates = datesInRange(start, end);
    for (const d of allDates) {
      if (byDate[d] == null) byDate[d] = 'not_marked';
    }
    const sortedDates = [...allDates].sort((a, b) => b.localeCompare(a));
    return { byDate, byDateRecord, sortedDates };
  }, [records, start, end]);

  const { yearTotalMarked, yearPresent, yearAbsent, yearPercent } = useMemo(() => {
    let yearPresent = 0;
    let yearAbsent = 0;
    const seen: Record<string, boolean> = {};
    const toDateStr = (v: string) => (v && v.length >= 10 ? v.slice(0, 10) : '');
    for (const row of summaryRecords as { attendance_date?: string; date?: string; status?: string }[]) {
      const dateStr = toDateStr(String(row.attendance_date ?? row.date ?? ''));
      if (!dateStr || seen[dateStr]) continue;
      seen[dateStr] = true;
      const status = getStatusKey(row.status ?? 'not_marked');
      if (status === 'present') yearPresent++;
      else if (status === 'absent') yearAbsent++;
    }
    const yearTotalMarked = yearPresent + yearAbsent;
    const yearPercent = yearTotalMarked > 0 ? Math.round((yearPresent / yearTotalMarked) * 100) : 0;
    return {
      yearTotalMarked,
      yearPresent,
      yearAbsent,
      yearPercent,
    };
  }, [summaryRecords, academicRange.start, academicRange.end]);

  const getMarkedBy = useCallback((record: Record<string, unknown> | undefined) => {
    if (!record) return undefined;
    const staff = record.marked_by_staff as { full_name?: string } | undefined;
    const s = record.staff as { full_name?: string } | undefined;
    const name = staff?.full_name ?? s?.full_name ?? record.marked_by;
    return typeof name === 'string' ? name : undefined;
  }, []);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/student/dashboard');
  }, [router]);

  const onExport = useCallback(() => {
    if (exportRecords.length === 0) {
      Alert.alert('No data', 'No attendance records found for the previous 30 days.');
      return;
    }

    const rowsByDate: Record<string, { status: StatusKey; markedBy: string }> = {};
    for (const row of exportRecords as { attendance_date?: string; date?: string; status?: string }[]) {
      const dateStr = String(row.attendance_date ?? row.date ?? '').slice(0, 10);
      if (!dateStr) continue;
      const status = getStatusKey(String(row.status ?? 'not_marked'));
      rowsByDate[dateStr] = {
        status,
        markedBy: getMarkedBy(row as Record<string, unknown>) ?? '-',
      };
    }

    const dateKeys = datesInRange(exportRange.start, exportRange.end).sort((a, b) => b.localeCompare(a));
    const rows = dateKeys.map((dateStr) => {
      const status = rowsByDate[dateStr]?.status ?? 'not_marked';
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, (m ?? 1) - 1, d ?? 1);
      return {
        date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        day: dateObj.toLocaleDateString(undefined, { weekday: 'long' }),
        status: status === 'not_marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1),
        markedBy: rowsByDate[dateStr]?.markedBy ?? '-',
      };
    });

    const safeLabel = exportRange.label.replace(/[<>]/g, '');
    const htmlRows = rows
      .map(
        (row) => `
          <tr>
            <td>${row.date}</td>
            <td>${row.day}</td>
            <td>${row.status}</td>
            <td>${row.markedBy}</td>
          </tr>
        `
      )
      .join('');
    const html = `
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h1 { margin: 0 0 8px; }
            p { margin: 0 0 16px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <p>${safeLabel}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        Alert.alert('Popup blocked', 'Please allow popups to download PDF.');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      return;
    }

    (async () => {
      try {
        const result = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          Alert.alert('Download unavailable', 'File sharing is not available on this device.');
          return;
        }
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save attendance report',
          UTI: 'com.adobe.pdf',
        });
      } catch {
        Alert.alert('Export failed', 'Could not generate attendance PDF. Please try again.');
      }
    })();
  }, [exportRecords, exportRange, getMarkedBy]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Pressable style={styles.exportIconBtn} onPress={onExport} hitSlop={12}>
          <Ionicons name="download-outline" size={22} color={TEXT} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>View your attendance records</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={PRIMARY} />
        }
      >
        {/* Hero progress card */}
        <View style={styles.heroCard}>
          <View style={styles.progressWrap}>
            <View style={styles.progressRing}>
              <Text style={styles.progressValue}>{yearPercent}%</Text>
            </View>
            <Text style={styles.progressLabel}>ATTENDANCE</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard label="Total Marked" value={yearTotalMarked} />
            <StatCard label="Present" value={yearPresent} />
            <StatCard label="Absent" value={yearAbsent} />
          </View>
        </View>

        {/* Date range navigation */}
        <View style={styles.rangeCard}>
          <Pressable
            style={styles.rangeArrow}
            onPress={() => setWindowIndex((i) => i + 1)}
          >
            <Ionicons name="chevron-back" size={24} color={TEXT} />
          </Pressable>
          <Text style={styles.rangeLabel} numberOfLines={1}>{label}</Text>
          <Pressable
            style={[styles.rangeArrow, windowIndex === 0 && styles.rangeArrowDisabled]}
            onPress={() => windowIndex > 0 && setWindowIndex((i) => i - 1)}
          >
            <Ionicons name="chevron-forward" size={24} color={windowIndex === 0 ? MUTED : TEXT} />
          </Pressable>
        </View>
        <Text style={styles.rangeHint}>Use the arrows to jump by 15 days.</Text>
        <View style={styles.rangeBtns}>
          <Pressable style={styles.rangeBtn} onPress={() => setWindowIndex((i) => i + 1)}>
            <Text style={styles.rangeBtnText}>Back 15 days</Text>
          </Pressable>
          <Pressable
            style={[styles.rangeBtn, windowIndex === 0 && styles.rangeBtnDisabled]}
            onPress={() => windowIndex > 0 && setWindowIndex((i) => i - 1)}
          >
            <Text style={[styles.rangeBtnText, windowIndex === 0 && styles.rangeBtnTextDisabled]}>
              Next 15 days
            </Text>
          </Pressable>
        </View>

        {/* Attendance log section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attendance (Last 15 Days)</Text>
          {sortedDates.length > 0 ? (
            <Pressable onPress={onExport}>
              <Text style={styles.exportText}>Export</Text>
            </Pressable>
          ) : null}
        </View>

        {!canFetchAttendance ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Please sign in to view attendance.</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.card}>
            <ActivityIndicator size="small" color={PRIMARY} />
          </View>
        ) : isError ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              {(error as Error)?.message ?? 'Could not load attendance.'}
            </Text>
            {Platform.OS === 'web' && (
              <Text style={styles.corsHint}>
                If you see a CORS error in the console, use the app on a device or add CORS headers to your API (see docs/CORS_BACKEND_FIX.md).
              </Text>
            )}
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : sortedDates.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No attendance records found</Text>
            <Text style={styles.emptySubtext}>
              Attendance data will appear here once your class teacher marks it.
            </Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {sortedDates.map((dateStr) => (
              <AttendanceLogCard
                key={dateStr}
                dateStr={dateStr}
                status={byDate[dateStr] ?? 'not_marked'}
                markedBy={getMarkedBy(byDateRecord[dateStr])}
              />
            ))}
          </View>
        )}

        <View style={{ height: S.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_START, marginTop: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.sm,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center' },
  exportIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    paddingBottom: S.lg,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: S.lg, paddingBottom: S.xxxl },

  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: S.xxl,
    marginBottom: S.xxl,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  progressWrap: { alignItems: 'center', marginBottom: S.xxl },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  progressValue: { fontSize: 28, fontWeight: '800', color: PRIMARY },
  progressLabel: { fontSize: 12, fontWeight: '600', color: MUTED, letterSpacing: 1 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: S.sm,
  },
  statCard: {
    width: '31%',
    minWidth: 0,
    backgroundColor: BG_START,
    borderRadius: RADIUS_SM,
    paddingVertical: S.md,
    paddingHorizontal: S.sm,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: TEXT },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 4, textAlign: 'center' },

  rangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 24,
    paddingVertical: S.md,
    paddingHorizontal: S.lg,
    marginBottom: S.sm,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rangeArrow: { padding: S.sm },
  rangeArrowDisabled: { opacity: 0.6 },
  rangeLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT, textAlign: 'center' },
  rangeHint: { fontSize: 12, color: MUTED, marginBottom: S.lg },
  rangeBtns: { flexDirection: 'row', gap: S.md, marginBottom: S.xxl },
  rangeBtn: {
    flex: 1,
    paddingVertical: S.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  rangeBtnText: { fontSize: 14, fontWeight: '600', color: TEXT },
  rangeBtnDisabled: { opacity: 0.6 },
  rangeBtnTextDisabled: { color: MUTED },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  exportText: { fontSize: 14, fontWeight: '600', color: PRIMARY },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: S.xl,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: { fontSize: 15, color: MUTED },
  emptySubtext: { fontSize: 14, color: MUTED, marginTop: S.sm },
  corsHint: { fontSize: 12, color: MUTED, marginTop: S.md },
  retryBtn: {
    marginTop: S.lg,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    backgroundColor: PRIMARY,
    borderRadius: RADIUS_SM,
    alignSelf: 'center',
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  logList: { gap: S.md },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: S.xl,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logWeekday: { fontSize: 16, fontWeight: '600', color: TEXT },
  logDate: { fontSize: 14, color: MUTED, marginTop: 2 },
  logMarkedBy: { fontSize: 12, color: MUTED, marginTop: 2 },
  pill: {
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    borderRadius: 20,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
});
