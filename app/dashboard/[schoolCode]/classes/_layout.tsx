/**
 * Classes stack: list, class detail + subject-teacher assignment.
 */

import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
