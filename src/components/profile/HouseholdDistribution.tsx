import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface MemberContribution {
  id: string;
  displayName: string;
  count: number;
  color: string;
}

interface HouseholdDistributionProps {
  members: MemberContribution[];
}

export function HouseholdDistribution({ members }: HouseholdDistributionProps) {
  const totalCount = members.reduce((sum, m) => sum + m.count, 0);

  if (totalCount === 0) {
    return (
      <View style={styles.container} testID="household-distribution">
        <Text style={styles.sectionHeader}>HOUSEHOLD DISTRIBUTION</Text>
        <View style={styles.card}>
          <Text style={styles.emptyText}>No cooking data yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="household-distribution">
      <Text style={styles.sectionHeader}>HOUSEHOLD DISTRIBUTION</Text>
      <View style={styles.card}>
        {/* Stacked horizontal bar */}
        <View style={styles.bar}>
          {members.map((member) => (
            <View
              key={member.id}
              style={[
                styles.barSegment,
                {
                  flex: member.count,
                  backgroundColor: member.color,
                },
              ]}
            />
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {members.map((member) => {
            const percent = Math.round((member.count / totalCount) * 100);
            return (
              <View key={member.id} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: member.color }]}
                />
                <Text style={styles.legendText}>
                  {member.displayName} ({percent}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bar: {
    height: 12,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
