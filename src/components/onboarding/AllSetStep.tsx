import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useOnboardingStore } from '../../stores/onboardingStore';

export function AllSetStep() {
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace('/(app)/(tabs)/plan');
  };

  return (
    <LinearGradient
      colors={[colors.inverseSurface, 'rgba(48,49,46,0.95)']}
      style={styles.container}
    >
      {/* Top-left branding with decorative lines */}
      <View style={styles.topBranding}>
        <Text style={styles.brandText}>
          <Text style={styles.italic}>SharedKitchen</Text>
        </Text>
        <View style={styles.decorativeLines}>
          <View style={styles.decorativeLine} />
          <View style={[styles.decorativeLine, styles.decorativeLineShort]} />
        </View>
      </View>

      {/* Center: glassmorphism card */}
      <View style={styles.centerArea}>
        {/* glassmorphism card */}
        <View style={styles.glassCard}>
          <Text style={styles.headline}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your kitchen is ready.{' '}
            <Text style={styles.boldText}>Let's get cooking.</Text>
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.pressed,
            ]}
            onPress={handleFinish}
            testID="onboarding-allset-done"
          >
            <Text style={styles.ctaText}>Go to my kitchen</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={colors.inverseSurface}
            />
          </Pressable>
        </View>
      </View>

      {/* Bottom toast row */}
      <View style={styles.bottomToast}>
        <View style={styles.toastAvatar}>
          <MaterialCommunityIcons name="account" size={18} color={colors.inversePrimary} />
        </View>
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastLabel}>NEW MEMBER JOINED</Text>
          <Text style={styles.toastMessage}>Welcome home, Chef.</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  topBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandText: {
    ...typography.bodyLg,
    color: colors.inverseOnSurface,
  },
  italic: {
    fontStyle: 'italic',
  },
  decorativeLines: {
    flex: 1,
    gap: spacing.xs,
  },
  decorativeLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  decorativeLineShort: {
    width: '60%',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // glassmorphism effect
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    width: '100%',
  },
  headline: {
    ...typography.headlineLg,
    color: colors.inverseOnSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.inverseOnSurface,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  boldText: {
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: colors.inversePrimary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
  },
  ctaText: {
    ...typography.titleMd,
    color: colors.inverseSurface,
  },
  bottomToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  toastAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastTextContainer: {
    flex: 1,
  },
  toastLabel: {
    ...typography.labelSm,
    color: colors.inverseOnSurface,
    opacity: 0.7,
  },
  toastMessage: {
    ...typography.bodyMd,
    color: colors.inverseOnSurface,
  },
});
