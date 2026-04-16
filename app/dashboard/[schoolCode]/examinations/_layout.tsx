import { Stack } from 'expo-router';

export default function ExaminationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="create" />
      <Stack.Screen name="grade-scale" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
