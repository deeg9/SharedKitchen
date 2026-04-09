import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>
        STEP {currentStep + 1} OF {totalSteps}
      </Text>
      <View style={styles.segmentRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <View
              key={i}
              style={[
                styles.segment,
                (isCompleted || isCurrent) ? styles.segmentActive : styles.segmentInactive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  stepLabel: {
    ...typography.labelSm,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    width: 24,
    height: 4,
    borderRadius: borderRadius.full,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentInactive: {
    backgroundColor: colors.outlineVariant,
  },
});
