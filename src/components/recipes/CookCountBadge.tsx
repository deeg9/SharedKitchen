import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CookCountBadgeProps {
  count: number;
}

export function CookCountBadge({ count }: CookCountBadgeProps) {
  if (count === 0) {
    return (
      <Text
        style={styles.emptyText}
        accessibilityLabel="Not cooked yet"
      >
        Not cooked yet
      </Text>
    );
  }

  const label = count === 1 ? 'Cooked 1 time' : `Cooked ${count} times`;

  return (
    <View style={styles.badge} accessibilityLabel={label}>
      <MaterialCommunityIcons
        name="chef-hat"
        size={14}
        color={colors.onPrimaryContainer}
      />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
