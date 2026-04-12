import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CookingProgressProps {
  currentStep: number;
  totalSteps: number;
  recipeName?: string;
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
          const color = i <= currentStep ? colors.primary : colors.outlineVariant;
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
  },
  barRow: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
  segmentGap: {
    marginRight: spacing.xs,
  },
});
