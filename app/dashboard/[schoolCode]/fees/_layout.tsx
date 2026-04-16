import { Stack } from 'expo-router';

export default function FeesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="statements" />
      <Stack.Screen name="discounts-fines" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="v2" />
    </Stack>
  );
}
