import { Stack } from 'expo-router';

export default function AccountantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="accountant" />
    </Stack>
  );
}
