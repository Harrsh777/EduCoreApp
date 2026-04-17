/**
 * Segment selector — each option has its own accent (jewel tones on pastel page).
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Platform, type ViewStyle } from 'react-native';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const { colors } = studentDashboardTheme;
const isWeb = Platform.OS === 'web';

export type HomeSegment = 'today' | 'upcoming' | 'notifications' | 'messages' | 'all';

const SEGMENTS: { id: HomeSegment; label: string; ring: string; fill: string }[] = [
  { id: 'today', label: 'Today', ring: '#A78BFA', fill: '#7C3AED' },
  { id: 'upcoming', label: 'Upcoming', ring: '#F472B6', fill: '#DB2777' },
  { id: 'notifications', label: 'Notifications', ring: '#22D3EE', fill: '#0891B2' },
  { id: 'messages', label: 'Messages', ring: '#FBBF24', fill: '#D97706' },
  { id: 'all', label: 'All', ring: '#34D399', fill: '#059669' },
];

const CIRCLE_SIZE = 44;

type CategorySelectorProps = {
  value: HomeSegment;
  onChange: (segment: HomeSegment) => void;
  style?: ViewStyle;
};

function SegmentItem({
  seg,
  active,
  onSelect,
}: {
  seg: (typeof SEGMENTS)[0];
  active: boolean;
  onSelect: () => void;
}) {
  const content = (
    <>
      <View
        style={[
          styles.circle,
          { borderColor: active ? seg.fill : seg.ring },
          active && { backgroundColor: seg.fill },
        ]}
      >
        {active ? <View style={[styles.circleInner, { backgroundColor: '#FFFFFF' }]} /> : null}
      </View>
      <Text
        style={[styles.label, active && styles.labelActive, active && { color: seg.fill }]}
        numberOfLines={1}
      >
        {seg.label}
      </Text>
    </>
  );
  if (isWeb) {
    return (
      <View
        style={styles.item}
        onTouchEnd={onSelect}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.item]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      {content}
    </Pressable>
  );
}

export function CategorySelector({ value, onChange, style }: CategorySelectorProps) {
  const containerStyle = [styles.scrollContent, style];
  const children = SEGMENTS.map((seg) => (
    <SegmentItem
      key={seg.id}
      seg={seg}
      active={value === seg.id}
      onSelect={() => onChange(seg.id)}
    />
  ));
  if (isWeb) {
    return (
      <View style={[styles.scrollContent, styles.scrollContentWeb, style]}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={containerStyle}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  scrollContentWeb: isWeb
    ? { overflowX: 'auto' as const, flexWrap: 'nowrap' as const }
    : {},
  item: {
    alignItems: 'center',
    minWidth: 56,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  circleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '700',
  },
});
