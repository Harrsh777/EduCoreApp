/**
 * Student Dashboard Home — premium light layout.
 * Header → Hero (attendance + stacked cards) → Notices → Academics grid → Fees & Transport → Requests → Communication → Media → Account.
 * No duplicate stats. Container pattern; animation only on native (no transform).
 */

import { useRouter, useNavigation } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useStudent } from '@/lib/student-context';
import { env } from '@/lib/env';
import { getStudentByAdmissionNo } from '@/services/school.service';
import {
  countActiveReceipts,
  getDashboardHomeStats,
  invalidateDashboardCache,
  sumFeesDueInMonthAndQuarter,
} from '@/services/student-dashboard.service';
import { communicationService } from '@/services/communication.service';
import { studentService } from '@/services/student.service';
import {
  DashboardHeader,
  SectionCard,
  ModuleButton,
  LoadingSkeleton,
  DashboardHomeGrid,
  HomeListCard,
  type HomeListItem,
} from '@/components/student-dashboard';
import { useStudentClassTeacherCard } from '@/hooks/useStudentClassTeacherCard';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { STUDENT_DASHBOARD_SECTIONS } from '@/constants/studentDashboardMenu';

const { colors, screenRootWeb, spacing: s } = studentDashboardTheme;

const useAnimation = Platform.OS === 'ios' || Platform.OS === 'android';
const Container = useAnimation ? Animated.View : View;

/** Pick display name from API student record (DB may use full_name, name, or student_name). */
function studentDisplayName(record: Record<string, unknown> | null | undefined): string {
  if (!record || typeof record !== 'object') return 'Student';
  const firstName = typeof record.first_name === 'string' ? record.first_name.trim() : '';
  const lastName = typeof record.last_name === 'string' ? record.last_name.trim() : '';
  const name =
    (record.full_name as string) ?? (record.name as string) ?? (record.student_name as string);
  if (typeof name === 'string' && name.trim()) return name.trim();
  if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ');
  return 'Student';
}

