import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { PresenceAvatarStack } from '../presence/PresenceAvatarStack';
import { PresenceMember } from '../../hooks/usePresence';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { GrocerySummary as GrocerySummaryType } from '../../types/database';

interface GrocerySummaryProps {
  summary: GrocerySummaryType;
  presenceMembers?: PresenceMember[];
}

export function GrocerySummary({ summary, presenceMembers = [] }: GrocerySummaryProps) {
  return (
    <Card variant="elevated" style={styles.container} testID="grocery-summary">
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Weekly Grocery List</Text>
        {presenceMembers.length > 0 && (
          <PresenceAvatarStack members={presenceMembers} />
        )}
      </View>

      {/* Subtitle row */}
      <Text style={styles.subtitle}>
        {summary.totalItems} items {'\u00B7'} ~${summary.estimatedTotal.toFixed(0)} estimated
      </Text>

      {/* Progress section */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>SHOPPING PROGRESS</Text>
          <Text style={styles.progressCount}>
            {summary.checkedItems} of {summary.totalItems} items checked
          </Text>
        </View>
        <ProgressBar value={summary.checkedItems} max={summary.totalItems} height={10} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  progressCount: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'none',
  },
});
