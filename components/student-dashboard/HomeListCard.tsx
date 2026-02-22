/**
 * Home list card: notices / upcoming with tag badges (Holiday / Event / Urgent).
 * Each row: tag pill, title + subtitle, View button. Clean light styling.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Platform, type ViewProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';

const { colors, cardRadius, cardPadding, webSolid, spacing: s } = studentDashboardTheme;

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
  /** Pill badge: Holiday / Event / Urgent */
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
            {items.slice(0, 5).map((item) => (
              <View
                key={item.id}
                style={styles.row}
                onTouchEnd={() => onItemPress?.(item)}
              >
                <View style={[styles.iconCircle, item.tag === 'Urgent' && styles.iconCircleUrgent]}>
                  <Ionicons
                    name={item.tag === 'Urgent' ? 'warning' : 'umbrella'}
                    size={18}
                    color="#fff"
                  />
                </View>
                <View style={styles.middle}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
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
                    <Text style={styles.rowSubtitleRight} numberOfLines={1}>{item.subtitle}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <ScrollView scrollEnabled={false} nestedScrollEnabled>
            {items.slice(0, 5).map((item) => (
              <Pressable
                key={item.id}
                style={styles.row}
                onPress={() => onItemPress?.(item)}
              >
                <View style={[styles.iconCircle, item.tag === 'Urgent' && styles.iconCircleUrgent]}>
                  <Ionicons
                    name={item.tag === 'Urgent' ? 'warning' : 'umbrella'}
                    size={18}
                    color="#fff"
                  />
                </View>
                <View style={styles.middle}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
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
                    <Text style={styles.rowSubtitleRight} numberOfLines={1}>{item.subtitle}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: s.lg, marginBottom: s['2xl'] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    padding: cardPadding,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.md,
  },
  title: { ...textStyles.h4, color: colors.textPrimary },
  viewAll: { ...textStyles.caption, color: colors.primary, fontWeight: '600' },
  empty: { ...textStyles.body, color: colors.textSecondary, paddingVertical: s.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.lg,
    borderBottomWidth: 1,
    borderBottomColor: webSolid.borderSubtle,
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
  iconCircleUrgent: { backgroundColor: '#F97316' },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: webSolid.ovalBg,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tagUrgent: { backgroundColor: '#FFE4E6' },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.primary },
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
  rowSubtitleRight: { ...textStyles.caption, color: colors.textSecondary },
});
