import { Stack } from 'expo-router';
import { StudentProvider } from '@/lib/student-context';

export default function StudentStackLayout() {
  return (
    <StudentProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ title: 'Student Login' }} />
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard" />
      </Stack>
    </StudentProvider>
  );
}
