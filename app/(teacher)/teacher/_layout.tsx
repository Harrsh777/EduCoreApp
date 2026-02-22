import { Stack } from 'expo-router';
import { RoleGuard } from '@/lib/role-guard';
import { TeacherProvider } from '@/lib/teacher-context';

export default function TeacherStackLayout() {
  return (
    <RoleGuard allowedRoles={['teacher']} redirectTo="/staff/login">
      <TeacherProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard" />
        </Stack>
      </TeacherProvider>
    </RoleGuard>
  );
}
