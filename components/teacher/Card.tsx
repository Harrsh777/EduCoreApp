/**
 * Card: white background, soft shadow, rounded 16. Teacher design system.
 */

import { View, StyleSheet, type ViewStyle } from 'react-native';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';

const { colors, cardRadius, spacing: s } = teacherDashboardTheme;

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof s;
};

export function Card({ children, style, padding = 'lg' }: CardProps) {
  return (
    <View style={[styles.card, { padding: s[padding] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    // soft shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});
