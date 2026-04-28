import { Stack } from 'expo-router';

export default function AdminStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }} initialRouteName="(tabs)">
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="staff-directory" options={{ title: 'Staff Directory' }} />
      <Stack.Screen name="assign-class-teacher" options={{ title: 'Assign Class Teacher' }} />
      <Stack.Screen name="assign-subject-teacher" options={{ title: 'Assign Subject Teacher' }} />
      <Stack.Screen name="assign-role/[staffId]" options={{ title: 'Assign Role' }} />
      <Stack.Screen name="permission-override/[staffId]" options={{ title: 'Permission Override' }} />
    </Stack>
  );
}
