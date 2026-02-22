/**
 * Staff Management stack: directory, add, import, attendance.
 */

import { Stack } from 'expo-router';

export default function StaffManagementLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="import" />
      <Stack.Screen name="attendance" />
    </Stack>
  );
}
