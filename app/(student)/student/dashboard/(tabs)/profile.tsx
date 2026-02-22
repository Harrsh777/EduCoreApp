/**
 * Profile tab: Settings, Change Password, Log out.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useStudent } from '@/lib/student-context';
import { useAuthStore } from '@/lib/auth-store';
import { authService } from '@/services/auth.service';
import { SectionCard, ModuleButton } from '@/components/student-dashboard';
import { studentDashboardTheme } from '@/theme/studentDashboard';
import { STUDENT_DASHBOARD_SECTIONS } from '@/constants/studentDashboardMenu';
import { spacing } from '@/theme/spacing';

const { colors, screenRootWeb } = studentDashboardTheme;
const ACCOUNT_SECTION = STUDENT_DASHBOARD_SECTIONS.find((s) => s.id === 'account');

export default function ProfileTabScreen() {
  const router = useRouter();
  const { path } = useStudent();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    await logout();
    router.replace('/student/login' as never);
  }, [logout, router]);

  if (!ACCOUNT_SECTION) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title={ACCOUNT_SECTION.title}>
          {ACCOUNT_SECTION.modules.map((mod) => (
            <ModuleButton
              key={mod.id}
              icon={mod.icon}
              label={mod.label}
              onPress={() => router.push(path(mod.path) as never)}
            />
          ))}
          <ModuleButton
            icon="log-out-outline"
            label="Log out"
            onPress={handleLogout}
          />
        </SectionCard>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryBg, ...screenRootWeb },
  scroll: { flex: 1 },
  content: { paddingTop: spacing[6], paddingBottom: spacing[16] },
});
