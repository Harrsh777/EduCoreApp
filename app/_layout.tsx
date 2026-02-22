import { useAuthStore } from '@/lib/auth-store';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Playfair: PlayfairDisplay_400Regular,
    PlayfairBold: PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
   <View style={{ flex: 1, backgroundColor: 'black' }}>
  <Slot />
</View>
    </QueryClientProvider>
  );
}
