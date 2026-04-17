/**
 * Student dashboard stat card — glass surface, no gradients.
 */

import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { studentDashboardTheme, studentDashboardCardStyle } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const { colors } = studentDashboardTheme;

type StatCardProps = ViewProps & {
  label: string;
  value: string | number;
};

export function StatCard({ label, value, style, ...rest }: StatCardProps) {
  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.card}>
        <Text style={styles.value} allowFontScaling>
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={1} allowFontScaling>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 140,
    borderRadius: studentDashboardTheme.cardRadius,
  },
  card: {
    ...studentDashboardCardStyle,
    backgroundColor: colors.surface,
    padding: spacing[5],
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  label: {
    ...textStyles.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
