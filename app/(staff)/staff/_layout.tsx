import { Stack } from 'expo-router';

export default function StaffStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="login" options={{ title: 'Staff / Teacher Login' }} />
    </Stack>
  );
}
