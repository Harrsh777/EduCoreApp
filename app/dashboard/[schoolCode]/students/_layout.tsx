/**
 * Student Management stack: directory, add, import, attendance, mark-attendance, attendance-report, siblings, [id].
 */

import { Stack } from 'expo-router';

export default function StudentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="directory" />
      <Stack.Screen name="add" />
      <Stack.Screen name="import" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="mark-attendance" />
      <Stack.Screen name="attendance-report" />
      <Stack.Screen name="siblings" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
