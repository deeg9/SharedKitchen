import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: colors.surfaceContainerLow,
    ...shadows.editorial,
  },
  filled: {
    backgroundColor: colors.surfaceContainer,
  },
  outlined: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
};

export function Card({ variant = 'elevated', children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
});
