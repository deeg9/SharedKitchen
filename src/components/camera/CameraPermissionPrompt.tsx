import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CameraPermissionPromptProps {
  isOpen: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

const benefits = [
  {
    icon: 'camera-outline' as const,
    text: 'Photograph your fridge or pantry to add items instantly',
  },
  {
    icon: 'food-variant' as const,
    text: 'Snap a photo of food to find matching recipes',
  },
  {
    icon: 'calendar-check-outline' as const,
    text: 'Log meals to your plan with a quick photo',
  },
];

export function CameraPermissionPrompt({ isOpen, onAllow, onDismiss }: CameraPermissionPromptProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onDismiss} snapPoints={['55%']}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="camera-outline" size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Scan food with your camera</Text>

        <View style={styles.benefitsList}>
          {benefits.map((benefit) => (
            <View key={benefit.icon} style={styles.benefitRow}>
              <MaterialCommunityIcons name={benefit.icon} size={24} color={colors.primary} />
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.allowButton}
          onPress={onAllow}
          accessibilityLabel="Allow camera access"
          accessibilityRole="button"
        >
          <Text style={styles.allowButtonText}>Allow Camera</Text>
        </Pressable>

        <Pressable
          onPress={onDismiss}
          accessibilityLabel="Dismiss camera permission"
          accessibilityRole="button"
        >
          <Text style={styles.dismissText}>Not Now</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleLg,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  benefitsList: {
    width: '100%',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  benefitText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  allowButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  allowButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  dismissText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
