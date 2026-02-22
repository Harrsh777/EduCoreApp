import { Stack } from 'expo-router';

export default function AdminStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }} initialRouteName="(tabs)">
      <Stack.Screen name="login" options={{ title: 'School Admin Login' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
