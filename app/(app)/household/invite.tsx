import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { InviteCard } from '../../../src/components/household/InviteCard';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';

export default function InviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold)();

  if (!activeHousehold) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No active household found.</Text>
      </View>
    );
  }

  const inviteLink = `mise://join/${activeHousehold.invite_code}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteLink);
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        const { Share } = require('react-native');
        await Share.share({
          message: `Join my household on SharedKitchen! Use code: ${activeHousehold.invite_code}\n\nOr open this link: ${inviteLink}`,
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      // User cancelled sharing, no action needed
    }
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Invite Members</Text>
        <Text style={styles.subtitle}>
          Share this code with your household members so they can join.
        </Text>

        <InviteCard
          inviteCode={activeHousehold.invite_code}
          onCopy={handleCopy}
          onShare={handleShare}
        />

        <Text style={styles.hint}>
          Members can enter this code in the app, or open the link to join automatically.
        </Text>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  hint: {
    ...typography.bodyMd,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
  },
  errorText: {
    ...typography.bodyLg,
    color: colors.error,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  doneButtonText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
