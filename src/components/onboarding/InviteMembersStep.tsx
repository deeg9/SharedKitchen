import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useHouseholdStore } from '../../stores/householdStore';

export function InviteMembersStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>Invite your people</Text>
        <Text style={styles.subtitle}>
          Share your kitchen code so family or roommates can join and collaborate on meals.
        </Text>

        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>YOUR KITCHEN CODE</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{inviteCode}</Text>
            <Pressable onPress={handleCopy} hitSlop={12}>
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={22}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            onPress={handleShare}
            testID="onboarding-invite-share"
          >
            <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.onPrimary} />
            <Text style={styles.shareText}>Share via Text</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
            onPress={handleCopy}
          >
            <MaterialCommunityIcons name="link-variant" size={20} color={colors.secondary} />
            <Text style={styles.copyText}>
              {copied ? 'Copied!' : 'Copy Link'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.avatarRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.avatarPlaceholder, i > 0 && styles.avatarOverlap]}>
              <MaterialCommunityIcons name="account" size={24} color={colors.outlineVariant} />
            </View>
          ))}
          <Text style={styles.avatarHint}>Waiting for members...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={nextStep} style={styles.skipLink} testID="onboarding-invite-skip">
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  codeSection: {
    marginBottom: spacing.lg,
  },
  codeLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  codeText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 24,
    letterSpacing: 4,
    color: colors.onSurface,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  shareText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  copyButton: {
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  copyText: {
    ...typography.titleMd,
    color: colors.secondary,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 2,
    borderColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  avatarHint: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  skipLink: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
});
