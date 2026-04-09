import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface InsightCardProps {
  icon: string;
  message: string;
  badgeLabel?: string;
  rightIcon?: string;
  onPress?: () => void;
}

export function InsightCard({
  icon,
  message,
  badgeLabel,
  rightIcon,
  onPress,
}: InsightCardProps) {
  const content = (
    <>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={icon as any}
          size={24}
          color={colors.primary}
        />
      </View>

      <View style={styles.messageArea}>
        {badgeLabel ? (
          <Text style={styles.badgeLabel}>{badgeLabel}</Text>
        ) : null}
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {rightIcon ? (
        <View style={styles.rightBadge}>
          <MaterialCommunityIcons
            name={rightIcon as any}
            size={20}
            color={colors.onSurfaceVariant}
          />
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={message}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card} accessibilityLabel={message}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  messageArea: {
    flex: 1,
    marginHorizontal: spacing.sm,
  } as ViewStyle,
  badgeLabel: {
    ...typography.labelSm,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  rightBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});
