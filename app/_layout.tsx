import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/stores/authStore';
import { ColorSchemeProvider } from '../src/lib/color-scheme';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, initialized, setSession, setInitialized } = useAuthStore();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!initialized) {
        setInitialized(true);
      }
    });

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Hide splash screen when ready
  useEffect(() => {
    if (fontsLoaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialized]);

  // Auth-gated navigation
  useEffect(() => {
    if (!initialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      // Authenticated user in auth screens -> redirect to app
      router.replace('/(app)/(tabs)/plan');
    } else if (!session && !inAuthGroup) {
      // Unauthenticated user outside auth screens -> redirect to sign-in
      router.replace('/(auth)/sign-in');
    }
  }, [session, segments, initialized, fontsLoaded]);

  // Show nothing until ready
  if (!fontsLoaded || !initialized) {
    return null;
  }

  return (
    <ColorSchemeProvider>
      <Slot />
    </ColorSchemeProvider>
  );
}
