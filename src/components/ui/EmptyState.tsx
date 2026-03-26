import React, { ComponentProps } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  loading,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={colors.outlineVariant}
      />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} loading={loading} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.lg,
  },
});
