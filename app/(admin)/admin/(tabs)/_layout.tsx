import { useTheme } from '@/hooks/useTheme';
import { RoleGuard } from '@/lib/role-guard';
import { Tabs } from 'expo-router';

export default function AdminTabsLayout() {
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
        <Tabs.Screen name="index" options={{ title: 'Overview', tabBarLabel: 'Overview' }} />
        <Tabs.Screen name="schools" options={{ title: 'Schools', tabBarLabel: 'Schools' }} />
        <Tabs.Screen name="demo-requests" options={{ title: 'Demo Requests', tabBarLabel: 'Demos' }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarLabel: 'Analytics' }} />
        <Tabs.Screen name="users" options={{ title: 'Users', tabBarLabel: 'Users' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarLabel: 'Settings' }} />
      </Tabs>
    </RoleGuard>
  );
}
