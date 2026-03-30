import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface VisionLoadingOverlayProps {
  visible: boolean;
}

export function VisionLoadingOverlay({ visible }: VisionLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card} accessibilityLabel="Analyzing photo">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.title}>Analyzing photo...</Text>
        <Text style={styles.subtitle}>This usually takes a few seconds</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
