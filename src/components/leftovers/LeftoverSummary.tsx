import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface LeftoverSummaryProps {
  totalCount: number;
  breakdown: {
    fresh: number;
    useSoon: number;
    frozen: number;
    expired: number;
  };
}

const statusDots = [
  { key: 'fresh', label: 'Fresh', color: colors.primary },
  { key: 'useSoon', label: 'Use Soon', color: colors.secondary },
  { key: 'frozen', label: 'Frozen', color: colors.onSurfaceVariant },
  { key: 'expired', label: 'Expired', color: colors.error },
] as const;

export function LeftoverSummary({ totalCount, breakdown }: LeftoverSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {totalCount} {totalCount === 1 ? 'item' : 'items'} tracked
      </Text>
      <View style={styles.statusRow}>
        {statusDots.map((s) => {
          const count = breakdown[s.key];
          if (count === 0) return null;
          return (
            <View key={s.key} style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.statusText}>
                {count} {s.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
