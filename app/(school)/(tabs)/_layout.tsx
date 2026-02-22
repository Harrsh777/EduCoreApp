import { useTheme } from '@/hooks/useTheme';
import { RoleGuard } from '@/lib/role-guard';
import { Tabs } from 'expo-router';

export default function SchoolTabsLayout() {
  const { colors: c } = useTheme();

  return (
    <RoleGuard allowedRoles={['admin']} redirectTo="/admin/login">
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: c.primary[600],
          tabBarInactiveTintColor: c.text.tertiary,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarLabel: 'Home' }} />
        <Tabs.Screen name="students" options={{ title: 'Students', tabBarLabel: 'Students' }} />
        <Tabs.Screen name="staff" options={{ title: 'Staff', tabBarLabel: 'Staff' }} />
        <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarLabel: 'Classes' }} />
        <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarLabel: 'Attendance' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarLabel: 'Calendar' }} />
        <Tabs.Screen name="communication" options={{ title: 'Communication', tabBarLabel: 'Comm' }} />
        <Tabs.Screen name="examinations" options={{ title: 'Examinations', tabBarLabel: 'Exams' }} />
        <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarLabel: 'Fees' }} />
        <Tabs.Screen name="library" options={{ title: 'Library', tabBarLabel: 'Library' }} />
        <Tabs.Screen name="transport" options={{ title: 'Transport', tabBarLabel: 'Transport' }} />
      </Tabs>
    </RoleGuard>
  );
}
