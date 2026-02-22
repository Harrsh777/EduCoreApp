/**
 * Profile tab: quick links to Settings, Change Password, Institute Info, Logout.
 */

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTeacher } from '@/lib/teacher-context';
import { useAuthStore } from '@/lib/auth-store';
import { useLogout } from '@/hooks/useLogout';
import { teacherDashboardTheme } from '@/theme/teacherDashboard';
import { textStyles } from '@/theme/typography';

const { colors, spacing: s, cardRadius } = teacherDashboardTheme;

export default function TeacherProfileTabScreen() {
  const router = useRouter();
  const { teacher, path } = useTeacher();
  const profile = useAuthStore((s) => s.profile);
  const logout = useLogout();

  const fullName = teacher?.full_name ?? (profile?.name as string) ?? 'Teacher';

  const links = [
    { label: 'Institute Info', path: 'institute-info', icon: 'business' as const },
    { label: 'Settings', path: 'settings', icon: 'settings' as const },
    { label: 'Change Password', path: 'change-password', icon: 'key' as const },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(fullName || 'T').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.avatarDot} />
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.role}>Teacher</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {links.map((item) => (
            <Pressable
              key={item.path}
              style={styles.row}
              onPress={() => router.push(path(item.path) as never)}
            >
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.logoutBtn} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundStart },
  header: {
    paddingVertical: s['2xl'],
    paddingHorizontal: s.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: s.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  avatarDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  name: { ...textStyles.h3, color: colors.textPrimary },
  role: { ...textStyles.caption, color: colors.textSecondary, marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: s.lg, paddingBottom: s['3xl'] },
  card: { backgroundColor: colors.surface, borderRadius: cardRadius, borderWidth: 1, borderColor: colors.border, marginBottom: s.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.lg,
    paddingHorizontal: s.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: s.md,
  },
  rowLabel: { flex: 1, ...textStyles.body, fontWeight: '500', color: colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.sm,
    paddingVertical: s.lg,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.danger },
  bottomPad: { height: 80 },
});
