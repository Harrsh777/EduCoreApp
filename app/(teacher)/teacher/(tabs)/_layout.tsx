import { useTheme } from '@/hooks/useTheme';
import { RoleGuard } from '@/lib/role-guard';
import { Tabs } from 'expo-router';

export default function TeacherTabsLayout() {
  const { colors: c } = useTheme();

  return (
    <RoleGuard allowedRoles={['teacher']} redirectTo="/staff/login">
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: c.primary[600],
          tabBarInactiveTintColor: c.text.tertiary,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarLabel: 'Home' }} />
        <Tabs.Screen name="my-classes" options={{ title: 'My Classes', tabBarLabel: 'Classes' }} />
        <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarLabel: 'Attendance' }} />
        <Tabs.Screen name="marks-entry" options={{ title: 'Marks Entry', tabBarLabel: 'Marks' }} />
        <Tabs.Screen name="todos" options={{ title: 'Todos', tabBarLabel: 'Todos' }} />
        <Tabs.Screen name="leave-apply" options={{ title: 'Apply Leave', tabBarLabel: 'Leave' }} />
        <Tabs.Screen name="leave-approvals" options={{ title: 'Leave Approvals', tabBarLabel: 'Approvals' }} />
        <Tabs.Screen name="homework" options={{ title: 'Homework', tabBarLabel: 'Homework' }} />
      </Tabs>
    </RoleGuard>
  );
}
