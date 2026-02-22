import { useStudent } from '@/lib/student-context';
import { communicationService } from '@/services/communication.service';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// ─── Constants ───────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  textDark: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
};

const FILTERS = ['All', 'Urgent', 'Event', 'Info'] as const;
type FilterType = (typeof FILTERS)[number];

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Urgent: { bg: '#FEE2E2', text: '#DC2626' },
  Event:  { bg: '#DCFCE7', text: '#16A34A' },
  Info:   { bg: '#DBEAFE', text: '#2563EB' },
};

const CATEGORY_ICONS: Record<string, string> = {
  Urgent: '🔴',
  Event:  '📅',
  Info:   '📢',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Notice = {
  id: string;
  title?: string;
  body?: string;
  summary?: string;
  category?: string;
  date?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date?: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeCategory(category?: string): string {
  if (!category) return 'Info';
  const c = category.toLowerCase();
  if (c.includes('urgent')) return 'Urgent';
  if (c.includes('event')) return 'Event';
  return 'Info';
}

// ─── Notice Card ─────────────────────────────────────────────────────────────
function NoticeCard({ item, onPress }: { item: Notice; onPress: () => void }) {
  const category = normalizeCategory(item.category);
  const badge = BADGE_COLORS[category] ?? BADGE_COLORS.Info;
  const icon = CATEGORY_ICONS[category] ?? '📢';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {icon} {category}
          </Text>
        </View>
        <Text style={styles.dateLabel}>{formatDate(item.date)}</Text>
      </View>

      {/* Title */}
      <Text style={styles.noticeTitle} numberOfLines={2}>
        {item.title || 'Untitled Notice'}
      </Text>

      {/* Body preview */}
      {(item.body || item.summary) ? (
        <Text style={styles.noticeBody} numberOfLines={2}>
          {item.body ?? item.summary}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.readMore}>Read more</Text>
        <Text style={styles.arrowIcon}>→</Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentCommunicationScreen() {
  const router = useRouter();
  const { schoolCode } = useStudent();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['communication', schoolCode],
    queryFn: () =>
      communicationService
        .getNotices(schoolCode, { limit: 50 })
        .then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const notices: Notice[] =
    Array.isArray(data) ? data : (data as { data?: Notice[] })?.data ?? [];

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return notices.filter((notice) => {
      const matchesFilter =
        activeFilter === 'All' ||
        normalizeCategory(notice.category) === activeFilter;
      const matchesSearch =
        !q ||
        notice.title?.toLowerCase().includes(q) ||
        notice.body?.toLowerCase().includes(q) ||
        notice.summary?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [notices, activeFilter, search]);

  const renderItem = useCallback(
    ({ item }: { item: Notice }) => (
      <NoticeCard
        item={item}
        onPress={() =>
          router.push({
            pathname: '/student/dashboard/[...slug]',
            params: { slug: ['communication', 'details'], id: item.id },
          })
        }
      />
    ),
    [router],
  );

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient colors={['#DBEAFE', '#EFF6FF']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>School</Text>
            <Text style={styles.headerTitle}>Communication</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search notices…"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </LinearGradient>

      {/* ── Filter Pills ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const active = f === activeFilter;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={({ pressed }) => [
                  styles.pill,
                  active && styles.pillActive,
                  pressed && !active && styles.pillPressed,
                ]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notices…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            filteredData.length > 0 ? (
              <Text style={styles.countLabel}>
                {filteredData.length} notice{filteredData.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No notices found</Text>
              <Text style={styles.emptySub}>
                {search
                  ? `No results for "${search}"`
                  : activeFilter !== 'All'
                  ? `Nothing in "${activeFilter}" yet`
                  : 'Check back later'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    paddingVertical: 0,
  },

  // Filter pills — KEY: compact sizing
  filterBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillPressed: {
    backgroundColor: COLORS.primaryLight,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMid,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  countLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 10,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: 5,
  },
  noticeBody: {
    fontSize: 13,
    color: COLORS.textMid,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  readMore: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  arrowIcon: {
    marginLeft: 'auto',
    fontSize: 14,
    color: COLORS.primary,
  },

  // States
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});