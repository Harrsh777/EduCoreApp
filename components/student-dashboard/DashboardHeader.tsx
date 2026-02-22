/**
 * Student dashboard header: greeting + class pill on left, messages + notifications + avatar on right.
 * Matches design: "Good Morning, Name 👋", "Class 10 • Sec A" pill, profile with green dot on right.
 */

import { studentDashboardTheme } from '@/theme/studentDashboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const { colors, spacing: s, cardRadius } = studentDashboardTheme;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

type DashboardHeaderProps = {
  studentName: string;
  classSection: string;
  onNotificationPress?: () => void;
  onMessagesPress?: () => void;
  onProfilePress?: () => void;
  avatarSource?: { uri: string } | null;
};

export function DashboardHeader({
  studentName,
  classSection,
  onNotificationPress,
  onMessagesPress,
  onProfilePress,
}: DashboardHeaderProps) {
  const greeting = getGreeting();
  const displayName = studentName || 'Student';

  return (
    <View style={styles.wrap}>
      <View style={[StyleSheet.absoluteFill, styles.bg]} />
      <View style={styles.row}>
        <View style={styles.greetingWrap}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}, {displayName} 👋
          </Text>
          {classSection ? (
            <View style={styles.classPill}>
              <Text style={styles.classPillText} numberOfLines={1}>
            {classSection.includes(' • ') ? `Class ${classSection.split(' • ')[0]} • Sec ${classSection.split(' • ')[1] ?? ''}` : classSection ? `Class ${classSection}` : classSection}
          </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightRow}>
          {onMessagesPress && (
            <Pressable
              onPress={onMessagesPress}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel="Messages"
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          )}
          <Pressable
            onPress={onNotificationPress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            <View style={styles.notifBadge} />
          </Pressable>
          <Pressable
            onPress={onProfilePress}
            style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
            accessibilityLabel="Open profile"
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <View style={styles.onlineDot} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: cardRadius,
    overflow: 'hidden',
    marginHorizontal: s.lg,
    marginBottom: s.xl,
  },
  bg: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: cardRadius,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: s.xl,
    paddingHorizontal: s.xl,
  },
  greetingWrap: { flex: 1, minWidth: 0, marginRight: s.md },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  classPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },
  classPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});
