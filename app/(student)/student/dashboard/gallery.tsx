/**
 * Premium Student Gallery Module
 * Clean, Compact Mobile UI
 */

import { useStudent } from '@/lib/student-context';
import { galleryService } from '@/services/gallery.service';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  textDark: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  error: '#EF4444',
};

type GalleryItem = {
  id: string;
  title?: string;
  category?: string;
  image_url?: string;
  url?: string;
  created_at?: string;
};

const CATEGORIES = [
  'All',
  'General',
  'Events',
  'Sports',
  'Academics',
  'Cultural',
  'ML-Ops',
  'Other',
];

// ------------------------------------------------------------------
// Card Component  (animation ref is stable — avoids renderItem pitfall)
// ------------------------------------------------------------------
const GalleryCard = React.memo(
  ({
    item,
    onPress,
    formatDate,
  }: {
    item: GalleryItem;
    onPress: () => void;
    formatDate: (d?: string) => string;
  }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();

    const onPressOut = () =>
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

    return (
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri:
                  item.image_url ||
                  item.url ||
                  'https://via.placeholder.com/300x300?text=No+Image',
              }}
              style={styles.image}
              resizeMode="cover"
            />
            {item.category ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {item.category}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || 'Untitled'}
            </Text>
            {item.created_at ? (
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    );
  },
);

// ------------------------------------------------------------------
// Main Screen
// ------------------------------------------------------------------
export default function StudentGalleryScreen() {
  const router = useRouter();
  const { schoolCode } = useStudent();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['gallery', schoolCode],
    queryFn: () => galleryService.getGallery(schoolCode).then((r) => r.data),
    enabled: Boolean(schoolCode),
  });

  const items: GalleryItem[] = Array.isArray(data)
    ? data
    : (data as { data?: GalleryItem[] })?.data ?? [];

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter(
      (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [items, selectedCategory]);

  const formatDate = useCallback((date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GalleryItem }) => (
      <GalleryCard
        item={item}
        formatDate={formatDate}
        onPress={() =>
          router.push({
            pathname: '/student/dashboard/[...slug]',
            params: { slug: ['gallery', 'details'], id: item.id },
          })
        }
      />
    ),
    [formatDate, router],
  );

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient colors={['#DBEAFE', '#EFF6FF']} style={styles.header}>
        <Text style={styles.headerEyebrow}>School</Text>
        <Text style={styles.headerTitle}>Gallery</Text>
      </LinearGradient>

      {/* ── Category Pills ── */}
      <View style={styles.categoryRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => [
                  styles.pill,
                  active && styles.pillActive,
                  pressed && !active && styles.pillPressed,
                ]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {cat}
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
          <Text style={styles.loadingText}>Loading gallery…</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Couldn't load gallery</Text>
            <Text style={styles.errorSub}>Check your connection and try again.</Text>
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
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
            filteredItems.length > 0 ? (
              <Text style={styles.countLabel}>
                {filteredItems.length} image{filteredItems.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🖼️</Text>
              <Text style={styles.emptyTitle}>No images found</Text>
              <Text style={styles.emptySub}>
                {selectedCategory !== 'All'
                  ? `Nothing in "${selectedCategory}" yet`
                  : 'Check back later'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: -0.4,
  },

  // Category pills  ← KEY FIX: compact sizing
  categoryRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryScroll: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  columnWrapper: {
    justifyContent: 'space-between',
  },
  countLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 10,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#1E40AF',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 0.65,
    backgroundColor: COLORS.border,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    maxWidth: CARD_WIDTH - 24,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 17,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 3,
  },

  // States
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },

  errorBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  errorIcon: { fontSize: 32, marginBottom: 10 },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    color: COLORS.textMid,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 22,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
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