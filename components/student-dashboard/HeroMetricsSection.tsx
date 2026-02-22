/**
 * Hero metrics: two large circular progress cards (Attendance OVERALL, Marks), then two small icon cards (Upcoming Exams, Pending Fees).
 * Matches design: white bg, dark grey text, light grey progress ring, blue accents.
 */

import { View, Text, StyleSheet, Pressable, type ViewProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { studentDashboardTheme } from '@/theme/studentDashboard';

const { colors, spacing: s } = studentDashboardTheme;

const CARD_RADIUS = 20;
const RING_SIZE = 100;

type HeroMetricsSectionProps = ViewProps & {
  attendancePercent?: number | string;
  marksPercent?: number | string;
  upcomingExamsCount?: number;
  pendingFeesCount?: number | string;
  onViewAttendance?: () => void;
  onViewMarks?: () => void;
  onUpcomingExams?: () => void;
  onPendingFees?: () => void;
  hasPendingFees?: boolean;
};

function CircularProgress({ value, size = RING_SIZE }: { value: number | string; size?: number }) {
  const pct = typeof value === 'number' ? value : parseFloat(String(value).replace('%', '')) || 0;
  const clamped = Math.min(100, Math.max(0, pct));
  const stroke = 8;
  const displayVal = typeof value === 'string' && value !== '' && !Number.isNaN(parseFloat(String(value))) ? value : `${Math.round(clamped)}%`;

  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderWidth: stroke }]} />
      <View style={[styles.ringCenter, { width: size, height: size }]}>
        <Text style={styles.ringValue}>{displayVal}</Text>
      </View>
    </View>
  );
}

export function HeroMetricsSection({
  attendancePercent,
  marksPercent,
  upcomingExamsCount = 0,
  pendingFeesCount = '—',
  onViewAttendance,
  onViewMarks,
  onUpcomingExams,
  onPendingFees,
  hasPendingFees,
  style,
  ...rest
}: HeroMetricsSectionProps) {
  const att = attendancePercent != null
    ? (typeof attendancePercent === 'number' ? attendancePercent : parseFloat(String(attendancePercent)) || 0)
    : 0;
  const marks = marksPercent != null
    ? (typeof marksPercent === 'number' ? marksPercent : parseFloat(String(marksPercent)) || 0)
    : 0;

  const SmallCard = ({
    label,
    value,
    onPress,
    icon,
  }: { label: string; value: string | number; onPress?: () => void; icon: keyof typeof Ionicons.glyphMap }) => {
    const content = (
      <View style={styles.smallCard}>
        <View style={styles.smallIconWrap}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.smallLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.smallValue}>{value}</Text>
      </View>
    );
    if (onPress) {
      return <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>{content}</Pressable>;
    }
    return content;
  };

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.mainRow}>
        <Pressable onPress={onViewAttendance} style={({ pressed }) => [styles.bigCard, pressed && styles.pressed]}>
          <CircularProgress value={att} />
          <Text style={styles.bigLabel}>Attendance</Text>
          <Text style={styles.bigSub}>OVERALL</Text>
        </Pressable>
        <Pressable onPress={onViewMarks} style={({ pressed }) => [styles.bigCard, pressed && styles.pressed]}>
          <CircularProgress value={marks} />
          <Text style={styles.bigLabel}>Marks</Text>
          <Text style={styles.bigSub}>AVERAGE %</Text>
        </Pressable>
      </View>

      <View style={styles.smallRow}>
        <SmallCard
          label="Upcoming Exams"
          value={upcomingExamsCount}
          onPress={onUpcomingExams}
          icon="calendar-outline"
        />
        <Pressable onPress={onPendingFees} style={({ pressed }) => [pressed && styles.pressed]}>
          <View style={styles.smallCard}>
            <View style={styles.smallIconWrap}>
              <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.smallLabel} numberOfLines={1}>Pending Fees</Text>
            <Text style={styles.smallValue}>{pendingFeesCount}</Text>
            {hasPendingFees ? (
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>Due</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: s.lg, marginBottom: s['2xl'] },
  mainRow: {
    flexDirection: 'row',
    gap: s.lg,
    marginBottom: s.lg,
  },
  bigCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: CARD_RADIUS,
    padding: s.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.md,
  },
  ringBg: {
    position: 'absolute',
    borderColor: colors.border,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bigLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bigSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  smallRow: {
    flexDirection: 'row',
    gap: s.lg,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: CARD_RADIUS,
    padding: s.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  smallIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    minWidth: 0,
  },
  smallValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.85 },
  dueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FF4D4F20',
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.danger,
  },
});
