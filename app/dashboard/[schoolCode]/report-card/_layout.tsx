import { Stack } from 'expo-router';

export default function ReportCardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="generate" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="templates" />
    </Stack>
  );
}
