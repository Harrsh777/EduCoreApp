/**
 * Teacher dashboard stack: (tabs) + catch-all for module screens.
 */

import { Stack } from 'expo-router';

export default function TeacherDashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="[...slug]" options={{ title: 'Module' }} />
    </Stack>
  );
}
