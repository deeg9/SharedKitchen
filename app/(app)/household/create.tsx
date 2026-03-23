import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHouseholdStore } from '../../../src/stores/householdStore';

export default function CreateHouseholdScreen() {
  const router = useRouter();
  const { createHousehold, loading } = useHouseholdStore();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length >= 2 && name.trim().length <= 50;

  const handleCreate = async () => {
    if (!isValid) {
      setError('Household name must be between 2 and 50 characters');
      return;
    }

    setError(null);
    const household = await createHousehold(name.trim());

    if (household) {
      router.push('/(app)/household/invite');
    } else {
      const storeError = useHouseholdStore.getState().error;
      setError(storeError ?? 'Failed to create household');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create a Household</Text>
        <Text style={styles.subtitle}>
          Give your household a name. You can invite members after creating it.
        </Text>

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="e.g., The Smith Kitchen"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError(null);
          }}
          maxLength={50}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.charCount}>
          {name.trim().length}/50 characters
        </Text>

        <TouchableOpacity
          style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Household</Text>
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
    fontSize: 18,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
