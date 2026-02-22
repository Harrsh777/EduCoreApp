/**
 * Student dashboard stat card: solid/gradient background, big number, small label.
 * On web use solid background only to avoid blurry text from gradient layer.
 */

import { View, Text, StyleSheet, Platform, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const { colors, cardRadius, webSolid } = studentDashboardTheme;

type StatCardProps = ViewProps & {
  label: string;
  value: string | number;
};

const cardBgSolid = colors.cardBg;

export function StatCard({ label, value, style, ...rest }: StatCardProps) {
  const noScale = Platform.OS === 'web';
  const content = (
    <>
      <Text style={styles.value} allowFontScaling={!noScale}>{value}</Text>
      <Text style={styles.label} numberOfLines={1} allowFontScaling={!noScale}>
        {label}
      </Text>
    </>
  );
  return (
    <View style={[styles.wrap, style]} {...rest}>
      {Platform.OS === 'web' ? (
        <View style={[styles.gradient, styles.gradientSolid]}>
          {content}
        </View>
      ) : (
        <LinearGradient
          colors={['rgba(30, 144, 255, 0.2)', 'rgba(0, 82, 212, 0.12)'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 140,
    borderRadius: cardRadius,
    // On web, avoid overflow: 'hidden' to reduce compositing layer that can blur text
    ...(Platform.OS === 'web' ? {} : { overflow: 'hidden' as const }),
  },
  gradient: {
    padding: spacing[5],
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: webSolid.borderCard,
  },
  gradientSolid: {
    backgroundColor: cardBgSolid,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  label: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
