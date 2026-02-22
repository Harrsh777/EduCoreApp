/**
 * StatCard: metric display for dashboards (label + value + optional trend).
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
};

export function StatCard({ label, value, subtitle, variant = 'neutral' }: StatCardProps) {
  const { colors: c, spacing, radii, shadows } = useTheme();

  const accentColor =
    variant === 'primary'
      ? c.primary[600]
      : variant === 'success'
        ? c.success.main
        : variant === 'warning'
          ? c.warning.main
          : c.text.secondary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.surface.default,
          borderRadius: radii.xl,
          padding: spacing[4],
          ...shadows.sm,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          borderWidth: 1,
          borderColor: c.border.default,
        },
      ]}
    >
      <Text style={[styles.label, { color: c.text.secondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, { color: c.text.primary }]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: c.text.tertiary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 4 },
});
