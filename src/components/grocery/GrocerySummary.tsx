import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { GrocerySummary as GrocerySummaryType } from '../../types/database';

interface GrocerySummaryProps {
  summary: GrocerySummaryType;
}

export function GrocerySummary({ summary }: GrocerySummaryProps) {
  return (
    <Card variant="filled" style={styles.container} testID="grocery-summary">
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.totalItems}</Text>
          <Text style={styles.statLabel}>items</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            ~${summary.estimatedTotal.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>est. total</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {summary.checkedItems}/{summary.totalItems}
          </Text>
          <Text style={styles.statLabel}>checked</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${summary.progressPercent}%` },
          ]}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  statLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'none',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.outlineVariant,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
});
