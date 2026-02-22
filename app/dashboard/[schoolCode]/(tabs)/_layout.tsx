/**
 * Bottom tabs: Home (module grid), My School, Dashboard (summary).
 * Active tab: indigo (#4F46E5). Inactive: grey. Min 44pt tap targets.
 */

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const INDIGO = '#4F46E5';
const GREY = '#9CA3AF';

export default function DashboardTabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: INDIGO,
        tabBarInactiveTintColor: GREY,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarStyle: { paddingBottom: Platform.OS === 'ios' ? 20 : 8, minHeight: 56 },
        tabBarItemStyle: { minHeight: 44 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-school"
        options={{
          title: 'My School',
          tabBarLabel: 'My School',
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
