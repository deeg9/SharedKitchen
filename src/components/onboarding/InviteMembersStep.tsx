import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { OnboardingProgress } from './OnboardingProgress';

const SHARE_ICONS: Array<{
  icon: 'message-text-outline' | 'email-outline' | 'share-variant';
  label: string;
}> = [
  { icon: 'message-text-outline', label: 'Message' },
  { icon: 'email-outline', label: 'Email' },
  { icon: 'share-variant', label: 'Share' },
];

export function InviteMembersStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold);
  const household = activeHousehold();
  const inviteCode = household?.invite_code ?? '------';
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my kitchen on SharedKitchen! Use code: ${inviteCode}`,
      });
    } catch {
      // User cancelled share
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard.');
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={prevStep} hitSlop={12} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.brandText}>
          <Text style={styles.italic}>SharedKitchen</Text>
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Progress row with "Almost there" */}
      <View style={styles.progressRow}>
        <OnboardingProgress currentStep={2} totalSteps={6} />
        <Text style={styles.almostThere}>Almost there</Text>
      </View>

      {/* Headline + subtitle */}
      <Text style={styles.headline}>
        <Text style={styles.italic}>Invite your people</Text>
      </Text>
      <Text style={styles.subtitle}>
        Planning is better with help. Send this link to your partner or roommates to start curating together.
      </Text>

      {/* Photo placeholder with avatar overlay */}
      <View style={styles.photoArea}>
        <View style={styles.photoPlaceholder}>
          <MaterialCommunityIcons name="account-group" size={48} color={colors.outlineVariant} />
        </View>
        <View style={styles.avatarOverlay}>
          <MaterialCommunityIcons name="account-multiple" size={24} color={colors.primary} />
        </View>
      </View>

      {/* Invite code card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR UNIQUE INVITE CODE</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{inviteCode}</Text>
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.copyPill,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={copied ? 'check' : 'content-copy'}
              size={14}
              color={colors.onPrimary}
            />
            <Text style={styles.copyPillText}>{copied ? 'COPIED' : 'COPY'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Share icons */}
      <Text style={styles.shareViaText}>Or share directly via</Text>
      <View style={styles.shareIconsRow}>
        {SHARE_ICONS.map((item) => (
          <Pressable
            key={item.label}
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareIconCircle,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name={item.icon} size={22} color={colors.onSurface} />
          </Pressable>
        ))}
      </View>

      {/* Continue + Skip */}
      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          pressed && styles.pressed,
        ]}
        onPress={nextStep}
        testID="onboarding-invite-continue"
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>

      <Pressable
        onPress={nextStep}
        style={styles.skipButton}
        testID="onboarding-invite-skip"
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  almostThere: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  photoArea: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: -16,
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.float,
  },
  codeCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  codeLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    ...typography.headlineMd,
    color: colors.onSurface,
    letterSpacing: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  copyPillText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  pressed: {
    opacity: 0.85,
  },
  shareViaText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  shareIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  shareIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.editorial,
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
});
