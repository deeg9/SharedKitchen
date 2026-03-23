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
import { colors } from '../../../src/theme/colors';

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
            <ActivityIndicator color={colors.onPrimary} />
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
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.onSurface,
  },
  inputError: {
    backgroundColor: colors.errorContainer,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: colors.outline,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});
