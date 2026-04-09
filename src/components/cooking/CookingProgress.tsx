import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface CookingProgressProps {
  currentStep: number;
  totalSteps: number;
  recipeName?: string;
}

export function CookingProgress({ currentStep, totalSteps, recipeName }: CookingProgressProps) {
  return (
    <View
      testID="cooking-progress"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep + 1 }}
      style={s.container}
    >
      {/* Step counter */}
      <Text style={s.stepLabel}>Step {currentStep + 1} of {totalSteps}</Text>
      {recipeName ? (
        <Text style={s.recipeName} numberOfLines={1}>{recipeName.toUpperCase()}</Text>
      ) : null}

      {/* Segmented progress bar */}
      <View style={s.barRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          let color = colors.outlineVariant; // remaining
          if (i <= currentStep) {
            color = colors.primary; // completed + current
          }
          return (
            <View
              key={i}
              style={[
                s.segment,
                { backgroundColor: color },
                i < totalSteps - 1 && s.segmentGap,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  stepLabel: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  recipeName: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  barRow: {
    flexDirection: 'row',
    height: 4,
    marginTop: spacing.sm,
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
  segmentGap: {
    marginRight: 2,
  },
});