export default function StudentDashboardHomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { student, schoolCode, path } = useStudent();
  const studentId = student?.id ?? '';

  const { data: studentProfile } = useQuery({
    queryKey: ['student', 'profile', schoolCode, studentId],
    queryFn: async (): Promise<Record<string, unknown> | null> => {
      const r = await studentService.getById(studentId, schoolCode);
      const raw = r.data?.data ?? r.data ?? r;
      return (raw ?? null) as Record<string, unknown> | null;
    },
    enabled: Boolean(schoolCode && studentId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: studentByAdmission } = useQuery({
    queryKey: ['student', 'by-admission', schoolCode, student?.admission_no],
    queryFn: async (): Promise<Record<string, unknown> | null> => {
      const r = await getStudentByAdmissionNo(schoolCode, student!.admission_no!);
      const row = (r as { data?: Record<string, unknown> })?.data;
      return (row ?? null) as Record<string, unknown> | null;
    },
    enabled: Boolean(env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no),
    staleTime: 5 * 60 * 1000,
  });

  const nameFromApi = studentProfile
    ? studentDisplayName(studentProfile as Record<string, unknown>)
    : 'Student';
  const nameFromAdmission = studentByAdmission
    ? studentDisplayName(studentByAdmission as Record<string, unknown>)
    : 'Student';
  const nameFromContext =
    student?.full_name ??
    (student as { name?: string; student_name?: string; first_name?: string; last_name?: string })?.name ??
    (student as { student_name?: string })?.student_name ??
    ([
      (student as { first_name?: string })?.first_name,
      (student as { last_name?: string })?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
      'Student');
  const fullName =
    nameFromApi !== 'Student'
      ? nameFromApi
      : nameFromAdmission !== 'Student'
        ? nameFromAdmission
        : nameFromContext;
  const canFetchAttendance = Boolean(schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no)));
  const canFetchHomeExtras = Boolean(
    schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no))
  );

  const {
    data: stats,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['student-dashboard-home', schoolCode, studentId],
    queryFn: () => getDashboardHomeStats({ school_code: schoolCode, student_id: studentId }),
    enabled: Boolean(schoolCode && studentId),
    staleTime: 60 * 1000,
  });

  const { data: noticesData, refetch: refetchNotices } = useQuery({
    queryKey: ['student-home-notices', schoolCode],
    queryFn: async (): Promise<unknown> => {
      const r = await communicationService.getNotices(schoolCode, { limit: 5, status: 'Active' });
      return (r as { data?: unknown }).data ?? r;
    },
    enabled: Boolean(schoolCode),
    staleTime: 60 * 1000,
  });

  const { data: upcomingData, refetch: refetchUpcoming } = useQuery({
    queryKey: ['student-home-upcoming', schoolCode, studentId],
    queryFn: async (): Promise<unknown> => {
      const r = await studentService.getUpcomingItems({ school_code: schoolCode, student_id: studentId, limit: 5 });
      return (r as { data?: unknown }).data ?? r;
    },
    enabled: Boolean(schoolCode && studentId),
    staleTime: 60 * 1000,
  });

  const classTeacherCard = useStudentClassTeacherCard();

  async function resolveEffectiveStudentId(): Promise<string> {
    let effectiveId = studentId;
    if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
      try {
        const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
        const row = (r as { data?: { id?: string } })?.data;
        if (row?.id) effectiveId = String(row.id);
      } catch {
        // keep studentId
      }
    }
    return effectiveId;
  }

  const { data: homeFeesRaw, refetch: refetchHomeFees, isLoading: loadingHomeFees } = useQuery({
    queryKey: ['student', 'home', 'fees', schoolCode, studentId, student?.admission_no],
    queryFn: async () => {
      const effectiveId = await resolveEffectiveStudentId();
      if (!effectiveId) return [];
      const r = await studentService.getFees({ school_code: schoolCode, student_id: effectiveId });
      const body = (r as { data?: unknown })?.data ?? r;
      const list = Array.isArray(body) ? body : (body as { data?: unknown[] })?.data ?? (body as { fees?: unknown[] })?.fees ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: canFetchHomeExtras,
    staleTime: 60 * 1000,
  });

  const { data: homeReceiptsRaw, refetch: refetchHomeReceipts, isLoading: loadingHomeReceipts } = useQuery({
    queryKey: ['student', 'home', 'fees', 'receipts', schoolCode, studentId, student?.admission_no],
    queryFn: async () => {
      const effectiveId = await resolveEffectiveStudentId();
      if (!effectiveId) return [];
      const r = await studentService.getFeeReceipts({ school_code: schoolCode, student_id: effectiveId });
      const body = (r as { data?: unknown })?.data ?? r;
      const list = Array.isArray(body) ? body : (body as { data?: unknown[] })?.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: canFetchHomeExtras,
    staleTime: 60 * 1000,
  });

  type TransportHomePayload = {
    has_transport?: boolean;
    route?: string | { name?: string };
    route_name?: string;
  };

  const { data: homeTransportRaw, refetch: refetchHomeTransport, isLoading: loadingHomeTransport } = useQuery({
    queryKey: ['student', 'home', 'transport', schoolCode, studentId, student?.admission_no],
    queryFn: async (): Promise<TransportHomePayload> => {
      const effectiveId = await resolveEffectiveStudentId();
      if (!effectiveId) return { has_transport: false };
      const r = await studentService.getTransport({ school_code: schoolCode, student_id: effectiveId });
      const api = (r as { data?: { data?: TransportHomePayload; has_transport?: boolean } }).data;
      const payload = api?.data ?? api ?? (r as unknown as TransportHomePayload);
      return (payload ?? { has_transport: false }) as TransportHomePayload;
    },
    enabled: canFetchHomeExtras,
    staleTime: 60 * 1000,
  });

  const { monthTotal: feesMonthTotal, quarterTotal: feesQuarterTotal } = useMemo(
    () => sumFeesDueInMonthAndQuarter(Array.isArray(homeFeesRaw) ? homeFeesRaw : [], new Date()),
    [homeFeesRaw]
  );

  const receiptCount = useMemo(
    () => countActiveReceipts(Array.isArray(homeReceiptsRaw) ? homeReceiptsRaw : []),
    [homeReceiptsRaw]
  );

  const { transportRouteLabel, transportAssigned } = useMemo(() => {
    const info = homeTransportRaw ?? {};
    const hasTransport =
      info.has_transport === true ||
      Boolean(info.route || info.route_name || (info as { stops?: unknown[] }).stops);
    if (!hasTransport) return { transportRouteLabel: 'No transport assigned', transportAssigned: false };
    const r = info.route ?? info.route_name;
    if (typeof r === 'string' && r.trim()) return { transportRouteLabel: r.trim(), transportAssigned: true };
    if (r && typeof r === 'object' && typeof (r as { name?: string }).name === 'string') {
      const n = (r as { name: string }).name.trim();
      if (n) return { transportRouteLabel: n, transportAssigned: true };
    }
    if (typeof info.route_name === 'string' && info.route_name.trim()) {
      return { transportRouteLabel: info.route_name.trim(), transportAssigned: true };
    }
    return { transportRouteLabel: 'Route', transportAssigned: true };
  }, [homeTransportRaw]);

  const { data: attendanceData, refetch: refetchAttendance } = useQuery({
    queryKey: ['student', 'attendance', 'overall', schoolCode, studentId, student?.admission_no],
    queryFn: async (): Promise<unknown[]> => {
      let effectiveId = studentId;
      if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
        try {
          const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
          const row = (r as { data?: { id?: string } })?.data;
          if (row?.id) effectiveId = String(row.id);
        } catch {
          // keep studentId
        }
      }
      if (!effectiveId) return [];
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 365);
      const toYmd = (d: Date) => d.toISOString().slice(0, 10);
      const params = {
        school_code: schoolCode,
        student_id: effectiveId,
        start_date: toYmd(start),
        end_date: toYmd(end),
      };
      const parse = (raw: unknown): unknown[] => {
        const body = (raw as Record<string, unknown>)?.data ?? raw;
        if (Array.isArray(body)) return body;
        const list =
          (body as Record<string, unknown>)?.data ??
          (body as Record<string, unknown>)?.attendance ??
          (body as Record<string, unknown>)?.records ??
          [];
        return Array.isArray(list) ? list : [];
      };
      try {
        const r = await studentService.getAttendanceStudent(params);
        return parse((r as { data?: unknown })?.data ?? r);
      } catch {
        try {
          const r = await studentService.getAttendance({ ...params, start_date: params.start_date, end_date: params.end_date });
          return parse((r as { data?: unknown })?.data ?? r);
        } catch {
          return [];
        }
      }
    },
    enabled: canFetchAttendance,
    staleTime: 60 * 1000,
  });

  const overallAttendancePercent = useMemo(() => {
    const records = Array.isArray(attendanceData) ? attendanceData : [];
    let present = 0,
      absent = 0,
      late = 0;
    const status = (s: string) => {
      const lower = String(s ?? '').toLowerCase().trim();
      if (lower === 'present' || lower === 'p') return 'present';
      if (lower === 'absent' || lower === 'a') return 'absent';
      if (lower === 'late' || lower === 'l') return 'late';
      return null;
    };
    for (const row of records as { attendance_date?: string; date?: string; status?: string }[]) {
      const dateStr = String(row.attendance_date ?? row.date ?? '').slice(0, 10);
      if (!dateStr) continue;
      const st = status(row.status ?? '');
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
    }
    const marked = present + absent + late;
    if (marked === 0) return undefined;
    return Math.round((present / marked) * 100);
  }, [attendanceData]);

  const listItems = useMemo((): HomeListItem[] => {
    const noticesRaw = noticesData && typeof noticesData === 'object' && 'data' in noticesData ? (noticesData as { data?: unknown }).data : noticesData;
    const upcomingRaw = upcomingData && typeof upcomingData === 'object' && 'data' in upcomingData ? (upcomingData as { data?: unknown }).data : upcomingData;
    const notices = noticesRaw as Array<{ id: string; title?: string; category?: string | { id?: string; name?: string; color?: string }; publish_at?: string }> | undefined;
    const upcoming = upcomingRaw as Array<{ id: string; title?: string; subtitle?: string; month?: string; day?: string }> | undefined;
    const categoryName = (c: string | { id?: string; name?: string; color?: string } | undefined): string =>
      typeof c === 'string' ? c : c && typeof c === 'object' && typeof (c as { name?: string }).name === 'string' ? (c as { name: string }).name : '';
    const fromNotices: HomeListItem[] = Array.isArray(notices)
      ? notices.map((n) => {
          const catStr = categoryName(n.category);
          return {
            id: `notice-${n.id}`,
            title: n.title ?? 'Notice',
            subtitle: catStr || (typeof n.publish_at === 'string' ? n.publish_at : ''),
            type: 'notice' as const,
            tag: (catStr === 'Holiday' ? 'Holiday' : catStr === 'Urgent' ? 'Urgent' : catStr ? 'Event' : undefined) as 'Holiday' | 'Event' | 'Urgent' | undefined,
          };
        })
      : [];
    const fromUpcoming: HomeListItem[] = Array.isArray(upcoming)
      ? upcoming.map((u) => ({
          id: `upcoming-${u.id}`,
          title: u.title ?? 'Upcoming',
          subtitle: u.subtitle ?? (u.month && u.day ? `${u.month}/${u.day}` : ''),
          type: 'upcoming' as const,
        }))
      : [];
    return [...fromUpcoming, ...fromNotices].slice(0, 5);
  }, [noticesData, upcomingData]);

  const onRefresh = useCallback(() => {
    invalidateDashboardCache();
    refetch();
    refetchNotices();
    refetchUpcoming();
    refetchAttendance();
    refetchHomeFees();
    refetchHomeReceipts();
    refetchHomeTransport();
  }, [
    refetch,
    refetchNotices,
    refetchUpcoming,
    refetchAttendance,
    refetchHomeFees,
    refetchHomeReceipts,
    refetchHomeTransport,
  ]);

  const handleModulePress = useCallback(
    (modulePath: string) => {
      router.push(path(modulePath) as never);
    },
    [path, router]
  );

  if (isLoading && !stats) {
    return (
      <View style={styles.root}>
        <DashboardHeader studentName={fullName} />
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Container>
          <DashboardHeader
            studentName={fullName}
            onMessagesPress={() => handleModulePress('communication')}
            onNotificationPress={() => {}}
            onProfilePress={() => (navigation as { navigate: (name: string) => void }).navigate('profile')}
          />
        </Container>

        <Container>
          <DashboardHomeGrid
            attendancePercent={overallAttendancePercent ?? stats?.attendance_percent ?? '—'}
            classLabel={classTeacherCard.classLabel}
            sectionLabel={classTeacherCard.sectionLabel}
            teacherName={classTeacherCard.teacherName}
            teacherDesignation={classTeacherCard.teacherDesignation}
            classTeacherLoading={classTeacherCard.isLoading}
            feesMonthTotal={feesMonthTotal}
            feesQuarterTotal={feesQuarterTotal}
            receiptCount={receiptCount}
            feesLoading={loadingHomeFees || loadingHomeReceipts}
            routeName={transportRouteLabel}
            transportActive={transportAssigned}
            transportLoading={loadingHomeTransport}
            onPressAttendance={() => handleModulePress('attendance')}
            onPressMyClass={() => handleModulePress('class')}
            onPressFees={() => handleModulePress('fees')}
            onPressTransport={() => handleModulePress('transport')}
          />
        </Container>

        <Container>
          <HomeListCard
            title="Notices & Upcoming"
            items={listItems}
            onItemPress={() => handleModulePress('communication')}
            onViewAll={() => handleModulePress('communication')}
          />
        </Container>

        <Container>
          <SectionCard title="Explore Modules" gridColumns={3}>
            {[
              { id: 'my-class', label: 'My Class', path: 'class', icon: 'school' as const },
              { id: 'exams', label: 'Exams', path: 'examinations', icon: 'document-text' as const },
              { id: 'marks', label: 'Marks', path: 'marks', icon: 'bar-chart' as const },
              { id: 'calendar', label: 'Calendar', path: 'calendar/academic', icon: 'calendar-outline' as const },
              { id: 'library', label: 'Library', path: 'library', icon: 'library' as const },
              { id: 'fees', label: 'Fees', path: 'fees', icon: 'cash' as const },
            ].map((mod) => (
              <ModuleButton
                key={mod.id}
                icon={mod.icon}
                label={mod.label}
                onPress={() => handleModulePress(mod.path)}
              />
            ))}
          </SectionCard>
        </Container>

        {STUDENT_DASHBOARD_SECTIONS.map((section) => (
          <Container key={section.id}>
            <SectionCard
              title={section.title}
              gridColumns={section.id === 'academics' ? 3 : undefined}
            >
              {section.modules.map((mod) => (
                <ModuleButton
                  key={mod.id}
                  icon={mod.icon}
                  label={mod.label}
                  onPress={() => handleModulePress(mod.path)}
                />
              ))}
            </SectionCard>
          </Container>
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
    ...screenRootWeb,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: s.lg,
    paddingBottom: s['3xl'],
  },
  bottomPad: { height: 100 },
});
