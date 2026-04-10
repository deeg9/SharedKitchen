import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { AlertDialog } from '../ui/AlertDialog';
import { openCheckout } from '../../lib/stripe';
import { colors } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface UpgradePromptProps {
  visible: boolean;
  onDismiss: () => void;
  feature?: string;
}

const FEATURE_LIST = [
  { icon: 'chart-line' as const, label: 'Advanced Analytics Dashboard' },
  { icon: 'lightbulb-on-outline' as const, label: 'AI-Powered Meal Suggestions' },
  { icon: 'book-open-variant' as const, label: 'Unlimited Recipe Storage' },
  { icon: 'clipboard-list-outline' as const, label: 'Export Grocery Lists' },
];

export function UpgradePrompt({ visible, onDismiss, feature }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{ visible: boolean; message: string } | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const success = await openCheckout();
      if (success) {
        onDismiss();
      }
    } catch (err: any) {
      setErrorAlert({ visible: true, message: err.message ?? 'Payment could not be completed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={visible} onClose={onDismiss} snapPoints={['55%']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.crownCircle}>
            <MaterialCommunityIcons name="crown" size={28} color={colors.secondary} />
          </View>
          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>
            Get the most out of your kitchen experience
          </Text>
        </View>

        {/* Feature List */}
        <View style={styles.featureList}>
          {FEATURE_LIST.map((item) => (
            <View key={item.label} style={styles.featureRow}>
              <Checkbox checked={true} onToggle={() => {}} disabled size="sm" />
              <Text style={styles.featureText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Price */}
        <Text style={styles.price}>$9.99/month</Text>

        {/* Upgrade Button */}
        <Button
          variant="secondary"
          size="lg"
          onPress={handleUpgrade}
          disabled={loading}
          style={styles.upgradeButton}
          testID="upgrade-prompt-button"
        >
          {loading ? <ActivityIndicator size={18} color="#ffffff" /> : 'Upgrade to Premium'}
        </Button>

        {/* Maybe Later */}
        <Pressable onPress={onDismiss} style={styles.laterButton} testID="upgrade-prompt-later">
          <Text style={styles.laterText}>Maybe Later</Text>
        </Pressable>
      </View>

      {errorAlert && (
        <AlertDialog
          visible={errorAlert.visible}
          onClose={() => setErrorAlert(null)}
          title="Payment Error"
          message={errorAlert.message}
          actions={[{ label: 'OK', variant: 'primary', onPress: () => setErrorAlert(null) }]}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  crownCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm,
  },
  featureText: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
  },
  price: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  laterButton: {
    paddingVertical: spacing.sm,
  },
  laterText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
});
