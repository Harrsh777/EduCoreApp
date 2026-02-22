/**
 * Gallery: category filter pills, 2-column image grid, tap → full screen modal viewer, pull to refresh.
 * GET /api/gallery.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, Dimensions, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTeacher } from '@/lib/teacher-context';
import { galleryService } from '@/services/gallery.service';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';
import { AppHeader, ScreenWrapper } from '@/components/teacher';

const { colors, spacing: s } = teacherDashboardTheme;

type GalleryItem = { id?: string; title?: string; image_url?: string; url?: string; category?: string };

export default function TeacherGalleryScreen() {
  const { schoolCode } = useTeacher();
  const [category, setCategory] = useState<string>('');
  const [viewerItem, setViewerItem] = useState<GalleryItem | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['gallery', schoolCode, category || 'all'],
    queryFn: () => galleryService.getGallery(schoolCode, category || undefined).then((r) => (r as { data?: GalleryItem[] })?.data ?? []),
    enabled: Boolean(schoolCode),
  });

  const items = (Array.isArray(data) ? data : []) as GalleryItem[];
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => (i.category ? set.add(i.category) : null));
    return Array.from(set).sort();
  }, [items]);

  const imageUrl = (item: GalleryItem) => item.image_url ?? item.url ?? '';

  return (
    <View style={styles.root}>
      <AppHeader title="Gallery" />
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills} contentContainerStyle={styles.pillsContent}>
          <Pressable style={[styles.pill, !category && styles.pillActive]} onPress={() => setCategory('')}>
            <Text style={[styles.pillText, !category && styles.pillTextActive]}>All</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable key={c} style={[styles.pill, category === c && styles.pillActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.pillText, category === c && styles.pillTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <ScreenWrapper scroll={false} refreshing={isRefetching} onRefresh={() => refetch()} loading={isLoading && !items.length}>
        <ScrollView contentContainerStyle={styles.grid}>
          {items.map((item) => (
            <Pressable key={item.id} style={styles.tile} onPress={() => setViewerItem(item)}>
              {imageUrl(item) ? (
                <Image source={{ uri: imageUrl(item) }} style={styles.tileImage} resizeMode="cover" />
              ) : (
                <View style={styles.tilePlaceholder}><Text style={styles.tilePlaceholderText}>No image</Text></View>
              )}
              {item.title ? <Text style={styles.tileTitle} numberOfLines={1}>{item.title}</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
        {items.length === 0 && !isLoading && <Text style={styles.empty}>No images.</Text>}
      </ScreenWrapper>

      <Modal visible={!!viewerItem} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setViewerItem(null)}>
          <View style={styles.modalContent}>
            {viewerItem && imageUrl(viewerItem) ? (
              <Image source={{ uri: imageUrl(viewerItem) }} style={styles.modalImage} resizeMode="contain" />
            ) : null}
            {viewerItem?.title ? <Text style={styles.modalTitle}>{viewerItem.title}</Text> : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');
const tileSize = (width - s.lg * 2 - s.sm) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pills: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.border },
  pillsContent: { paddingHorizontal: s.lg, paddingVertical: s.sm, gap: s.sm, flexDirection: 'row', alignItems: 'center' },
  pill: { paddingHorizontal: s.md, paddingVertical: 6, borderRadius: 9999, marginRight: s.sm, backgroundColor: colors.border },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  pillTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: s.lg, gap: s.sm },
  tile: { width: tileSize, marginBottom: s.sm },
  tileImage: { width: tileSize, height: tileSize, borderRadius: 12, backgroundColor: colors.border },
  tilePlaceholder: { width: tileSize, height: tileSize, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tilePlaceholderText: { ...textStyles.caption, color: colors.textMuted },
  tileTitle: { ...textStyles.caption, color: colors.textPrimary, marginTop: 4 },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', padding: s.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: s.lg },
  modalContent: { alignItems: 'center' },
  modalImage: { width: width - s.lg * 2, height: width - s.lg * 2, borderRadius: 8 },
  modalTitle: { ...textStyles.body, color: '#fff', marginTop: s.md },
});
