import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Leftover } from '../../types/database';
import { getFreshnessStatus, FreshnessStatus } from '../../stores/leftoverStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface LeftoverItemProps {
  leftover: Leftover;
  onUpdatePortions: (id: string, portions: number) => void;
  onDelete: (id: string) => void;
}

const badgeColors: Record<FreshnessStatus, { bg: string; text: string }> = {
  Fresh: { bg: colors.primaryFixed, text: colors.primary },
  'Use Soon': { bg: colors.secondaryFixed, text: colors.secondary },
  Frozen: { bg: colors.surfaceContainerHighest, text: colors.onSurfaceVariant },
  Expired: { bg: colors.errorContainer, text: colors.error },
};

export function LeftoverItem({ leftover, onUpdatePortions, onDelete }: LeftoverItemProps) {
  const freshness = getFreshnessStatus(leftover);
  const badge = badgeColors[freshness];

  const handleDecrement = () => {
    if (leftover.portions > 0) {
      onUpdatePortions(leftover.id, leftover.portions - 1);
    }
  };

  const handleIncrement = () => {
    onUpdatePortions(leftover.id, leftover.portions + 1);
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.row}>
        {/* Left: Name + dates */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{leftover.name}</Text>
          <Text style={styles.dates}>
            Made {leftover.date_made} | Use by {leftover.use_by_date}
          </Text>
        </View>

        {/* Center: Freshness badge */}
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{freshness}</Text>
        </View>

        {/* Right: Portions stepper */}
        <View style={styles.stepper}>
          <Pressable
            onPress={handleDecrement}
            style={styles.stepperButton}
            accessibilityLabel="Decrease portions"
          >
            <MaterialCommunityIcons name="minus" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
          <Text style={styles.portionCount}>{leftover.portions}</Text>
          <Pressable
            onPress={handleIncrement}
            style={styles.stepperButton}
            accessibilityLabel="Increase portions"
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      {/* Delete action */}
      <Pressable onPress={() => onDelete(leftover.id)} style={styles.deleteRow}>
        <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
        <Text style={styles.deleteText}>Remove</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  dates: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.labelSm,
    textTransform: 'none',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionCount: {
    ...typography.labelLg,
    color: colors.onSurface,
    minWidth: 20,
    textAlign: 'center',
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  deleteText: {
    ...typography.labelSm,
    color: colors.error,
    textTransform: 'none',
  },
});
