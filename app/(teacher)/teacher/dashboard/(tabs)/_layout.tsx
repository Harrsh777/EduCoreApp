/**
 * Teacher dashboard tabs: Home, Academics, Communication, Profile. Green active (#16A34A).
 */

import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

const TEACHER_GREEN = '#16A34A';
const INACTIVE_GREY = '#6B7280';

export default function TeacherTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TEACHER_GREEN,
        tabBarInactiveTintColor: INACTIVE_GREY,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
        tabBarStyle: { minHeight: 56 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'HOME',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          title: 'Academics',
          tabBarLabel: 'ACADEMICS',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: 'Communication',
          tabBarLabel: 'COMMUNICATION',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'PROFILE',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="my-school" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}
