import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    text: { ...typography.labelMd },
  },
  md: {
    container: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg },
    text: { ...typography.labelLg },
  },
  lg: {
    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    text: { ...typography.titleMd },
  },
};

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      ...shadows.editorial,
    },
    text: { color: colors.onPrimary },
  },
  secondary: {
    container: {
      backgroundColor: colors.secondaryContainer,
    },
    text: { color: colors.onSecondaryContainer },
  },
  tertiary: {
    container: {
      backgroundColor: 'transparent',
    },
    text: { color: colors.primary },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: { color: colors.onSurfaceVariant },
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyle.text.color as string}
          size="small"
        />
      ) : (
        <Text style={[sizeStyle.text, variantStyle.text]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
