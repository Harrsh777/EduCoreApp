import { Stack } from 'expo-router';

export default function ExaminationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[examId]" options={{ title: 'Exam' }} />
      <Stack.Screen name="marks-entry" options={{ title: 'Marks Entry' }} />
      <Stack.Screen name="marks-approval" options={{ title: 'Marks Approval' }} />
      <Stack.Screen name="report-card" options={{ title: 'Report Card' }} />
    </Stack>
  );
}
