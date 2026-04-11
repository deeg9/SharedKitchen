import React from 'react';
import { View, TextInput, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface HandleInputStatus {
  state: 'idle' | 'checking' | 'available' | 'taken' | 'error';
  message: string;
}

interface HandleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  status: HandleInputStatus;
}

const BORDER_COLOR: Record<HandleInputStatus['state'], string> = {
  idle: colors.outline,
  checking: colors.outline,
  available: colors.primary,
  taken: colors.error,
  error: colors.error,
};

const HELPER_COLOR: Record<HandleInputStatus['state'], string> = {
  idle: colors.onSurfaceVariant,
  checking: colors.onSurfaceVariant,
  available: colors.primary,
  taken: colors.error,
  error: colors.error,
};

function StatusIcon({ state }: { state: HandleInputStatus['state'] }) {
  if (state === 'checking') {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        <ActivityIndicator size={16} color={colors.onSurfaceVariant} />
      </Animated.View>
    );
  }
  if (state === 'available') {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
      </Animated.View>
    );
  }
  if (state === 'taken' || state === 'error') {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
      </Animated.View>
    );
  }
  return null;
}

export function HandleInput({ value, onChangeText, status }: HandleInputProps) {
  const handleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    onChangeText(cleaned);
  };

  return (
    <View>
      <View style={[styles.container, { borderColor: BORDER_COLOR[status.state] }]}>
        <Text style={styles.prefix}>@</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder="username"
          placeholderTextColor={colors.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          textContentType="username"
          accessibilityLabel="Handle input"
          accessibilityHint="Enter your unique username"
        />
        {status.state !== 'idle' && (
          <View style={styles.iconContainer}>
            <StatusIcon state={status.state} />
          </View>
        )}
      </View>
      <View accessibilityLiveRegion="polite" style={styles.helperContainer}>
        <Text style={[styles.helperText, { color: HELPER_COLOR[status.state] }]}>
          {status.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  prefix: {
    ...typography.bodyLg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.onSurfaceVariant,
    width: 20,
  },
  input: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
    height: '100%',
    padding: 0,
  },
  iconContainer: {
    marginLeft: spacing.sm,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  helperText: {
    ...typography.bodySm,
  },
});
