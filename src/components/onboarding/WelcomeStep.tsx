import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { OnboardingProgress } from './OnboardingProgress';

const FEATURES = [
  {
    icon: 'format-list-checks' as const,
    title: 'Shared Lists',
    description: 'Sync groceries in real-time with your partner.',
  },
  {
    icon: 'book-open-variant' as const,
    title: 'Recipe Curation',
    description: 'Import from any site and organize together.',
  },
];

export function WelcomeStep() {
  const router = useRouter();
  const nextStep = useOnboardingStore((s) => s.nextStep);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero photo area */}
      <View style={styles.heroContainer}>
        <View style={styles.heroImage}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={56}
            color={colors.primary}
          />
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <OnboardingProgress currentStep={0} totalSteps={6} />
      </View>

      {/* Headline + subtitle */}
      <View style={styles.content}>
        <Text style={styles.headline}>
          Welcome to{'\n'}
          <Text style={styles.italic}>SharedKitchen</Text>
        </Text>
        <Text style={styles.subtitle}>
          Plan dinners together, not alone. The collaborative kitchen assistant for couples and households.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctaSection}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={nextStep}
          testID="onboarding-welcome-continue"
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={colors.onPrimary}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/sign-in')}
          style={styles.secondaryButton}
          testID="onboarding-welcome-signin"
        >
          <Text style={styles.secondaryButtonText}>
            I already have an account
          </Text>
        </Pressable>
      </View>

      {/* Feature highlights */}
      <View style={styles.featuresSection}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIconCircle}>
              <MaterialCommunityIcons
                name={feature.icon}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
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
  heroContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  content: {
    marginTop: spacing.sm,
  },
  headline: {
    ...typography.displayLg,
    color: colors.onSurface,
  },
  italic: {
    fontStyle: 'italic',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'left',
    marginTop: spacing.sm,
  },
  ctaSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  featuresSection: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  featureDescription: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
});
