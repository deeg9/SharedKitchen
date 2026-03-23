import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <View
              key={i}
              style={[
                styles.dot,
                isCompleted && styles.dotCompleted,
                isCurrent && styles.dotCurrent,
                !isCompleted && !isCurrent && styles.dotFuture,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.stepText}>
        Step {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotCompleted: {
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
  },
  stepText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
});
