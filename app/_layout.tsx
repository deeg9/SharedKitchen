import { useEffect, useState } from 'react';
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
import { useOnboardingStore } from '../src/stores/onboardingStore';
import { useHouseholdStore } from '../src/stores/householdStore';
import { ColorSchemeProvider } from '../src/lib/color-scheme';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, initialized, setSession, setInitialized } = useAuthStore();
  const { completed: onboardingCompleted, initialized: onboardingInitialized, checkOnboardingStatus } = useOnboardingStore();
  const { households, fetchHouseholds } = useHouseholdStore();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

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

  // Check onboarding status and fetch households when session is available
  useEffect(() => {
    if (!initialized || !session) return;

    const check = async () => {
      await checkOnboardingStatus();
      await fetchHouseholds();
      setOnboardingChecked(true);
    };

    check();
  }, [initialized, session]);

  // Hide splash screen when ready
  useEffect(() => {
    if (fontsLoaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialized]);

  // Auth-gated navigation with onboarding check
  useEffect(() => {
    if (!initialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = (segments as string[])[1] === 'onboarding';

    if (session && inAuthGroup) {
      // Authenticated user in auth screens -> check onboarding first
      if (onboardingChecked && !onboardingCompleted && households.length === 0) {
        router.replace('/(app)/onboarding');
      } else {
        router.replace('/(app)/(tabs)/plan');
      }
    } else if (!session && !inAuthGroup) {
      // Unauthenticated user outside auth screens -> redirect to sign-in
      router.replace('/(auth)/sign-in');
    } else if (session && !inOnboarding && onboardingChecked && !onboardingCompleted && households.length === 0) {
      // Authenticated user who hasn't completed onboarding and has no households
      router.replace('/(app)/onboarding');
    }
  }, [session, segments, initialized, fontsLoaded, onboardingChecked, onboardingCompleted, households]);

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
