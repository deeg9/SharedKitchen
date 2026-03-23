import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/stores/authStore';
import { useHouseholdStore } from '../../src/stores/householdStore';
import { colors } from '../../src/theme/colors';

const PENDING_JOIN_CODE_KEY = 'mise_pending_join_code';

export default function JoinByCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const joinHousehold = useHouseholdStore((s) => s.joinHousehold);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !code) return;

    const processJoin = async () => {
      if (!session) {
        // User not authenticated -- save code and redirect to sign-in
        await AsyncStorage.setItem(PENDING_JOIN_CODE_KEY, code);
        router.replace('/(auth)/sign-in');
        return;
      }

      // User is authenticated -- attempt to join
      const household = await joinHousehold(code);

      if (household) {
        setStatus('success');
        router.replace('/(app)/(tabs)/plan');
      } else {
        const storeError = useHouseholdStore.getState().error;
        setStatus('error');
        setErrorMessage(storeError ?? 'Failed to join household');
      }
    };

    processJoin();
  }, [initialized, session, code]);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Joining household...</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Text style={styles.subtext}>
            Please check the invite code and try again.
          </Text>
        </>
      )}
    </View>
  );
}

export { PENDING_JOIN_CODE_KEY };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: colors.outline,
    marginTop: 8,
    textAlign: 'center',
  },
});
