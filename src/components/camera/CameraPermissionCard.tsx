import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CameraPermissionCardProps {
  onOpenSettings?: () => void;
}

export function CameraPermissionCard({ onOpenSettings }: CameraPermissionCardProps) {
  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="camera-off-outline" size={32} color={colors.onSurfaceVariant} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.subtitle}>
          Open Settings to allow SharedKitchen to use your camera
        </Text>
      </View>
      <Pressable
        onPress={handleOpenSettings}
        accessibilityLabel="Open device settings"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  buttonText: {
    ...typography.labelLg,
    color: colors.primary,
  },
});
