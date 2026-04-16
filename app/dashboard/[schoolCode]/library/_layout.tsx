import { Stack } from 'expo-router';

export default function LibraryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="basics" />
      <Stack.Screen name="catalogue" />
      <Stack.Screen name="transactions" />
    </Stack>
  );
}
