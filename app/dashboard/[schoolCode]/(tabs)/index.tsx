/**
 * Dashboard home: search bar, context strip, stats grid, module grid.
 * Route: /dashboard/[schoolCode] (Home tab).
 */

import { DASHBOARD_MENU_ITEMS } from '@/constants/dashboardMenu';
import { useSchoolCode } from '@/lib/school-context';
import { useSidebar } from '@/lib/sidebar-context';
import { dashboardService } from '@/services/dashboard.service';
import { shadows } from '@/theme/shadows';
import { radii, spacing } from '@/theme/spacing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';

type ModuleItem = {
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/** Module grid uses same list as sidebar (DASHBOARD_MENU_ITEMS). */
const MODULES: ModuleItem[] = DASHBOARD_MENU_ITEMS.map((item) => ({
  label: item.label,
  path: item.path,
  icon: item.icon as keyof typeof Ionicons.glyphMap,
}));

const CARD_COLORS = [
  '#FEF3C7', '#DBEAFE', '#D1FAE5', '#E0E7FF', '#FCE7F3', '#F3E8FF', '#CCFBF1', '#FED7AA',
  '#E0F2FE', '#FEF9C3', '#E9D5FF', '#D1D5DB', '#BFDBFE', '#A7F3D0', '#FBCFE8', '#FEF3C7',
  '#DBEAFE', '#D1FAE5', '#E0E7FF', '#FCE7F3', '#F3E8FF', '#CCFBF1', '#FED7AA',
];

function formatINR(value: number | string | null | undefined): string {
  if (value == null || value === '') return '₹0';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DashboardHomeScreen() {
  const router = useRouter();
  const { schoolCode, schoolName, path } = useSchoolCode();
  const { toggle: toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();

  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats', schoolCode],
    queryFn: () => dashboardService.getDashboardStats(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const financialQuery = useQuery({
    queryKey: ['dashboard', 'financial', schoolCode],
    queryFn: () => dashboardService.getDashboardFinancialOverview(schoolCode).then((r: { data: unknown }) => r.data),
    enabled: Boolean(schoolCode),
  });
  const statsDetailedQuery = useQuery({
    queryKey: ['dashboard', 'stats-detailed', schoolCode],
    queryFn: () => dashboardService.getDashboardStatsDetailed(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });
  const classesQuery = useQuery({
    queryKey: ['dashboard', 'classes', schoolCode],
    queryFn: () => dashboardService.getClasses(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const stats = (statsQuery.data ?? {}) as Record<string, number | string>;
  const financial = (financialQuery.data ?? {}) as Record<string, number | string>;
  const statsD = (statsDetailedQuery.data ?? {}) as Record<string, number | string>;
  const classesList = Array.isArray(classesQuery.data) ? classesQuery.data : [];
  const classesData = (classesQuery.data ?? {}) as { data?: unknown[]; sections?: number };

  const totalStudents = stats.total_students ?? stats.students ?? stats.totalStudents ?? '—';
  const feesThisMonth =
    financial.monthlyCollection ?? financial.monthly_collection ?? financial.collected ?? financial.total_collected ?? 0;
  const staffAttendanceRaw =
    statsD.staff_attendance_pct ?? statsD.staff_attendance ?? (stats as Record<string, unknown>).staff_attendance ?? '—';
  const staffAttendanceDisplay =
    typeof staffAttendanceRaw === 'number' ? `${staffAttendanceRaw}%` : String(staffAttendanceRaw);
  const classesCount = Array.isArray(classesList) ? classesList.length : (classesData.data?.length ?? stats.classes ?? '—');
  const sectionsCount =
    (classesData as { sections?: number }).sections ?? (stats.sections as number | undefined) ?? '—';

  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return MODULES.filter(
      (item) => item.label.toLowerCase().includes(q) || (item.path && item.path.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const goToModule = useCallback(
    (item: ModuleItem) => {
      setSearchQuery('');
      if (!item.path) {
        router.replace(path('') as never);
        return;
      }
      router.push(path(item.path) as never);
    },
    [path, router]
  );

  const isLoading =
    statsQuery.isLoading || financialQuery.isLoading || classesQuery.isLoading;
  const showStatsSkeleton = isLoading && !statsQuery.data;

  const numColumns = Platform.OS === 'web' ? (width > 900 ? 6 : width > 600 ? 4 : 2) : 2;
  const cardGap = spacing[4];
  const cardWidth = (width - spacing[6] * 2 - cardGap * (numColumns - 1)) / numColumns - 1;

  if (!schoolCode) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Menu (mobile) + Search bar */}
        <View style={styles.searchWrap}>
          {Platform.OS !== 'web' && (
            <Pressable style={styles.menuBtn} onPress={toggleSidebar} accessibilityLabel="Open menu">
              <Ionicons name="menu" size={24} color="#374151" />
            </Pressable>
          )}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={schoolName ? `Search menu... ${schoolName}` : 'Search menu...'}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {filteredSearchResults.length > 0 && (
            <View style={styles.searchDropdown}>
              {filteredSearchResults.slice(0, 8).map((item) => (
                <Pressable
                  key={item.path || item.label}
                  style={styles.searchItem}
                  onPress={() => goToModule(item)}
                >
                  <Ionicons name={item.icon as any} size={18} color="#6B7280" />
                  <Text style={styles.searchItemLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* 2. Context strip */}
        <View style={styles.contextStrip}>
          <Text style={styles.contextText}>
            {schoolName ?? 'School'} · ID: {schoolCode} · {formatDate()}
          </Text>
          <Pressable
            style={styles.homeLink}
            onPress={() => router.replace(path('') as never)}
            accessibilityLabel="Home"
          >
            <Ionicons name="home" size={16} color="#4F46E5" />
            <Text style={styles.homeLinkText}>Home</Text>
          </Pressable>
        </View>

        {/* 3. Statistics section */}
        <Text style={styles.sectionTitle}>Overview</Text>
        {showStatsSkeleton ? (
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.statCardSkeleton}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.statSkeletonText}>—</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={22} color="#4F46E5" style={styles.statIcon} />
              <Text style={styles.statLabel}>Total Students</Text>
              <Text style={styles.statValue}>{String(totalStudents)}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={22} color="#059669" style={styles.statIcon} />
              <Text style={styles.statLabel}>Fees This Month</Text>
              <Text style={styles.statValue}>{formatINR(feesThisMonth)}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="person" size={22} color="#D97706" style={styles.statIcon} />
              <Text style={styles.statLabel}>Staff Attendance</Text>
              <Text style={styles.statValue}>{staffAttendanceDisplay}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="book" size={22} color="#7C3AED" style={styles.statIcon} />
              <Text style={styles.statLabel}>Classes & Sections</Text>
              <Text style={styles.statValue}>
                Classes: {String(classesCount)}
              </Text>
              <Text style={styles.statSub}>
                Sections: {typeof sectionsCount === 'number' ? sectionsCount : sectionsCount}
              </Text>
            </View>
          </View>
        )}

        {/* 4. Module grid */}
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={[styles.moduleGrid, { gap: cardGap }]}>
          {MODULES.map((item, i) => (
            <Pressable
              key={item.path || item.label}
              style={[
                styles.moduleCard,
                {
                  width: cardWidth,
                  backgroundColor: CARD_COLORS[i % CARD_COLORS.length],
                },
              ]}
              onPress={() => goToModule(item)}
            >
              <Ionicons name={item.icon as any} size={28} color="#374151" />
              <Text style={styles.moduleLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing[6], paddingBottom: spacing[12] },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  menuBtn: {
    padding: spacing[2],
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing[4],
    minHeight: 48,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  searchIcon: { marginRight: spacing[2] },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: spacing[2],
  },
  searchDropdown: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    maxHeight: 280,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    minHeight: 44,
  },
  searchItemLabel: { fontSize: 16, color: '#374151', flex: 1 },
  contextStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  contextText: { fontSize: 12, color: '#6B7280' },
  homeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  homeLinkText: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  statCard: {
    width: '47%',
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  statCardSkeleton: {
    width: '47%',
    minWidth: 140,
    backgroundColor: '#F3F4F6',
    borderRadius: radii.xl,
    padding: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  statIcon: { marginBottom: spacing[2] },
  statLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statSkeletonText: { fontSize: 13, color: '#9CA3AF', marginTop: spacing[2] },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moduleCard: {
    borderRadius: radii.xl,
    padding: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  moduleLabel: {
    fontSize: 13,
    color: '#374151',
    marginTop: spacing[2],
    textAlign: 'center',
  },
  bottomPad: { height: spacing[8] },
});
