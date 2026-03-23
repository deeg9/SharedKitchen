import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface MonthlyProgressProps {
  spent: number;
  target: number;
}

export function MonthlyProgress({ spent, target }: MonthlyProgressProps) {
  const remaining = Math.max(target - spent, 0);
  const percentage = target > 0 ? Math.round((spent / target) * 100) : 0;
  const progressWidth = Math.min(percentage, 100);

  return (
    <Card variant="filled" style={styles.card}>
      <Text style={styles.label}>MONTHLY BUDGET</Text>
      <View style={styles.amountRow}>
        <Text style={styles.spent}>${Math.round(spent)}</Text>
        <Text style={styles.ofTarget}> of ${target} spent</Text>
      </View>
      <Text style={styles.remaining}>${remaining} left</Text>
      <Text style={styles.percentage}>{percentage}% of budget used</Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressWidth}%` },
          ]}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spent: {
    ...typography.displayLg,
    color: colors.onSurface,
  },
  ofTarget: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  remaining: {
    ...typography.titleMd,
    color: colors.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  percentage: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondaryContainer,
    borderRadius: borderRadius.full,
  },
});
