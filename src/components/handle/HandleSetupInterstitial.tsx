import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAuthStore } from '../../stores/authStore';
import { HandleInput } from './HandleInput';
import { HandleSuggestions } from './HandleSuggestions';
import { useHandleForm } from '../../hooks/useHandleForm';

interface HandleSetupInterstitialProps {
  onComplete: () => void;
}

export function HandleSetupInterstitial({ onComplete }: HandleSetupInterstitialProps) {
  const user = useAuthStore((s) => s.user);
  const updateHandle = useAuthStore((s) => s.updateHandle);
  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name;

  const {
    value,
    status,
    suggestions,
    submitting,
    setSubmitting,
    setStatus,
    onChangeText,
    onSelectSuggestion,
    canSubmit,
  } = useHandleForm(displayName);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const result = await updateHandle(value);

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } else {
      setStatus({
        state: 'taken',
        message: result.error || 'This handle was just taken',
      });
      setSubmitting(false);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.overlay}
      accessibilityViewIsModal={true}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.heading}>Choose your handle</Text>
          <Text style={styles.body}>
            Pick a unique @username that identifies you across SharedKitchen.
          </Text>

          <View style={styles.inputSection}>
            <HandleInput
              value={value}
              onChangeText={onChangeText}
              status={status}
            />
          </View>

          <View style={styles.suggestionsSection}>
            <HandleSuggestions
              suggestions={suggestions}
              onSelect={onSelectSuggestion}
            />
          </View>
        </View>

        <View style={styles.ctaContainer}>
          <Pressable
            style={[styles.ctaButton, !canSubmit && styles.ctaDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={[styles.ctaText, !canSubmit && styles.ctaTextDisabled]}>
                {canSubmit ? `Claim @${value}` : 'Choose a handle'}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  heading: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  inputSection: {
    marginTop: spacing.lg,
  },
  suggestionsSection: {
    marginTop: spacing.md,
  },
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  ctaText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  ctaTextDisabled: {
    color: colors.onSurfaceVariant,
  },
});
