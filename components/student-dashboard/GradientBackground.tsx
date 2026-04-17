/**
 * Full-screen / header wash — lavender → blush → sky (student dashboard).
 */

import { StyleSheet, type ViewProps } from 'react-native';
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
  const gradientColors =
    variant === 'card'
      ? (['#FFFFFF', colors.backgroundSecondary] as const)
      : (['#FAF5FF', '#FDF2F8', '#E0F2FE'] as const);

  return (
    <LinearGradient
      colors={gradientColors}
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
