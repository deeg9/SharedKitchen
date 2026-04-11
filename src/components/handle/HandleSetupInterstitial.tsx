import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero icon */}
          <View style={styles.heroContainer}>
            <View style={styles.heroImage}>
              <MaterialCommunityIcons
                name="at"
                size={56}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.heading}>
              Choose your{'\n'}
              <Text style={styles.headingItalic}>handle</Text>
            </Text>
            <Text style={styles.body}>
              Pick a unique @username that identifies you across SharedKitchen. Other members will see this on your recipes, comments, and cook logs.
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
        </ScrollView>

        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              !canSubmit && styles.ctaDisabled,
              pressed && canSubmit && styles.ctaPressed,
            ]}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  heading: {
    ...typography.displayLg,
    color: colors.onSurface,
  },
  headingItalic: {
    fontStyle: 'italic',
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  inputSection: {
    marginTop: spacing.xl,
  },
  suggestionsSection: {
    marginTop: spacing.md,
  },
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.editorial,
  },
  ctaDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  ctaTextDisabled: {
    color: colors.onSurfaceVariant,
  },
});
