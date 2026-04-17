/**
 * Student dashboard header — soft multi-stop gradient, colourful pill, violet actions.
 */

import { studentDashboardTheme, studentDashboardCardStyle } from '@/theme/studentDashboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const { colors, spacing: s } = studentDashboardTheme;

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
  onNotificationPress?: () => void;
  onMessagesPress?: () => void;
  onProfilePress?: () => void;
  avatarSource?: { uri: string } | null;
};

export function DashboardHeader({
  studentName,
  onNotificationPress,
  onMessagesPress,
  onProfilePress,
}: DashboardHeaderProps) {
  const greeting = getGreeting();
  const displayName = studentName || 'Student';
  const radius = studentDashboardTheme.cardRadius;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...colors.headerGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View style={[StyleSheet.absoluteFill, styles.glossBorder, { borderRadius: radius }]} />
      <View style={styles.row}>
        <View style={styles.greetingWrap}>
          <Text style={styles.greeting} numberOfLines={2}>
            {greeting},{' '}
            <Text style={styles.greetingName}>{displayName}</Text>
          </Text>
        </View>

        <View style={styles.rightRow}>
          {onMessagesPress ? (
            <Pressable
              onPress={onMessagesPress}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
              accessibilityLabel="Messages"
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.primaryBright} />
            </Pressable>
          ) : null}
          {onNotificationPress ? (
            <Pressable
              onPress={onNotificationPress}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={colors.primaryBright} />
              <View style={styles.notifBadge} />
            </Pressable>
          ) : null}
          {onProfilePress ? (
            <Pressable
              onPress={onProfilePress}
              style={({ pressed }) => [styles.avatarWrap, pressed && styles.iconPressed]}
              accessibilityLabel="Open profile"
            >
              <LinearGradient
                colors={['#A78BFA', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: studentDashboardTheme.cardRadius,
    overflow: 'hidden',
    marginHorizontal: s.xl,
    marginBottom: s['2xl'],
    ...studentDashboardCardStyle,
    borderWidth: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0.08,
  },
  glossBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    pointerEvents: 'none',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: s.lg,
    paddingHorizontal: s.lg,
  },
  greetingWrap: { flex: 1, minWidth: 0, marginRight: s.md },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  greetingName: {
    color: colors.primaryBright,
    fontWeight: '700',
  },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.12)',
  },
  iconPressed: { transform: [{ scale: 0.97 }] },
  avatarWrap: { position: 'relative' },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderColor: '#FFFFFF',
  },
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
