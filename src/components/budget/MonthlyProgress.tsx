import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DonutChart } from '../ui/DonutChart';
import { spacing } from '../../theme/spacing';

interface MonthlyProgressProps {
  spent: number;
  target: number;
}

export function MonthlyProgress({ spent, target }: MonthlyProgressProps) {
  const percentage = target > 0 ? Math.round((spent / target) * 100) : 0;

  return (
    <View style={styles.container} testID="budget-donut-chart">
      <DonutChart
        value={spent}
        max={target}
        label={`$${Math.round(spent)}`}
        sublabel={`of $${target} spent`}
        badgeLabel={`${percentage}%`}
        size={200}
        strokeWidth={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
});
