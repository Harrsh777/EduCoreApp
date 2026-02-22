/**
 * Student Dashboard Home — crisp white + deep-blue aesthetic.
 * Blur fixes:
 *   1. Animations DISABLED on web (Animated opacity/transform blurs text on web).
 *   2. All backgrounds are solid colours — no gradient/rgba stacking.
 *   3. Shared PALETTE tokens ensure colour consistency across every component.
 */

import {
  CategorySelector,
  DashboardHeader,
  HomeListCard,
  HomeSummaryCard,
  LoadingSkeleton,
  ModuleButton,
  SectionCard,
  StatCard,
  type HomeListItem,
  type HomeSegment,
} from '@/components/student-dashboard';
import { STUDENT_DASHBOARD_SECTIONS } from '@/constants/studentDashboardMenu';
import { useStudent } from '@/lib/student-context';
import { communicationService } from '@/services/communication.service';
import { getDashboardHomeStats, invalidateDashboardCache } from '@/services/student-dashboard.service';
import { studentService } from '@/services/student.service';
import { spacing } from '@/theme/spacing';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

// ─── Design tokens: solid hex only on web to avoid alpha compositing / text blur ─
export const PALETTE = {
  pageBg:      '#060F1E',
  cardBg:      '#0D1F3C',
  cardBgAlt:   '#112240',
  blue:        '#3B82F6',
  blueDim:     '#1D4ED8',
  blueGlow:    Platform.OS === 'web' ? '#1a2d4a' : 'rgba(59, 130, 246, 0.15)',
  white:       '#FFFFFF',
  whiteHi:     Platform.OS === 'web' ? '#E6E6E6' : 'rgba(255,255,255,0.90)',
  whiteMid:    Platform.OS === 'web' ? '#8C8C8C' : 'rgba(255,255,255,0.55)',
  whiteDim:    Platform.OS === 'web' ? '#404040' : 'rgba(255,255,255,0.25)',
  borderSubtle: Platform.OS === 'web' ? '#1a2330' : 'rgba(255,255,255,0.07)',
  borderBlue:   Platform.OS === 'web' ? '#2563eb' : 'rgba(59,130,246,0.35)',
  green:       '#22C55E',
  amber:       '#F59E0B',
};

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
  const fullName     = student?.full_name ?? (student as { name?: string })?.name ?? 'Student';
  const classSection = [student?.class, student?.section].filter(Boolean).join(' • ') || '';

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
    refetch(); refetchNotices(); refetchUpcoming();
  }, [refetch, refetchNotices, refetchUpcoming]);

  const handleModulePress = useCallback(
    (modulePath: string) => router.push(path(modulePath) as never),
    [path, router],
  );

  // ── Derived stats ─────────────────────────────────────────────────────────
  const attendancePct = stats?.attendance_percent    ?? '—';
  const upcomingExams = stats?.upcoming_exams_count  ?? 0;
  const pendingFees   = stats?.pending_fees_count    ?? '—';
  const weeklyPct     = stats?.weekly_completion_percent ?? '—';

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading && !stats) {
    return (
      <View style={styles.root}>
        <DashboardHeader studentName={fullName} classSection={classSection} />
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
            tintColor={PALETTE.blue}
            colors={[PALETTE.blue]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        {maybeAnimate ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <DashboardHeader studentName={fullName} classSection={classSection} />
          </Animated.View>
        ) : (
          <DashboardHeader studentName={fullName} classSection={classSection} />
        )}

        {/* ── Category selector ──────────────────────────────────────────── */}
        <FadeIn anim={fadeAnim}>
          <CategorySelector value={segment} onChange={setSegment} />
        </FadeIn>

        {/* ── Summary card ───────────────────────────────────────────────── */}
        <FadeIn anim={fadeAnim}>
          <HomeSummaryCard
            attendancePercent={stats?.attendance_percent}
            weeklyCompletionPercent={stats?.weekly_completion_percent}
            onViewDetails={() => handleModulePress('attendance')}
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

        {/* ── Stat cards (horizontal scroll) ─────────────────────────────── */}
        <FadeIn anim={fadeAnim}>
          <View style={styles.statsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScrollContent}
            >
              <Pressable onPress={() => handleModulePress('attendance')}>
                <StatCard
                  label="Attendance"
                  value={typeof attendancePct === 'number' ? `${attendancePct}%` : attendancePct}
                />
              </Pressable>

              <Pressable onPress={() => handleModulePress('examinations')}>
                <StatCard label="Upcoming Exams" value={String(upcomingExams)} />
              </Pressable>

              <StatCard label="Pending Fees" value={String(pendingFees)} />

              <StatCard
                label="Weekly Done"
                value={typeof weeklyPct === 'number' ? `${weeklyPct}%` : weeklyPct}
              />
            </ScrollView>
          </View>
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
    backgroundColor: PALETTE.pageBg,
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
  statsRow: {
    marginBottom: spacing[2],
  },
  statsScrollContent: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
});