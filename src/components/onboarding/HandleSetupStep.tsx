import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { HandleInput } from '../handle/HandleInput';
import { HandleSuggestions } from '../handle/HandleSuggestions';
import { useHandleForm } from '../../hooks/useHandleForm';

export function HandleSetupStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);
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
      nextStep();
    } else {
      setStatus({
        state: 'taken',
        message: result.error || 'This handle was just taken',
      });
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      bounces={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={styles.heading}>Pick your handle</Text>
        <Text style={styles.body}>
          This is your unique @username on SharedKitchen.
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
          testID="onboarding-handle-continue"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.ctaText, !canSubmit && styles.ctaTextDisabled]}>
              {canSubmit ? 'Continue to kitchen' : 'Choose a handle'}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xl,
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
    paddingTop: spacing.xl,
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
