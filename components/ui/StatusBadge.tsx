/**
 * StatusBadge: pill for status (pending, approved, rejected, etc.).
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type StatusVariant = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'neutral';

type StatusBadgeProps = {
  label: string;
  variant?: StatusVariant;
};

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  const { colors: c, spacing, radii } = useTheme();

  const bg =
    variant === 'pending'
      ? c.warning.light
      : variant === 'approved' || variant === 'active'
        ? c.success.light
        : variant === 'rejected' || variant === 'inactive'
          ? c.error.light
          : c.neutral[100];
  const textColor =
    variant === 'pending'
      ? c.warning.dark
      : variant === 'approved' || variant === 'active'
        ? c.success.dark
        : variant === 'rejected' || variant === 'inactive'
          ? c.error.dark
          : c.text.secondary;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: radii.full, paddingHorizontal: spacing[2], paddingVertical: spacing[0.5] }]}>
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {},
  text: { fontSize: 12, fontWeight: '600' },
});
