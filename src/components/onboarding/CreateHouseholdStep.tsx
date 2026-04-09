import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { Input } from '../ui/Input';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { OnboardingProgress } from './OnboardingProgress';

const BOTTOM_FEATURES = [
  { icon: 'lock' as const, label: 'Private' },
  { icon: 'account-group' as const, label: 'Shared' },
  { icon: 'silverware-fork-knife' as const, label: 'Curated' },
];

export function CreateHouseholdStep() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const setHouseholdId = useOnboardingStore((s) => s.setHouseholdId);
  const createHousehold = useHouseholdStore((s) => s.createHousehold);

  const isValid = name.trim().length >= 2;

  const handleNext = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const household = await createHousehold(name.trim());
      if (household) {
        setHouseholdId(household.id);
        nextStep();
      } else {
        setError('Failed to create household. Please try again.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar: back arrow + branding */}
      <View style={styles.topBar}>
        <Pressable onPress={prevStep} hitSlop={12} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.brandText}>
          <Text style={styles.italic}>SharedKitchen</Text>
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Illustration area */}
      <View style={styles.illustrationArea}>
        <View style={styles.illustrationBg}>
          <MaterialCommunityIcons name="door" size={64} color={colors.onSurfaceVariant} />
        </View>
        <View style={styles.illustrationBadge}>
          <MaterialCommunityIcons name="home-variant" size={24} color={colors.primary} />
        </View>
      </View>

      {/* Progress */}
      <OnboardingProgress currentStep={1} totalSteps={6} />

      {/* Headline + subtitle */}
      <Text style={styles.headline}>
        <Text style={styles.italic}>Name your kitchen.</Text>
      </Text>
      <Text style={styles.subtitle}>
        Your household is the private space where you'll share recipes and plans.
      </Text>

      {/* Input card */}
      <View style={styles.inputCard}>
        <Input
          label="HOUSEHOLD NAME"
          placeholder="e.g., The Smith Kitchen"
          value={name}
          onChangeText={setName}
          error={error ?? undefined}
          autoFocus
          testID="onboarding-household-name-input"
        />
      </View>

      {/* Continue button */}
      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          !isValid && styles.disabled,
          pressed && isValid && styles.pressed,
        ]}
        onPress={handleNext}
        disabled={!isValid || loading}
        testID="onboarding-household-continue"
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <Text style={styles.continueText}>Continue</Text>
        )}
      </Pressable>

      {/* Skip for now */}
      <Pressable
        onPress={nextStep}
        style={styles.skipButton}
        testID="onboarding-household-skip"
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>

      {/* Bottom feature icons */}
      <View style={styles.bottomFeatures}>
        {BOTTOM_FEATURES.map((feat) => (
          <View key={feat.label} style={styles.bottomFeatureItem}>
            <View style={styles.bottomFeatureCircle}>
              <MaterialCommunityIcons name={feat.icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.bottomFeatureLabel}>{feat.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandText: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  italic: {
    fontStyle: 'italic',
  },
  illustrationArea: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  illustrationBg: {
    width: '70%',
    height: 160,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationBadge: {
    position: 'absolute',
    bottom: -12,
    right: '20%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  inputCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.editorial,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  continueText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  bottomFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  bottomFeatureItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  bottomFeatureCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomFeatureLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});
