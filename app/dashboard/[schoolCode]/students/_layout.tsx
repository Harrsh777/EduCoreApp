/**
 * Student Management stack: directory, add, import, attendance, [id] view/edit.
 */

import { Stack } from 'expo-router';

export default function StudentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="import" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
