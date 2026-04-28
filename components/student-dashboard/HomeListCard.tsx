/**
 * Notices & upcoming list — glass card, status dots only where needed, no text shadows.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Platform, type ViewProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  STUDENT_MODULE_PALETTES,
  studentDashboardPaletteIndex,
  studentDashboardTheme,
  studentDashboardCardStyle,
} from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';

const { colors, cardPadding, spacing: s } = studentDashboardTheme;

function TagLabel(tag: HomeListItem['tag']): string {
  if (tag === 'Urgent') return 'HIGH PRIORITY';
  if (tag === 'Event') return 'EVENT';
  if (tag === 'Holiday') return 'HOLIDAY';
  return tag ?? 'EVENT';
}

export type HomeListItem = {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'notice' | 'upcoming';
  tag?: 'Holiday' | 'Event' | 'Urgent';
};

type HomeListCardProps = ViewProps & {
  title: string;
  items: HomeListItem[];
  onItemPress?: (item: HomeListItem) => void;
  onViewAll?: () => void;
};

export function HomeListCard({ title, items, onItemPress, onViewAll, style, ...rest }: HomeListCardProps) {
  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {onViewAll &&
            (Platform.OS === 'web' ? (
              <View onTouchEnd={onViewAll}>
                <Text style={styles.viewAll}>View all</Text>
              </View>
            ) : (
              <Pressable onPress={onViewAll}>
                <Text style={styles.viewAll}>View all</Text>
              </Pressable>
            ))}
        </View>
        {items.length === 0 ? (
          <Text style={styles.empty}>No items</Text>
        ) : Platform.OS === 'web' ? (
          <View>
            {items.slice(0, 5).map((item, index) => {
              const pal = STUDENT_MODULE_PALETTES[studentDashboardPaletteIndex(item.id + index, STUDENT_MODULE_PALETTES.length)];
              return (
              <View key={item.id} style={styles.row} onTouchEnd={() => onItemPress?.(item)}>
                <View style={[styles.iconCircle, item.tag === 'Urgent' && styles.iconCircleUrgent, item.tag !== 'Urgent' && { backgroundColor: pal.iconBg }]}>
                  <Ionicons
                    name={item.tag === 'Urgent' ? 'warning' : 'notifications-outline'}
                    size={18}
                    color={item.tag === 'Urgent' ? '#FFFFFF' : pal.icon}
                  />
                </View>
                <View style={styles.middle}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.tag ? (
                    <View style={[styles.tagPill, item.tag === 'Urgent' && styles.tagUrgent]}>
                      <Text style={[styles.tagText, item.tag === 'Urgent' && styles.tagTextUrgent]}>
                        {TagLabel(item.tag)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.rightMeta}>
                  {item.subtitle != null && typeof item.subtitle === 'string' ? (
                    <Text style={styles.rowSubtitleRight} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={pal.icon} />
                </View>
              </View>
              );
            })}
          </View>
        ) : (
          <ScrollView scrollEnabled={false} nestedScrollEnabled>
            {items.slice(0, 5).map((item, index) => {
              const pal = STUDENT_MODULE_PALETTES[studentDashboardPaletteIndex(item.id + index, STUDENT_MODULE_PALETTES.length)];
              return (
              <Pressable key={item.id} style={styles.row} onPress={() => onItemPress?.(item)}>
                <View style={[styles.iconCircle, item.tag === 'Urgent' && styles.iconCircleUrgent, item.tag !== 'Urgent' && { backgroundColor: pal.iconBg }]}>
                  <Ionicons
                    name={item.tag === 'Urgent' ? 'warning' : 'notifications-outline'}
                    size={18}
                    color={item.tag === 'Urgent' ? '#FFFFFF' : pal.icon}
                  />
                </View>
                <View style={styles.middle}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.tag ? (
                    <View style={[styles.tagPill, item.tag === 'Urgent' && styles.tagUrgent]}>
                      <Text style={[styles.tagText, item.tag === 'Urgent' && styles.tagTextUrgent]}>
                        {TagLabel(item.tag)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.rightMeta}>
                  {item.subtitle != null && typeof item.subtitle === 'string' ? (
                    <Text style={styles.rowSubtitleRight} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={pal.icon} />
                </View>
              </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: s.xl, marginBottom: s['3xl'] },
  card: {
    ...studentDashboardCardStyle,
    backgroundColor: colors.surface,
    padding: cardPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.md,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  viewAll: { ...textStyles.caption, color: colors.accent, fontWeight: '700' },
  empty: { ...textStyles.body, color: colors.textMuted, paddingVertical: s.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.2)',
    gap: s.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUrgent: { backgroundColor: colors.warning },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tagUrgent: { backgroundColor: 'rgba(249, 115, 22, 0.15)' },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.accent },
  tagTextUrgent: { color: colors.danger },
  middle: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  rowSubtitleRight: { ...textStyles.caption, color: colors.textMuted },
});
