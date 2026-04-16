/**
 * Teacher Dashboard Home — clean green UI.
 * Header (Welcome, Class Teacher pill, avatar) → Hero (My attendance %, All students) →
 * Quick actions (Mark Attendance, Input Grades, All Students, My Class) →
 * My Timetable (Current / Next) → Recent Submissions.
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTeacher } from '@/lib/teacher-context';
import { useAuthStore } from '@/lib/auth-store';
import { teacherService } from '@/services/teacher.service';
import { communicationService } from '@/services/communication.service';
import { calendarService } from '@/services/calendar.service';
import { leaveService } from '@/services/leave.service';
import { schoolService } from '@/services/school.service';
import { instituteService } from '@/services/institute.service';
import { timetableService } from '@/services/timetable.service';
import { diaryService } from '@/services/diary.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { Card, PrimaryButton } from '@/components/teacher';

const { colors, spacing: s, cardRadius } = teacherDashboardTheme;

/** ── My Timetable: normalize daily-agenda + fallback timetable/slots (API shapes vary) ── */
type AgendaSlot = {
  subject?: string;
  class_name?: string;
  start_time?: string;
  end_time?: string;
};

function localTodayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalizeDailyAgendaRaw(raw: unknown): Array<{ date?: string; slots?: AgendaSlot[] }> {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0];
    if (first && typeof first === 'object' && 'slots' in first) {
      return raw as Array<{ date?: string; slots?: AgendaSlot[] }>;
    }
    return [{ slots: raw as AgendaSlot[] }];
  }
  if (typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.slots)) {
    return [{ date: o.date as string | undefined, slots: o.slots as AgendaSlot[] }];
  }
  if (Array.isArray(o.data)) {
    const arr = o.data;
    if (Array.isArray(arr) && arr.length > 0) {
      const f = arr[0];
      if (f && typeof f === 'object' && 'slots' in f) return arr as Array<{ date?: string; slots?: AgendaSlot[] }>;
      return [{ slots: arr as AgendaSlot[] }];
    }
  }
  if (Array.isArray(o.agenda)) return o.agenda as Array<{ date?: string; slots?: AgendaSlot[] }>;
  const d = o.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.days)) return inner.days as Array<{ date?: string; slots?: AgendaSlot[] }>;
    if (Array.isArray(inner.agenda)) return inner.agenda as Array<{ date?: string; slots?: AgendaSlot[] }>;
    if (Array.isArray(inner.slots)) {
      return [{ date: inner.date as string | undefined, slots: inner.slots as AgendaSlot[] }];
    }
  }
  return [];
}

function pickSlotsForDate(rows: Array<{ date?: string; slots?: AgendaSlot[] }>, ymd: string): AgendaSlot[] {
  const norm = (s: string) => s.replace(/\//g, '-').slice(0, 10);
  const dated = rows.find((r) => r.date && norm(String(r.date)) === ymd);
  if (dated?.slots?.length) return dated.slots;
  const undated = rows.find((r) => Array.isArray(r.slots) && r.slots.length > 0 && !r.date);
  if (undated?.slots?.length) return undated.slots;
  const any = rows.find((r) => r.slots && r.slots.length > 0);
  return any?.slots ?? [];
}

function unwrapTimetableSlotsBody(raw: unknown): unknown[] {
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

const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function slotDayMatchesToday(slot: Record<string, unknown>, todayJsDay: number): boolean {
  const todayName = WEEKDAY_LONG[todayJsDay].toLowerCase();
  const day = slot.day ?? slot.day_name ?? slot.weekday;
  if (day != null) {
    const s = String(day).trim().toLowerCase();
    if (s === todayName || todayName.startsWith(s) || s.startsWith(todayName.slice(0, 3))) return true;
  }
  const dow = slot.day_of_week ?? slot.day_of_week_index;
  if (typeof dow === 'number') {
    if (dow === todayJsDay) return true;
    if (dow === 7 && todayJsDay === 0) return true;
    if (dow >= 1 && dow <= 7) {
      const isoToJs = dow === 7 ? 0 : dow;
      if (isoToJs === todayJsDay) return true;
    }
  }
  return false;
}

function mapTimetableRowToAgendaSlot(row: Record<string, unknown>): AgendaSlot {
  return {
    subject: (row.subject ?? row.subject_name ?? row.subject_title) as string | undefined,
    class_name: (row.class_name ?? row.class ?? row.class_title) as string | undefined,
    start_time: (row.start_time ?? row.start ?? row.slot_start) as string | undefined,
    end_time: (row.end_time ?? row.end ?? row.slot_end) as string | undefined,
  };
}

function sortAgendaSlots(slots: AgendaSlot[]): AgendaSlot[] {
  return [...slots].sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
}

function slotsFromTimetableForToday(timetableRaw: unknown): AgendaSlot[] {
  const rows = unwrapTimetableSlotsBody(timetableRaw).filter(
    (r): r is Record<string, unknown> => r != null && typeof r === 'object'
  );
  const todayJs = new Date().getDay();
  const hasDayInfo = rows.some(
    (r) =>
      r.day != null ||
      r.day_name != null ||
      r.weekday != null ||
      r.day_of_week != null ||
      r.day_of_week_index != null
  );
  const filtered = hasDayInfo ? rows.filter((r) => slotDayMatchesToday(r, todayJs)) : rows;
  return sortAgendaSlots(filtered.map(mapTimetableRowToAgendaSlot));
}

function parseTimeToMinutes(t: string): number | null {
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function pickCurrentAndNextSlot(slots: AgendaSlot[]): { current?: AgendaSlot; next?: AgendaSlot } {
  if (slots.length === 0) return {};
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const withTimes = slots.filter((s) => s.start_time && parseTimeToMinutes(s.start_time) != null);
  if (withTimes.length === 0) {
    return { current: slots[0], next: slots[1] };
  }
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const start = parseTimeToMinutes(s.start_time!);
    const end = s.end_time ? parseTimeToMinutes(s.end_time) : null;
    if (start == null) continue;
    if (end != null && nowM >= start && nowM < end) {
      return { current: s, next: slots[i + 1] };
    }
    if (end == null && nowM >= start) {
      return { current: s, next: slots[i + 1] };
    }
  }
  for (let i = 0; i < slots.length; i++) {
    const start = parseTimeToMinutes(slots[i].start_time!);
    if (start != null && start > nowM) {
      return { current: undefined, next: slots[i] };
    }
  }
  return { current: slots[slots.length - 1], next: undefined };
}

/** Compact hero stat cards */
const HERO_RING_SIZE = 72;
const HERO_RING_STROKE = 6;

function CircularProgress({
  value,
  size = HERO_RING_SIZE,
  stroke = HERO_RING_STROKE,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const display = `${Math.round(clamped)}%`;
  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderWidth: stroke }]} />
      <View style={[styles.ringCenter, { width: size, height: size }]}>
        <Text style={[styles.ringValue, size < 80 && styles.ringValueSmall]}>{display}</Text>
      </View>
    </View>
  );
}

