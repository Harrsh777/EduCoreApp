import { useTheme } from '@/hooks/useTheme';
import { RoleGuard } from '@/lib/role-guard';
import { Tabs } from 'expo-router';

export default function StudentTabsLayout() {
  const { colors: c } = useTheme();

  return (
    <RoleGuard allowedRoles={['student']} redirectTo="/student/login">
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: c.primary[600],
          tabBarInactiveTintColor: c.text.tertiary,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarLabel: 'Home' }} />
        <Tabs.Screen name="my-class" options={{ title: 'My Class', tabBarLabel: 'Class' }} />
        <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarLabel: 'Attendance' }} />
        <Tabs.Screen name="marks" options={{ title: 'Marks', tabBarLabel: 'Marks' }} />
        <Tabs.Screen name="exams" options={{ title: 'Exams', tabBarLabel: 'Exams' }} />
        <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarLabel: 'Fees' }} />
        <Tabs.Screen name="transport" options={{ title: 'Transport', tabBarLabel: 'Transport' }} />
        <Tabs.Screen name="diary" options={{ title: 'Diary', tabBarLabel: 'Diary' }} />
        <Tabs.Screen name="library" options={{ title: 'Library', tabBarLabel: 'Library' }} />
        <Tabs.Screen name="apply-leave" options={{ title: 'Apply Leave', tabBarLabel: 'Leave' }} />
      </Tabs>
    </RoleGuard>
  );
}
