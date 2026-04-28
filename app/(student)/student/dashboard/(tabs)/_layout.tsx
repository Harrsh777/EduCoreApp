/**
 * Student dashboard tabs: Home, My Class, Attendance, Profile.
 * Glass blur bottom nav.
 */

import { Tabs } from 'expo-router';
import { StudentTabBar } from '@/components/student-dashboard';
import { studentDashboardTheme } from '@/theme/studentDashboard';

const { colors } = studentDashboardTheme;

export default function StudentTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <StudentTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="my-school" options={{ title: 'My Class' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="academics" options={{ href: null }} />
      <Tabs.Screen name="requests" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}