export default function TeacherDashboardHomeScreen() {
  const router = useRouter();
  const { teacher, schoolCode, path, isClassTeacher, hasTeachingAssignments } = useTeacher();
  const profile = useAuthStore((s) => s.profile);
  const teacherId = teacher?.id ?? '';
  /** Backend staff_id query param: employee code (e.g. STF001) when available */
  const staffIdForAttendance = (teacher?.staff_id?.trim() || teacherId) || '';

  const startOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }, []);
  const endOfMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes', schoolCode, teacherId, teacher?.staff_id],
    queryFn: () =>
      teacherService
        .getClasses({
          school_code: schoolCode,
          teacher_id: teacherId,
          staff_id: teacher?.staff_id,
          array: true,
        })
        .then((r) => r.data)
        .catch(() => []),
    enabled: Boolean(schoolCode && (teacherId || teacher?.staff_id)),
  });
  const { data: staffAttData } = useQuery({
    queryKey: ['teacher', 'attendance', schoolCode, teacherId, startOfMonth, endOfMonth],
    queryFn: () =>
      teacherService
        .getAttendance({
          school_code: schoolCode,
          teacher_id: teacherId,
          start_date: startOfMonth,
          end_date: endOfMonth,
        })
        .then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: allStudentsRaw } = useQuery({
    queryKey: ['students', 'school-directory', schoolCode],
    queryFn: () => schoolService.getStudents(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: noticesData } = useQuery({
    queryKey: ['communication', 'notices', schoolCode, 'active'],
    queryFn: () =>
      communicationService.getNotices(schoolCode, { status: 'Active', limit: 50 }).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: agendaData, refetch: refetchAgenda, isRefetching } = useQuery({
    queryKey: ['teacher', 'daily-agenda', schoolCode, teacherId, teacher?.staff_id],
    queryFn: () =>
      teacherService
        .getDailyAgenda({
          school_code: schoolCode,
          teacher_id: teacherId,
          staff_id: teacher?.staff_id,
        })
        .then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: gradeDistData } = useQuery({
    queryKey: ['teacher', 'grade-distribution', schoolCode, teacherId],
    queryFn: () => teacherService.getGradeDistribution({ school_code: schoolCode, teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: todosData, refetch: refetchTodos } = useQuery({
    queryKey: ['teacher', 'todos', schoolCode, teacherId],
    queryFn: () => teacherService.getTodos({ school_code: schoolCode, teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: examsData } = useQuery({
    queryKey: ['teacher', 'exams', schoolCode, teacherId],
    queryFn: () => teacherService.getExams({ school_code: schoolCode, teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: timetableData } = useQuery({
    queryKey: ['teacher', 'timetable', schoolCode, teacherId],
    queryFn: () => timetableService.getTimetableSlots(schoolCode, { teacher_id: teacherId }).then((r) => r.data),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: calendarNotifData } = useQuery({
    queryKey: ['calendar', 'notifications', schoolCode, teacherId],
    queryFn: () => calendarService.getCalendarNotifications(schoolCode, { user_type: 'teacher', user_id: teacherId }).then((r) => (r as { data?: unknown })?.data ?? []),
    enabled: Boolean(schoolCode && teacherId),
  });
  const { data: pendingLeaveData } = useQuery({
    queryKey: ['leave', 'student-requests', 'class-teacher', schoolCode, staffIdForAttendance],
    queryFn: () =>
      leaveService.getStudentLeaveRequestsClassTeacher(schoolCode, staffIdForAttendance).then((r) => (r as { data?: unknown[] })?.data ?? []),
    enabled: Boolean(schoolCode && staffIdForAttendance && isClassTeacher),
  });
  const { data: acceptedSchoolsData } = useQuery({
    queryKey: ['institute', 'accepted-schools', schoolCode],
    queryFn: () => instituteService.getAcceptedSchools({ school_code: schoolCode }).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const { data: diaryData } = useQuery({
    queryKey: ['diary', 'teacher', schoolCode],
    queryFn: () => diaryService.getDiary(schoolCode, { limit: 10 }).then((r) => (r as { data?: unknown })?.data ?? []),
    enabled: Boolean(schoolCode),
  });

  const queryClient = useQueryClient();
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['teacher', 'classes', schoolCode, teacherId] });
    queryClient.invalidateQueries({ queryKey: ['teacher', 'attendance', schoolCode] });
    queryClient.invalidateQueries({ queryKey: ['students', 'school-directory', schoolCode] });
    queryClient.invalidateQueries({ queryKey: ['communication', 'notices', schoolCode] });
    queryClient.invalidateQueries({ queryKey: ['teacher', 'daily-agenda', schoolCode, teacherId] });
    queryClient.invalidateQueries({ queryKey: ['teacher', 'timetable', schoolCode, teacherId] });
    queryClient.invalidateQueries({ queryKey: ['teacher', 'todos', schoolCode, teacherId] });
    queryClient.invalidateQueries({ queryKey: ['teacher', 'exams', schoolCode, teacherId] });
    if (isClassTeacher) {
      queryClient.invalidateQueries({ queryKey: ['leave', 'student-requests', 'class-teacher', schoolCode, staffIdForAttendance] });
    }
    queryClient.invalidateQueries({ queryKey: ['institute', 'accepted-schools', schoolCode] });
    refetchAgenda();
  }, [queryClient, schoolCode, teacherId, staffIdForAttendance, isClassTeacher, refetchAgenda]);

  const schoolDisplayName = useMemo(() => {
    const raw = acceptedSchoolsData;
    const list = (Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? []) as Array<{
      school_code?: string;
      school_name?: string;
    }>;
    const match = list.find((r) => String(r.school_code ?? '').toLowerCase() === schoolCode.toLowerCase());
    const fromApi = match?.school_name ?? list[0]?.school_name;
    const fromProfile = typeof profile?.school_name === 'string' ? profile.school_name.trim() : '';
    if (fromApi && String(fromApi).trim()) return String(fromApi).trim();
    if (fromProfile) return fromProfile;
    return schoolCode ? schoolCode : 'School';
  }, [acceptedSchoolsData, schoolCode, profile?.school_name]);

  const displayTeacherName =
    (teacher?.full_name?.trim() ||
      (typeof profile?.full_name === 'string' ? profile.full_name.trim() : '') ||
      (typeof profile?.name === 'string' ? profile.name.trim() : '') ||
      teacher?.staff_id ||
      'Teacher') as string;
  const classesList = (Array.isArray(classesData) ? classesData : (classesData as { data?: unknown[] })?.data ?? (classesData as { classes?: unknown[] })?.classes ?? []) as { id?: string; class_name?: string; name?: string; section?: string; student_count?: number }[];
  const classTeacherLabel = useMemo(() => {
    const list = classesList;
    const first = list[0] as { class_name?: string; section?: string; academic_year?: string } | undefined;
    if (!first && !isClassTeacher) return null;
    const cls = first?.class_name ?? '';
    const sec = first?.section ?? '';
    const year = first?.academic_year ?? new Date().getFullYear();
    if (cls && sec) return `Class Teacher of ${cls}-${sec} • ${year}`;
    if (cls) return `Class Teacher of ${cls} • ${year}`;
    return `Class Teacher • ${year}`;
  }, [classesList, isClassTeacher]);

  const staffAttList = Array.isArray(staffAttData) ? staffAttData : (staffAttData as { data?: unknown[] })?.data ?? [];
  const staffAttendancePercent = useMemo(() => {
    if (staffAttList.length === 0) return 0;
    const present = staffAttList.filter((a: { status?: string }) => (a.status ?? '').toLowerCase() === 'present').length;
    return Math.round((present / staffAttList.length) * 100);
  }, [staffAttList]);
  const staffPresentCount = useMemo(
    () => staffAttList.filter((a: { status?: string }) => (a.status ?? '').toLowerCase() === 'present').length,
    [staffAttList]
  );

  const noticesList = Array.isArray(noticesData) ? noticesData : (noticesData as { data?: unknown[] })?.data ?? [];
  const noticesTop5 = noticesList.slice(0, 5);

  const allStudentsList = (
    Array.isArray(allStudentsRaw) ? allStudentsRaw : (allStudentsRaw as { data?: unknown[] })?.data ?? []
  ) as Array<{ id?: string; name?: string; admission_no?: string; class?: string; section?: string }>;
  const allStudentsCount = allStudentsList.length;
  const studentsPreview = allStudentsList.slice(0, 3);

  const examsList = Array.isArray(examsData) ? examsData : (examsData as { data?: unknown[] })?.data ?? [];
  const upcomingExamsTop3 = useMemo(() => {
    const list = examsList as Array<{ start_date?: string; end_date?: string; name?: string; status?: string }>;
    return list
      .filter((e) => (e.status ?? '').toLowerCase() !== 'completed')
      .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
      .slice(0, 3);
  }, [examsList]);
  const upcomingExamsCount = examsList.filter((e: { status?: string }) => (e.status ?? '').toLowerCase() !== 'completed').length;

  const pendingLeaveList = Array.isArray(pendingLeaveData) ? pendingLeaveData : (pendingLeaveData as unknown[] ?? []);
  const pendingLeaveCount = pendingLeaveList.length;

  const gradeDist = useMemo(() => {
    const raw = gradeDistData as { data?: { A_B?: number; C_D?: number; below_E?: number; pass_rate?: number; [k: string]: unknown }; A_B?: number; C_D?: number; below_E?: number; pass_rate?: number } | undefined;
    const d = raw?.data ?? raw ?? {};
    const aB = Number(d.A_B ?? d.a_b ?? 0);
    const cD = Number(d.C_D ?? d.c_d ?? 0);
    const belowE = Number(d.below_E ?? d.below_e ?? 0);
    const total = aB + cD + belowE || 1;
    const passRate = Number(d.pass_rate ?? 0) || Math.round(((aB + cD) / total) * 100);
    return { aB, cD, belowE, total, passRate };
  }, [gradeDistData]);

  const todosList = Array.isArray(todosData) ? todosData : (todosData as { data?: unknown[] })?.data ?? [];
  const todosTyped = todosList as Array<{ id: string; title?: string; status?: string; due_date?: string }>;
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const createTodoMutation = useMutation({
    mutationFn: (title: string) =>
      teacherService.createTodo({ school_code: schoolCode, teacher_id: teacherId, title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher', 'todos', schoolCode, teacherId] }),
  });
  const updateTodoMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      teacherService.updateTodo(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher', 'todos', schoolCode, teacherId] }),
  });
  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => teacherService.deleteTodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher', 'todos', schoolCode, teacherId] }),
  });

  const agendaRows = useMemo(() => normalizeDailyAgendaRaw(agendaData), [agendaData]);
  const slotsFromAgenda = useMemo(() => {
    const ymd = localTodayYmd();
    return sortAgendaSlots(pickSlotsForDate(agendaRows, ymd));
  }, [agendaRows]);
  const slotsFromTimetable = useMemo(() => slotsFromTimetableForToday(timetableData), [timetableData]);
  const todaySlots = useMemo(() => {
    if (slotsFromAgenda.length > 0) return slotsFromAgenda;
    return slotsFromTimetable;
  }, [slotsFromAgenda, slotsFromTimetable]);
  const { current: currentSlot, next: nextSlot } = useMemo(
    () => pickCurrentAndNextSlot(todaySlots),
    [todaySlots]
  );

  const dailyAgendaMerged = useMemo(() => {
    const slots = (todaySlots as Array<{ start_time?: string; end_time?: string; subject?: string; class_name?: string }>).map((s) => ({
      type: 'slot' as const,
      time: s.start_time ?? '',
      label: `${s.subject ?? ''} (${s.class_name ?? ''})`.trim() || 'Class',
      end: s.end_time,
    }));
    const todosWithTime = todosTyped
      .filter((t) => t.status !== 'completed')
      .map((t) => ({
        type: 'todo' as const,
        time: (t.due_date ?? '').slice(0, 16).replace('T', ' ') || '—',
        label: t.title ?? 'Todo',
        id: t.id,
      }));
    const merged = [...slots, ...todosWithTime].filter((x) => x.time !== '—');
    merged.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const rest = [...slots, ...todosWithTime].filter((x) => x.time === '—');
    return [...merged, ...rest];
  }, [todaySlots, todosTyped]);

  const formatTime = (start?: string, end?: string) => {
    if (!start && !end) return '';
    const s = start ?? '';
    const e = end ?? '';
    return [s, e].filter(Boolean).join(' - ');
  };
  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  type SubmissionItem = { id: string; title?: string; file_name?: string; student_name?: string; by?: string; submitted_at?: string };
  const recentSubmissions: SubmissionItem[] = useMemo(() => {
    const raw = diaryData as Array<{ id?: string; title?: string; attachments?: Array<{ file_name?: string }>; created_at?: string; created_by_name?: string }> | { data?: unknown } | undefined;
    const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data) ? (raw as { data: unknown[] }).data : []) as Array<{ id?: string; title?: string; attachments?: Array<{ file_name?: string }>; created_at?: string; created_by_name?: string }>;
    return list
      .slice(0, 5)
      .filter((e) => e.id != null)
      .map((e) => ({
        id: String(e.id),
        title: e.title,
        file_name: e.attachments?.[0]?.file_name,
        student_name: e.created_by_name,
        by: e.created_by_name,
        submitted_at: e.created_at,
      }));
  }, [diaryData]);

  const todayFormatted = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    []
  );
  const calendarNotifs = (Array.isArray(calendarNotifData) ? calendarNotifData : []) as { read?: boolean }[];
  const unreadNotifCount = calendarNotifs.filter((n) => !n.read).length;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={!!isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header: school row → avatar + welcome / name / date (no overlap) */}
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <View style={styles.headerTopRow}>
              <Text style={styles.schoolName} numberOfLines={2}>
                {schoolDisplayName}
              </Text>
              <Pressable style={styles.bellWrap} onPress={() => router.push(path('communication') as never)}>
                <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                {unreadNotifCount > 0 ? (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
            <View style={styles.headerBodyRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(displayTeacherName || 'T').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.welcomeSmall}>Welcome 👋</Text>
                <Text style={styles.teacherName} numberOfLines={2}>
                  {displayTeacherName}
                </Text>
                <Text style={styles.headerDate}>{todayFormatted}</Text>
                {classTeacherLabel ? (
                  <View style={[styles.pill, styles.pillBelowDate]}>
                    <Text style={styles.pillText}>{classTeacherLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Assigned Class Card (class teacher only) */}
        {isClassTeacher && classesList.length > 0 && (() => {
          const first = classesList[0] as { id?: string; name?: string; class_name?: string; section?: string; student_count?: number };
          const clsName = first?.class_name ?? first?.name ?? 'Class';
          const sec = first?.section ?? '';
          const count = first?.student_count ?? 0;
          return (
            <Card style={styles.assignedClassCard} padding="sm">
              <View style={styles.assignedClassRow}>
                <View style={styles.assignedClassLeft}>
                  <Text style={styles.assignedClassLabel}>Assigned Class</Text>
                  <View style={styles.assignedClassMetaRow}>
                    <Text style={styles.assignedClassValue}>
                      {clsName}
                      {sec ? ` • ${sec}` : ''}
                    </Text>
                    {count > 0 ? (
                      <Text style={styles.assignedClassCount}>{count} students</Text>
                    ) : null}
                  </View>
                </View>
                <PrimaryButton title="My Class" onPress={() => router.push(path('my-class') as never)} />
              </View>
            </Card>
          );
        })()}

        {/* Summary: My attendance + All students */}
        <View style={styles.heroRow}>
          <Pressable style={styles.heroCard} onPress={() => router.push(path('attendance-staff') as never)}>
            <CircularProgress value={staffAttendancePercent} />
            <Text style={styles.heroLabel}>MY ATTENDANCE</Text>
            <Text style={styles.heroSubtext} numberOfLines={2}>
              {staffAttList.length > 0
                ? `${staffPresentCount}/${staffAttList.length} this month`
                : 'No records this range'}
            </Text>
          </Pressable>
          <Pressable style={styles.heroCard} onPress={() => router.push(path('students') as never)}>
            <View style={styles.noticeIconWrap}>
              <Ionicons name="people-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.heroNumber}>{allStudentsCount}</Text>
            <Text style={styles.heroLabel}>ALL STUDENTS</Text>
            <Text style={styles.heroSubtext} numberOfLines={2}>
              {studentsPreview.length > 0
                ? studentsPreview.map((s) => s.name ?? s.admission_no ?? '—').join(' · ')
                : schoolCode
                  ? 'Tap to open directory'
                  : '—'}
            </Text>
          </Pressable>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.quickRow}>
          {isClassTeacher ? (
            <Pressable style={styles.quickBtn} onPress={() => router.push(path('attendance') as never)}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="person-add" size={26} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>Attendance</Text>
            </Pressable>
          ) : null}
          {isClassTeacher || hasTeachingAssignments ? (
            <Pressable style={styles.quickBtn} onPress={() => router.push(path('marks') as never)}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="create-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>Input Grades</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.quickBtn} onPress={() => router.push(path('students') as never)}>
            <View style={styles.quickIconWrap}>
              <Ionicons name="people-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Students</Text>
          </Pressable>
          {isClassTeacher ? (
            <Pressable style={styles.quickBtn} onPress={() => router.push(path('my-class') as never)}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="school-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>My Class</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>UPCOMING EXAMS</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Text style={styles.summaryCount}>{upcomingExamsCount}</Text>
          </View>
          {upcomingExamsTop3.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming exams</Text>
          ) : (
            <>
              {upcomingExamsTop3.map((exam: { id?: string; name?: string; start_date?: string }, i: number) => (
                <View key={exam.id ?? i} style={styles.summaryRow}>
                  <Text style={styles.summaryRowText} numberOfLines={1}>{exam.name ?? 'Exam'}</Text>
                  <Text style={styles.summaryRowMeta}>{exam.start_date ?? '—'}</Text>
                </View>
              ))}
              <View style={styles.summaryCardBtnWrap}><PrimaryButton title="Examinations" onPress={() => router.push(path('examinations') as never)} /></View>
            </>
          )}
        </Card>

        {/* NOTICES */}
        <Text style={styles.sectionLabel}>NOTICES</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Notices</Text>
            <Pressable onPress={() => router.push(path('communication') as never)}>
              <Text style={styles.viewFull}>View All</Text>
            </Pressable>
          </View>
          {noticesTop5.length === 0 ? (
            <Text style={styles.emptyText}>No notices</Text>
          ) : (
            <>
              {noticesTop5.map((n: { id?: string; title?: string; created_at?: string }, i: number) => (
                <View key={n.id ?? i} style={styles.summaryRow}>
                  <Text style={styles.summaryRowText} numberOfLines={1}>{n.title ?? 'Notice'}</Text>
                  <Text style={styles.summaryRowMeta}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : '—'}</Text>
                </View>
              ))}
              <View style={styles.summaryCardBtnWrap}><PrimaryButton title="Communication" onPress={() => router.push(path('communication') as never)} /></View>
            </>
          )}
        </Card>

        {/* MY TIMETABLE */}
        <Text style={styles.sectionLabel}>MY TIMETABLE</Text>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Today</Text>
            <Pressable onPress={() => router.push(path('my-timetable') as never)}>
              <Text style={styles.viewFull}>View Full</Text>
            </Pressable>
          </View>
          <View style={styles.timetableRow}>
            {currentSlot ? (
              <View style={[styles.timetableCard, styles.timetableCurrent]}>
                <View style={styles.timetableBar} />
                <Text style={styles.timetableTag}>CURRENT</Text>
                <Text style={styles.timetableSubject}>
                  {currentSlot.subject ?? '—'} ({currentSlot.class_name ?? '—'})
                </Text>
                <Text style={styles.timetableTime}>
                  {formatTime(currentSlot.start_time, currentSlot.end_time) || '—'}
                </Text>
              </View>
            ) : (
              <View style={[styles.timetableCard, styles.timetableCurrent]}>
                <View style={styles.timetableBar} />
                <Text style={styles.timetableTag}>CURRENT</Text>
                <Text style={styles.timetableSubject}>No class in session</Text>
                <Text style={styles.timetableTime}>—</Text>
              </View>
            )}
            {nextSlot ? (
              <View style={styles.timetableCard}>
                <View style={[styles.timetableBar, styles.timetableBarNext]} />
                <Text style={styles.timetableTagNext}>NEXT</Text>
                <Text style={styles.timetableSubject}>
                  {nextSlot.subject ?? '—'} ({nextSlot.class_name ?? '—'})
                </Text>
                <Text style={styles.timetableTime}>
                  {formatTime(nextSlot.start_time, nextSlot.end_time) || '—'}
                </Text>
              </View>
            ) : (
              <View style={styles.timetableCard}>
                <View style={[styles.timetableBar, styles.timetableBarNext]} />
                <Text style={styles.timetableTagNext}>NEXT</Text>
                <Text style={styles.timetableSubject}>No upcoming class</Text>
                <Text style={styles.timetableTime}>—</Text>
              </View>
            )}
          </View>
        </View>

        {/* RECENT SUBMISSIONS */}
        <Text style={styles.submissionSectionLabel}>RECENT SUBMISSIONS</Text>
        <View style={styles.submissionSection}>
          <View style={styles.submissionHead}>
            <Text style={styles.submissionHeadTitle}>Submissions</Text>
            <Pressable onPress={() => router.push(path('homework') as never)}>
              <Text style={styles.submissionHeadLink}>Grade All</Text>
            </Pressable>
          </View>
          <View style={styles.submissionList}>
            {recentSubmissions.length === 0 ? (
              <View style={styles.submissionEmpty}>
                <Ionicons name="checkmark-circle-outline" size={32} color={colors.textMuted} />
                <Text style={styles.submissionEmptyText}>No submissions yet</Text>
              </View>
            ) : (
              recentSubmissions.slice(0, 5).map((sub) => (
                <View key={sub.id} style={styles.submissionCard}>
                  <View style={[styles.submissionIcon, (sub.file_name ?? '').toLowerCase().endsWith('.pdf') ? styles.submissionIconPdf : styles.submissionIconDoc]}>
                    <Ionicons name="document-text" size={18} color="#fff" />
                  </View>
                  <View style={styles.submissionBody}>
                    <Text style={styles.submissionTitle} numberOfLines={1}>
                      {sub.title ?? sub.file_name ?? 'Submission'}
                    </Text>
                    <Text style={styles.submissionMeta} numberOfLines={1}>
                      {sub.student_name ?? sub.by ?? '—'} • {sub.submitted_at ? formatTimeAgo(sub.submitted_at) : '—'}
                    </Text>
                  </View>
                  <Pressable style={styles.gradeBtn} onPress={() => router.push(path('homework') as never)}>
                    <Text style={styles.gradeBtnText}>Grade</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

        {/* GRADE DISTRIBUTION */}
        <Text style={styles.sectionLabel}>GRADE DISTRIBUTION</Text>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Distribution</Text>
          <View style={styles.gradeBars}>
            <View style={styles.gradeBarRow}>
              <Text style={styles.gradeBarLabel}>A–B</Text>
              <View style={[styles.gradeBarBg, styles.gradeBarFillGreen]}><View style={[styles.gradeBarFill, { width: `${(gradeDist.aB / gradeDist.total) * 100}%` }]} /></View>
              <Text style={styles.gradeBarValue}>{gradeDist.aB}</Text>
            </View>
            <View style={styles.gradeBarRow}>
              <Text style={styles.gradeBarLabel}>C–D</Text>
              <View style={[styles.gradeBarBg, styles.gradeBarFillLight]}><View style={[styles.gradeBarFill, styles.gradeBarFillMid, { width: `${(gradeDist.cD / gradeDist.total) * 100}%` }]} /></View>
              <Text style={styles.gradeBarValue}>{gradeDist.cD}</Text>
            </View>
            <View style={styles.gradeBarRow}>
              <Text style={styles.gradeBarLabel}>Below E</Text>
              <View style={[styles.gradeBarBg]}><View style={[styles.gradeBarFill, styles.gradeBarFillRed, { width: `${(gradeDist.belowE / gradeDist.total) * 100}%` }]} /></View>
              <Text style={styles.gradeBarValue}>{gradeDist.belowE}</Text>
            </View>
          </View>
          <Text style={styles.passRateText}>Pass rate: {gradeDist.passRate}%</Text>
        </Card>

        {/* TODOS */}
        <Text style={styles.sectionLabel}>TODOS</Text>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Todos</Text>
            <Text style={styles.viewFull}>+ Add</Text>
          </View>
          <View style={styles.todoInputRow}>
            <TextInput
              style={styles.todoInput}
              placeholder="Add a todo..."
              placeholderTextColor={colors.textMuted}
              value={newTodoTitle}
              onChangeText={setNewTodoTitle}
              onSubmitEditing={() => {
                if (newTodoTitle.trim()) {
                  createTodoMutation.mutate(newTodoTitle.trim());
                  setNewTodoTitle('');
                }
              }}
            />
            <Pressable
              style={styles.todoAddBtn}
              onPress={() => {
                if (newTodoTitle.trim()) {
                  createTodoMutation.mutate(newTodoTitle.trim());
                  setNewTodoTitle('');
                }
              }}
              disabled={createTodoMutation.isPending}
            >
              {createTodoMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.todoAddBtnText}>Add</Text>}
            </Pressable>
          </View>
          <View style={styles.todoList}>
            {todosTyped.map((todo) => (
              <View key={todo.id} style={styles.todoRow}>
                <Pressable onPress={() => updateTodoMutation.mutate({ id: todo.id, status: todo.status === 'completed' ? 'pending' : 'completed' })} style={styles.todoCheckWrap}>
                  <View style={[styles.todoCheck, todo.status === 'completed' && styles.todoCheckDone]}>
                    {todo.status === 'completed' && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
                <Text style={[styles.todoTitle, todo.status === 'completed' && styles.todoTitleDone]} numberOfLines={1}>{todo.title ?? ''}</Text>
                <Pressable onPress={() => deleteTodoMutation.mutate(todo.id)} style={styles.todoDeleteWrap}>
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
          {todosTyped.length === 0 && <Text style={styles.emptyText}>No todos yet</Text>}
        </View>

        {/* Pending Student Leave (class teacher only) */}
        {isClassTeacher && pendingLeaveCount > 0 && (
          <Card style={styles.pendingLeaveCard}>
            <View style={styles.pendingLeaveRow}>
              <View>
                <Text style={styles.pendingLeaveLabel}>Pending Student Leave</Text>
                <Text style={styles.pendingLeaveCount}>{pendingLeaveCount} request{pendingLeaveCount !== 1 ? 's' : ''}</Text>
              </View>
              <PrimaryButton title="Student Leave Approvals" onPress={() => router.push(path('student-leave-approvals') as never)} />
            </View>
          </Card>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundStart },
  scroll: { flex: 1 },
  content: { padding: s.lg, paddingBottom: s['3xl'] },

  header: {
    marginBottom: s.md,
    paddingVertical: s.xs,
  },
  headerMain: { width: '100%' },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: s.sm,
    marginBottom: s.sm,
  },
  schoolName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    paddingRight: s.xs,
  },
  headerBodyRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: s.sm,
  },
  headerTextCol: {
    width: '100%',
    alignItems: 'center',
    minWidth: 0,
  },
  welcomeSmall: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 2,
    textAlign: 'center',
  },
  teacherName: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  headerDate: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
    textAlign: 'center',
  },
  pillBelowDate: { marginTop: s.xs, alignSelf: 'center' },
  bellWrap: { position: 'relative', padding: s.sm, marginTop: -4 },
  bellBadge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bellBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  pill: {
    alignSelf: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: s.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22, 101, 52, 0.12)',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  avatarDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },

  heroRow: { flexDirection: 'row', gap: s.sm, marginBottom: s.lg },
  heroCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: s.sm,
    paddingHorizontal: s.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 0,
  },
  ringWrap: { position: 'relative', marginBottom: 4 },
  ringBg: { position: 'absolute', borderColor: colors.border },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  ringValueSmall: { fontSize: 15 },
  noticeIconWrap: { marginBottom: 4 },
  heroNumber: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 0 },
  heroLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2, marginTop: 2 },
  heroSubtext: { fontSize: 10, color: colors.textMuted, marginTop: 2, marginBottom: 0, textAlign: 'center', lineHeight: 14 },
  heroCardBtnWrap: { marginTop: s.sm, alignSelf: 'stretch' },

  summaryCard: { marginBottom: s.lg },
  summaryCount: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  summaryCardBtnWrap: { marginTop: s.md },
  emptyText: { ...textStyles.caption, color: colors.textMuted, marginVertical: s.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryRowText: { ...textStyles.body, color: colors.textPrimary, flex: 1, marginRight: s.sm },
  summaryRowMeta: { ...textStyles.caption, color: colors.textMuted },

  gradeBars: { marginTop: s.sm, gap: s.sm },
  gradeBarRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  gradeBarLabel: { width: 56, fontSize: 12, color: colors.textMuted },
  gradeBarBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  gradeBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  gradeBarFillGreen: {},
  gradeBarFillLight: { backgroundColor: colors.primaryLight },
  gradeBarFillMid: { backgroundColor: colors.primary },
  gradeBarFillRed: { backgroundColor: '#DC2626' },
  gradeBarValue: { width: 28, fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  passRateText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: s.sm },

  agendaList: { marginTop: s.sm, gap: 4 },
  agendaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: s.sm, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: colors.border },
  agendaTime: { fontSize: 12, color: colors.textMuted, marginRight: s.sm, minWidth: 64 },
  agendaLabel: { flex: 1, ...textStyles.body, color: colors.textPrimary },
  agendaTodoBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  agendaTodoBadgeText: { fontSize: 10, fontWeight: '600', color: colors.primary },

  todoInputRow: { flexDirection: 'row', gap: s.sm, marginBottom: s.md },
  todoInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: s.md, paddingVertical: s.sm, fontSize: 14, color: colors.textPrimary },
  todoAddBtn: { backgroundColor: colors.primary, paddingHorizontal: s.lg, borderRadius: 9999, justifyContent: 'center', minWidth: 56 },
  todoAddBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  todoList: { gap: 4 },
  todoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: s.sm, paddingHorizontal: s.sm, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  todoCheckWrap: { marginRight: s.sm },
  todoCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  todoCheckDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  todoTitle: { flex: 1, ...textStyles.body, color: colors.textPrimary },
  todoTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  todoDeleteWrap: { padding: 4 },

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.md,
    marginBottom: s.xl,
  },
  quickBtn: { alignItems: 'center', width: '22%', minWidth: 72 },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.sm,
  },
  quickLabel: { fontSize: 10, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },

  section: { marginBottom: s.xl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s.md,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: s.sm },
  viewFull: { fontSize: 14, fontWeight: '600', color: colors.primary },
  activePill: { backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  activePillText: { fontSize: 10, fontWeight: '600', color: colors.primary },

  timetableRow: { flexDirection: 'row', gap: s.md },
  timetableCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    padding: s.lg,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  timetableCurrent: {},
  timetableBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  timetableBarNext: { backgroundColor: colors.border },
  timetableTag: { fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  timetableTagNext: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  timetableSubject: { ...textStyles.body, fontWeight: '600', color: colors.textPrimary },
  timetableTime: { ...textStyles.caption, color: colors.textSecondary, marginTop: 2 },

  submissionSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: s.xs,
  },
  submissionSection: { marginBottom: s.lg },
  submissionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s.sm,
  },
  submissionHeadTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  submissionHeadLink: { fontSize: 12, fontWeight: '600', color: colors.primary },
  submissionList: { gap: s.sm },
  submissionEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: s.lg, gap: s.xs },
  submissionEmptyText: { ...textStyles.caption, fontSize: 12, color: colors.textMuted },
  submissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: s.sm,
    paddingHorizontal: s.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: s.sm,
  },
  submissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submissionIconPdf: { backgroundColor: '#DC2626' },
  submissionIconDoc: { backgroundColor: '#2563EB' },
  submissionBody: { flex: 1, minWidth: 0 },
  submissionTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 18 },
  submissionMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1, lineHeight: 14 },
  gradeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: s.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradeBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  assignedClassCard: {
    marginBottom: 12,
  },
  assignedClassRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s.sm },
  assignedClassLeft: { flex: 1, minWidth: 0 },
  assignedClassMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: s.sm,
  },
  assignedClassLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  assignedClassValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  assignedClassCount: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },

  pendingLeaveCard: { marginBottom: 12 },
  pendingLeaveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pendingLeaveLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  pendingLeaveCount: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  bottomPad: { height: 80 },
});
