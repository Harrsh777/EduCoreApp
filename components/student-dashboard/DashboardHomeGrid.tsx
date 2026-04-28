/**
 * Home 2×2 grid — each tile has its own pastel + accent (rose, violet, amber, cyan).
 */

import { STUDENT_HOME_TILES, studentDashboardTheme } from '@/theme/studentDashboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const { colors, spacing: s } = studentDashboardTheme;

const RING_SIZE = 52;
const STROKE = 5;
/** Short tiles; row height follows the taller cell in each pair */
const CELL_MIN_HEIGHT = 138;
const TILE_RADIUS = 16;

function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function CompactRing({
  value,
  ring,
  ringTrack,
}: {
  value: number | string;
  ring: string;
  ringTrack: string;
}) {
  const rawStr = typeof value === 'string' ? value.trim() : '';
  if (rawStr === '—' || rawStr === '-') {
    const cx0 = RING_SIZE / 2;
    const r0 = (RING_SIZE - STROKE) / 2;
    return (
      <View style={[styles.ringWrap, { width: RING_SIZE, height: RING_SIZE }]}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle cx={cx0} cy={cx0} r={r0} stroke={ringTrack} strokeWidth={STROKE} fill="none" />
        </Svg>
        <View style={[styles.ringCenter, { width: RING_SIZE, height: RING_SIZE }]}>
          <Text style={styles.ringValue}>—</Text>
        </View>
      </View>
    );
  }
  const pct = typeof value === 'number' ? value : parseFloat(String(value).replace('%', '')) || 0;
  const clamped = Math.min(100, Math.max(0, pct));
  const displayVal =
    typeof value === 'string' && value !== '' && !Number.isNaN(parseFloat(String(value)))
      ? value.includes('%')
        ? value
        : `${value}%`
      : `${Math.round(clamped)}%`;

  const radius = (RING_SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  return (
    <View style={[styles.ringWrap, { width: RING_SIZE, height: RING_SIZE }]}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <G transform={`rotate(-90 ${cx} ${cy})`}>
          <Circle cx={cx} cy={cy} r={radius} stroke={ringTrack} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={ring}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[styles.ringCenter, { width: RING_SIZE, height: RING_SIZE }]}>
        <Text style={styles.ringValue}>{displayVal}</Text>
      </View>
    </View>
  );
}

export type DashboardHomeGridProps = ViewProps & {
  attendancePercent?: number | string;
  classLabel: string;
  sectionLabel: string;
  teacherName: string;
  teacherDesignation: string;
  classTeacherLoading?: boolean;
  feesMonthTotal: number;
  feesQuarterTotal: number;
  receiptCount: number;
  feesLoading?: boolean;
  routeName: string;
  /** Bus identifier for home tile (e.g. "BUS-1") */
  transportBusLine?: string;
  /** Pickup / drop-off summary for home tile */
  transportStopsLine?: string;
  transportActive?: boolean;
  transportLoading?: boolean;
  onPressAttendance: () => void;
  onPressMyClass: () => void;
  onPressFees: () => void;
  onPressTransport: () => void;
};

