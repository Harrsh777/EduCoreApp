/**
 * Student Dashboard Home (alternate route) — same calm premium system as index.
 * Animations disabled on web to avoid compositing blur on some browsers.
 */

import {
  CategorySelector,
  DashboardHeader,
  DashboardHomeGrid,
  HomeListCard,
  LoadingSkeleton,
  ModuleButton,
  SectionCard,
  type HomeListItem,
  type HomeSegment,
} from '@/components/student-dashboard';
import { STUDENT_DASHBOARD_SECTIONS } from '@/constants/studentDashboardMenu';
import { useStudentClassTeacherCard } from '@/hooks/useStudentClassTeacherCard';
import { env } from '@/lib/env';
import { useStudent } from '@/lib/student-context';
import { communicationService } from '@/services/communication.service';
import { getStudentByAdmissionNo } from '@/services/school.service';
import {
  countActiveReceipts,
  getDashboardHomeStats,
  invalidateDashboardCache,
  sumFeesDueInMonthAndQuarter,
} from '@/services/student-dashboard.service';
import { studentService } from '@/services/student.service';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { spacing } from '@/theme/spacing';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

const { colors } = studentDashboardTheme;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const maybeAnimate = Platform.OS !== 'web'; // NO animation on web → no blur

// ─── Wrapper: prevents duplicating the Animated/View split everywhere ──────────
function FadeIn({ children, anim }: { children: React.ReactNode; anim: Animated.Value }) {
  if (!maybeAnimate) return <View>{children}</View>;
  return <Animated.View style={{ opacity: anim }}>{children}</Animated.View>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function StudentDashboardHomeScreen() {
  const router = useRouter();
  const { student, schoolCode, path } = useStudent();

  const studentId    = student?.id ?? '';
  const studentRecord = (student ?? {}) as {
    full_name?: string;
    name?: string;
    student_name?: string;
    first_name?: string;
    last_name?: string;
  };
  const fullName =
    studentRecord.full_name?.trim() ||
    studentRecord.name?.trim() ||
    studentRecord.student_name?.trim() ||
    [studentRecord.first_name, studentRecord.last_name].filter(Boolean).join(' ').trim() ||
    'Student';

  const [segment, setSegment] = useState<HomeSegment>('today');
  const fadeAnim  = useRef(new Animated.Value(maybeAnimate ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(maybeAnimate ? 20 : 0)).current;

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: stats, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['student-dashboard-home', schoolCode, studentId],
    queryFn:  () => getDashboardHomeStats({ school_code: schoolCode, student_id: studentId }),
    enabled:  Boolean(schoolCode && studentId),
    staleTime: 60_000,
  });

  type NoticeRow = { id: string; title?: string; content?: string; category?: string; publish_at?: string };
  type UpcomingRow = { id: string; title?: string; subtitle?: string; month?: string; day?: string };

  const { data: noticesData, refetch: refetchNotices } = useQuery({
    queryKey: ['student-home-notices', schoolCode],
    queryFn:  async (): Promise<{ data: NoticeRow[] }> => {
      const res = await communicationService.getNotices(schoolCode, { limit: 5, status: 'Active' });
      const data = (res as { data?: NoticeRow[] })?.data ?? res;
      return { data: Array.isArray(data) ? data : [] };
    },
    enabled:  Boolean(schoolCode),
    staleTime: 60_000,
  });

  const { data: upcomingData, refetch: refetchUpcoming } = useQuery({
    queryKey: ['student-home-upcoming', schoolCode, studentId],
    queryFn:  async (): Promise<{ data: UpcomingRow[] }> => {
      const res = await studentService.getUpcomingItems({ school_code: schoolCode, student_id: studentId, limit: 5 });
      const data = (res as { data?: UpcomingRow[] })?.data ?? res;
      return { data: Array.isArray(data) ? data : [] };
    },
    enabled:  Boolean(schoolCode && studentId),
    staleTime: 60_000,
  });

  const classTeacherCard = useStudentClassTeacherCard();
  const canFetchHomeExtras = Boolean(
    schoolCode && (studentId || (env.USE_SUPABASE_DASHBOARD && student?.admission_no))
  );

  async function resolveEffectiveStudentId(): Promise<string> {
    let effectiveId = studentId;
    if (env.USE_SUPABASE_DASHBOARD && schoolCode && student?.admission_no) {
      try {
        const r = await getStudentByAdmissionNo(schoolCode, student.admission_no);
        const row = (r as { data?: { id?: string } })?.data;
        if (row?.id) effectiveId = String(row.id);
      } catch {
        /* keep studentId */
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
    staleTime: 60_000,
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
    staleTime: 60_000,
  });

  type TransportHomePayload = {
    has_transport?: boolean;
    route?: string | { name?: string };
    route_name?: string;
    stops?: unknown[];
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
    staleTime: 60_000,
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
      Boolean(info.route || info.route_name || (Array.isArray(info.stops) && info.stops.length > 0));
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

  const listItems = useMemo((): HomeListItem[] => {
    const notices  = noticesData?.data;
    const upcoming = upcomingData?.data;

    const fromNotices: HomeListItem[]  = Array.isArray(notices)
      ? notices.map(n  => ({ id: `notice-${n.id}`,   title: n.title ?? 'Notice',   subtitle: n.category ?? n.publish_at ?? '',  type: 'notice'   as const }))
      : [];
    const fromUpcoming: HomeListItem[] = Array.isArray(upcoming)
      ? upcoming.map(u => ({ id: `upcoming-${u.id}`, title: u.title ?? 'Upcoming', subtitle: u.subtitle ?? (u.month && u.day ? `${u.month}/${u.day}` : ''), type: 'upcoming' as const }))
      : [];

    return [...fromUpcoming, ...fromNotices].slice(0, 5);
  }, [noticesData, upcomingData]);

  // ── Entrance animation (native only) ──────────────────────────────────────
  useEffect(() => {
    if (!maybeAnimate) return;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, useNativeDriver: true, duration: 420 }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const onRefresh = useCallback(() => {
    invalidateDashboardCache();
    refetch();
    refetchNotices();
    refetchUpcoming();
    refetchHomeFees();
    refetchHomeReceipts();
    refetchHomeTransport();
  }, [refetch, refetchNotices, refetchUpcoming, refetchHomeFees, refetchHomeReceipts, refetchHomeTransport]);

  const handleModulePress = useCallback(
    (modulePath: string) => router.push(path(modulePath) as never),
    [path, router],
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading && !stats) {
    return (
      <View style={styles.root}>
        <DashboardHeader studentName={fullName} />
        <LoadingSkeleton />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        {maybeAnimate ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <DashboardHeader studentName={fullName} />
          </Animated.View>
        ) : (
          <DashboardHeader studentName={fullName} />
        )}

        {/* ── Category selector ──────────────────────────────────────────── */}
        <FadeIn anim={fadeAnim}>
          <CategorySelector value={segment} onChange={setSegment} />
        </FadeIn>

        {/* ── Home grid: Attendance, My Class, Fees, Transport ───────────── */}
        <FadeIn anim={fadeAnim}>
          <DashboardHomeGrid
            attendancePercent={stats?.attendance_percent ?? '—'}
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
        </FadeIn>

        {/* ── Notices + Upcoming list ─────────────────────────────────────── */}
        <FadeIn anim={fadeAnim}>
          <HomeListCard
            title="Notices & Upcoming"
            items={listItems}
            onItemPress={() => handleModulePress('communication')}
            onViewAll={() => handleModulePress('communication')}
          />
        </FadeIn>

        {/* ── Module sections ─────────────────────────────────────────────── */}
        {STUDENT_DASHBOARD_SECTIONS.map((section) => (
          <FadeIn key={section.id} anim={fadeAnim}>
            <SectionCard title={section.title}>
              {section.modules.map((mod) => (
                <ModuleButton
                  key={mod.id}
                  icon={mod.icon}
                  label={mod.label}
                  onPress={() => handleModulePress(mod.path)}
                />
              ))}
            </SectionCard>
          </FadeIn>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
    // Web: constrain max-width and centre (replaces screenRootWeb from old theme)
    ...(Platform.OS === 'web'
      ? { maxWidth: 680, width: '100%', alignSelf: 'center' as const }
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: spacing[2],
    paddingBottom: spacing[16],
  },
});