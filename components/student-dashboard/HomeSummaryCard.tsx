/**
 * Home stats summary: one card with Attendance + Weekly completion and "View details".
 * Per doc §2.1 Content card 1.
 */

import { View, Text, StyleSheet, Pressable, Platform, type ViewProps } from 'react-native';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const { colors, cardRadius, cardPadding, webSolid } = studentDashboardTheme;

type HomeSummaryCardProps = ViewProps & {
  attendancePercent?: number | string;
  weeklyCompletionPercent?: number | string;
  onViewDetails?: () => void;
};

export function HomeSummaryCard({
  attendancePercent,
  weeklyCompletionPercent,
  onViewDetails,
  style,
  ...rest
}: HomeSummaryCardProps) {
  const att = attendancePercent != null ? (typeof attendancePercent === 'number' ? `${attendancePercent}%` : attendancePercent) : '—';
  const weekly = weeklyCompletionPercent != null ? (typeof weeklyCompletionPercent === 'number' ? `${weeklyCompletionPercent}%` : weeklyCompletionPercent) : '—';

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Attendance</Text>
          <Text style={styles.value}>{att}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Weekly completion</Text>
          <Text style={styles.value}>{weekly}</Text>
        </View>
        {onViewDetails &&
          (Platform.OS === 'web' ? (
            <View style={styles.oval} onTouchEnd={onViewDetails}>
              <Text style={styles.ovalText}>View details</Text>
            </View>
          ) : (
            <Pressable style={styles.oval} onPress={onViewDetails}>
              <Text style={styles.ovalText}>View details</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing[4], marginBottom: spacing[4] },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: cardRadius,
    padding: cardPadding,
    borderWidth: 1,
    borderColor: Platform.OS === 'web' && webSolid ? webSolid.borderCard : 'rgba(59, 164, 255, 0.15)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  label: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  oval: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
    backgroundColor: Platform.OS === 'web' && webSolid ? webSolid.ovalBg : 'rgba(59, 164, 255, 0.2)',
    marginTop: spacing[2],
  },
  ovalText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
