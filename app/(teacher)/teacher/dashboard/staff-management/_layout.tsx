import { Stack } from 'expo-router';

export default function StaffManagementLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="directory" />
    </Stack>
  );
}
