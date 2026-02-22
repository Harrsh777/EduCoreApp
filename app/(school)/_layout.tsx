import { Stack } from 'expo-router';

export default function SchoolLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="students/[id]" options={{ headerShown: true, title: 'Student' }} />
      <Stack.Screen name="examinations" options={{ headerShown: false }} />
    </Stack>
  );
}
