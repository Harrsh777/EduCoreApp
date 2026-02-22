import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'EduCore',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#7C3AED',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="demo" options={{ title: 'Request a Demo' }} />
    </Stack>
  );
}
