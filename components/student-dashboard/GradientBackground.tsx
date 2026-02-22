/**
 * Gradient background for student dashboard (header / cards).
 */

import { View, StyleSheet, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { studentDashboardTheme } from '@/theme/studentDashboard';

const { colors } = studentDashboardTheme;

type GradientBackgroundProps = ViewProps & {
  variant?: 'header' | 'card' | 'full';
  children?: React.ReactNode;
};

export function GradientBackground({
  variant = 'full',
  style,
  children,
  ...rest
}: GradientBackgroundProps) {
  const isCard = variant === 'card';
  const colorsGradient = isCard
    ? ['rgba(30, 144, 255, 0.15)', 'rgba(0, 82, 212, 0.08)'] as const
    : [colors.primaryBg, colors.secondarySurface] as const;

  return (
    <LinearGradient
      colors={colorsGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[variant === 'full' ? styles.full : styles.header, style]}
      {...rest}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  header: { paddingVertical: 16, paddingHorizontal: 20 },
});
