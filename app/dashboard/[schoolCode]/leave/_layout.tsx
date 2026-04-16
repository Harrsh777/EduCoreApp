import { Stack } from 'expo-router';

export default function LeaveLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="staff-leave-management" />
      <Stack.Screen name="student-leave" />
      <Stack.Screen name="staff-leave" />
      <Stack.Screen name="basics" />
    </Stack>
  );
}
