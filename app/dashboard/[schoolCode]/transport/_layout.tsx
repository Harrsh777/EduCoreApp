import { Stack } from 'expo-router';

export default function TransportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="vehicles" />
      <Stack.Screen name="stops" />
      <Stack.Screen name="routes" />
      <Stack.Screen name="route-students" />
    </Stack>
  );
}
