import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CookingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function CookingProgress({ currentStep, totalSteps }: CookingProgressProps) {
  return (
    <View
      testID="cooking-progress"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep + 1 }}
      style={s.container}
    >
      <View style={s.barRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          let color = colors.onSurfaceVariant; // remaining
          if (i < currentStep) {
            color = colors.inversePrimary; // completed
          } else if (i === currentStep) {
            color = 'rgba(183,204,185,0.6)'; // current (inversePrimary at 60%)
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
      <Text style={s.label}>Step {currentStep + 1} of {totalSteps}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    height: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
  segmentGap: {
    marginRight: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.outlineVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
