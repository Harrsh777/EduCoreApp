/**
 * Premium Student Gallery Module
 * Compact Card UI — images contained in fixed small boxes
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

// 3-column compact grid
const COLUMNS = 3;
const CARD_GAP = 8;
const HORIZONTAL_PADDING = 14;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_GAP * (COLUMNS - 1)) / COLUMNS;

// Compact fixed image box size
const IMAGE_BOX_SIZE = CARD_WIDTH - 12; // square box with small internal padding

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  bg: '#F1F5F9',
  surface: '#FFFFFF',
  textDark: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  badgeBg: 'rgba(37,99,235,0.85)',
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
// Compact Gallery Card
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
      Animated.spring(scale, {
        toValue: 0.94,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();

    const onPressOut = () =>
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }).start();

    return (
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.cardPressable}
        >
          {/* ── Fixed-size image box ── */}
          <View style={styles.imageBox}>
            <Image
              source={{
                uri:
                  item.image_url ||
                  item.url ||
                  'https://via.placeholder.com/200x200?text=No+Image',
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

          {/* ── Text below box ── */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || 'Untitled'}
            </Text>
            {item.created_at ? (
              <Text style={styles.cardDate} numberOfLines={1}>
                {formatDate(item.created_at)}
              </Text>
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
      year: '2-digit',
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
          numColumns={COLUMNS}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
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
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },

  // Category pills
  categoryRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoryScroll: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 4,
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
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMid,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  countLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 10,
  },

  // Card — tight wrapper
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#1E40AF',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardPressable: {
    padding: 6,
  },

  // Fixed-size image box — the key element
  imageBox: {
    width: IMAGE_BOX_SIZE,
    height: IMAGE_BOX_SIZE,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: IMAGE_BOX_SIZE - 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Card footer text
  cardFooter: {
    paddingTop: 5,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 15,
  },
  cardDate: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 1,
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
    fontSize: 13,
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