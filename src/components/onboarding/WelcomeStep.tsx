import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useOnboardingStore } from '../../stores/onboardingStore';

export function WelcomeStep() {
  const router = useRouter();
  const nextStep = useOnboardingStore((s) => s.nextStep);

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={64}
            color={colors.primary}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.headline}>
          Welcome to <Text style={styles.italic}>SharedKitchen</Text>
        </Text>
        <Text style={styles.subtitle}>
          Plan dinners together, not alone.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.pressed,
          ]}
          onPress={nextStep}
          testID="onboarding-welcome-continue"
        >
          <Text style={styles.continueText}>Continue</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={colors.onPrimary}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/sign-in')}
          style={styles.signInLink}
          testID="onboarding-welcome-signin"
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInBold}>Sign In</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
  content: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  headline: {
    ...typography.displayLg,
    color: colors.onSurface,
    textAlign: 'center',
  },
  italic: {
    fontStyle: 'italic',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    gap: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  continueText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signInText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  signInBold: {
    ...typography.labelLg,
    color: colors.primary,
  },
});
