/**
 * Classes stack: overview, modify, subject-teachers, subjects, list, class detail.
 */

import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="overview" />
      <Stack.Screen name="modify" />
      <Stack.Screen name="subject-teachers" />
      <Stack.Screen name="subjects" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