export function DashboardHomeGrid({
  attendancePercent,
  classLabel,
  sectionLabel,
  teacherName,
  teacherDesignation,
  classTeacherLoading,
  feesMonthTotal,
  feesQuarterTotal,
  receiptCount,
  feesLoading,
  routeName,
  transportBusLine,
  transportStopsLine,
  transportActive = true,
  transportLoading,
  onPressAttendance,
  onPressMyClass,
  onPressFees,
  onPressTransport,
  style,
  ...rest
}: DashboardHomeGridProps) {
  const att = attendancePercent ?? '—';
  const t0 = STUDENT_HOME_TILES[0];
  const t1 = STUDENT_HOME_TILES[1];
  const t2 = STUDENT_HOME_TILES[2];
  const t3 = STUDENT_HOME_TILES[3];

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.row}>
        <Pressable
          onPress={onPressAttendance}
          style={({ pressed }) => [styles.cellCard, tileShell(t0), pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Attendance, view details"
        >
          <CompactRing value={att} ring={t0.ring} ringTrack={t0.ringTrack} />
          <Text style={[styles.cellTitle, styles.cellTitleStacked]}>Attendance</Text>
          <Text style={[styles.cellMeta, { color: t0.cta }]}>OVERALL</Text>
          <Text style={[styles.cta, { color: t0.cta }]}>View details →</Text>
        </Pressable>

        <Pressable
          onPress={onPressMyClass}
          style={({ pressed }) => [styles.cellCard, tileShell(t1), pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="My class"
        >
          <View style={styles.rowTitleIcon}>
            <Text style={styles.cellTitle}>My Class</Text>
            <View style={[styles.iconSoft, { backgroundColor: t1.iconBg }]}>
              <Ionicons name="people-outline" size={16} color={t1.icon} />
            </View>
          </View>
          {classTeacherLoading ? (
            <ActivityIndicator size="small" color={t1.icon} style={styles.inlineLoader} />
          ) : (
            <>
              <Text style={styles.infoLine} numberOfLines={2}>
                Class {classLabel} · Section {sectionLabel}
              </Text>
              <Text style={styles.metaLine} numberOfLines={2}>
                {teacherName} · {teacherDesignation}
              </Text>
            </>
          )}
          <Text style={[styles.cta, { color: t1.cta }]}>Open class →</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={onPressFees}
          style={({ pressed }) => [styles.cellCard, tileShell(t2), pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Fees and receipts"
        >
          <View style={styles.rowTitleIcon}>
            <Text style={styles.cellTitle}>Fees</Text>
            <View style={[styles.iconSoft, { backgroundColor: t2.iconBg }]}>
              <Ionicons name="wallet-outline" size={16} color={t2.icon} />
            </View>
          </View>
          {feesLoading ? (
            <ActivityIndicator size="small" color={t2.icon} style={styles.inlineLoader} />
          ) : (
            <>
              <Text style={styles.infoLine}>This month: {formatInr(feesMonthTotal)}</Text>
              <Text style={styles.infoLine}>This quarter: {formatInr(feesQuarterTotal)}</Text>
              <Text style={styles.metaLine}>
                {receiptCount} receipt{receiptCount === 1 ? '' : 's'}
              </Text>
            </>
          )}
          <Text style={[styles.cta, { color: t2.cta }]}>Open fee statement →</Text>
        </Pressable>

        <Pressable
          onPress={onPressTransport}
          style={({ pressed }) => [styles.cellCard, tileShell(t3), pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Transport route"
        >
          <View style={styles.rowTitleIcon}>
            <Text style={styles.cellTitle}>Transport</Text>
            <View style={[styles.iconSoft, { backgroundColor: t3.iconBg }]}>
              <Ionicons name="bus-outline" size={16} color={t3.icon} />
            </View>
          </View>
          {transportLoading ? (
            <ActivityIndicator size="small" color={t3.icon} style={styles.inlineLoader} />
          ) : transportActive ? (
            <>
              <Text style={styles.infoLine} numberOfLines={2}>
                {transportBusLine?.trim() ? transportBusLine : '—'}
              </Text>
              <Text style={styles.metaLine} numberOfLines={3}>
                {transportStopsLine?.trim() ? transportStopsLine : '—'}
              </Text>
            </>
          ) : (
            <Text style={styles.metaLine} numberOfLines={2}>
              {routeName}
            </Text>
          )}
          <Text style={[styles.cta, { color: t3.cta }]}>View route & stops →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function tileShell(tile: (typeof STUDENT_HOME_TILES)[number]) {
  return {
    backgroundColor: tile.bg,
    borderColor: tile.border,
    borderWidth: 1,
  };
}

const tileShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#312E81',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      }
    : Platform.OS === 'android'
      ? { elevation: 2 }
      : {};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: s.lg,
    marginBottom: s.xl,
  },
  row: {
    flexDirection: 'row',
    gap: s.md,
    marginBottom: s.md,
  },
  cellCard: {
    flex: 1,
    padding: s.md,
    minHeight: CELL_MIN_HEIGHT,
    justifyContent: 'flex-start',
    borderRadius: TILE_RADIUS,
    ...tileShadow,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  iconSoft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    alignSelf: 'center',
  },
  ringCenter: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowTitleIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: s.xs,
  },
  cellTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  /** Title row uses icon; no extra bottom margin on the label */
  cellTitleStacked: { marginBottom: 2 },
  cellMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  infoLine: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 16,
    marginBottom: 2,
  },
  metaLine: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
    marginBottom: 4,
  },
  cta: {
    marginTop: 'auto',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: -0.1,
  },
  inlineLoader: { marginVertical: s.xs },
});
