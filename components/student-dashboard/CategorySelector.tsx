/**
 * Home category/segment selector: five circular options (Today, Upcoming, etc.).
 * On web: use View instead of ScrollView so content is not in a composited layer (no text blur).
 * On web: use View+onTouchEnd instead of Pressable so labels are not inside a touch layer.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Platform, type ViewStyle } from 'react-native';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const { colors, textNormal } = studentDashboardTheme;
const isWeb = Platform.OS === 'web';

export type HomeSegment = 'today' | 'upcoming' | 'notifications' | 'messages' | 'all';

const SEGMENTS: { id: HomeSegment; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'messages', label: 'Messages' },
  { id: 'all', label: 'All' },
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
      <View style={[styles.circle, active && styles.circleActive]}>
        {active ? <View style={styles.circleInner} /> : null}
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
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
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  circleActive: {
    borderColor: colors.highlight,
    backgroundColor: colors.highlight,
  },
  circleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryBg,
  },
  label: {
    ...textStyles.caption,
    color: colors.textSecondary,
    ...textNormal,
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
