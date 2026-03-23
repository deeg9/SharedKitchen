import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { InstructionStep as InstructionStepType } from '../../types/database';

interface InstructionStepProps {
  step: InstructionStepType;
}

export function InstructionStep({ step }: InstructionStepProps) {
  const [done, setDone] = useState(false);

  return (
    <Pressable onPress={() => setDone(!done)} style={styles.container}>
      <View style={[styles.circle, done && styles.circleDone]}>
        <Text style={[styles.stepNumber, done && styles.stepNumberDone]}>
          {step.step_number}
        </Text>
      </View>
      <Text style={[styles.text, done && styles.textDone]}>{step.text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  stepNumberDone: {
    color: colors.onPrimary,
  },
  text: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
    lineHeight: 22,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
});
