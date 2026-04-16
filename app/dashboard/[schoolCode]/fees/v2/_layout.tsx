import { Stack } from 'expo-router';

export default function FeesV2Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="fee-heads" />
      <Stack.Screen name="fee-structures" />
      <Stack.Screen name="collection" />
    </Stack>
  );
}
