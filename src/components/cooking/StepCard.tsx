import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { InstructionStep } from '../../types/database';
import { UnitSystem, convertInstructionText } from '../../lib/unit-conversion';
import { CookingTimer } from './CookingTimer';

interface StepCardProps {
  step: InstructionStep;
  stepIndex: number;
  totalSteps: number;
  unitSystem: UnitSystem;
  width: number;
}

export function StepCard({ step, stepIndex, totalSteps, unitSystem, width }: StepCardProps) {
  const displayText =
    unitSystem !== 'imperial'
      ? convertInstructionText(step.text, unitSystem)
      : step.text;

  return (
    <View style={[s.container, { width }]}>
      {/* Step badge */}
      <View style={s.badge}>
        <Text style={s.badgeText}>{step.step_number}</Text>
      </View>

      {/* Instruction text */}
      <Text style={s.instruction} accessibilityRole="text">
        {displayText}
      </Text>

      {/* Timers */}
      {step.timers && step.timers.length > 0 && (
        <View style={s.timers}>
          {step.timers.map((timer, i) => (
            <CookingTimer
              key={`${stepIndex}-timer-${i}`}
              durationSeconds={timer.duration_seconds}
              label={timer.label}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.inversePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badgeText: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.inverseSurface,
  },
  instruction: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fontFamily.headlineBold,
    color: colors.inverseOnSurface,
    lineHeight: 32,
  },
  timers: {
    marginTop: spacing.xl,
  },
});
