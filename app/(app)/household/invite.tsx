import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { InviteCard } from '../../../src/components/household/InviteCard';
import { colors } from '../../../src/theme/colors';

export default function InviteScreen() {
  const router = useRouter();
  const activeHousehold = useHouseholdStore((s) => s.activeHousehold)();

  if (!activeHousehold) {
    return (
      <View style={styles.container}>
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
        // expo-sharing shares files, so we use the share sheet via clipboard + alert approach
        // For a better UX, use Share from react-native directly
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
    router.replace('/(app)/(tabs)/plan');
  };

  return (
    <View style={styles.container}>
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
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginBottom: 32,
    lineHeight: 22,
  },
  hint: {
    fontSize: 14,
    color: colors.outline,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  doneButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});
