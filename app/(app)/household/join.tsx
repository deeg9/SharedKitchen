import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHouseholdStore } from '../../../src/stores/householdStore';

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const { joinHousehold, loading } = useHouseholdStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValid = code.trim().length > 0;

  const handleJoin = async () => {
    if (!isValid) return;

    setError(null);
    const household = await joinHousehold(code.trim());

    if (household) {
      router.replace('/(app)/(tabs)/plan');
    } else {
      const storeError = useHouseholdStore.getState().error;
      setError(storeError ?? 'Failed to join household');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Join a Household</Text>
        <Text style={styles.subtitle}>
          Enter the invite code you received from a household member.
        </Text>

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Enter invite code"
          value={code}
          onChangeText={(text) => {
            setCode(text);
            if (error) setError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="join"
          onSubmitEditing={handleJoin}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Join Household</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    backgroundColor: '#f9f9f9',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
