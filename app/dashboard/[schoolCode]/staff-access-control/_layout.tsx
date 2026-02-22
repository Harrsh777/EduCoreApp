/**
 * Staff access control stack: list, [staffId] permission matrix.
 */

import { Stack } from 'expo-router';

export default function StaffAccessControlLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[staffId]" />
    </Stack>
  );
}
