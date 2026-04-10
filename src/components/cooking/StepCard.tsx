import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { InstructionStep, Ingredient } from '../../types/database';
import { UnitSystem, convertInstructionText } from '../../lib/unit-conversion';
import { getDefaultRecipeImage } from '../../lib/images';
import { CookingTimer } from './CookingTimer';

interface StepCardProps {
  step: InstructionStep;
  stepIndex: number;
  totalSteps: number;
  unitSystem: UnitSystem;
  recipeImageUrl?: string | null;
  recipeCategory?: string;
  recipeId?: string;
  ingredients?: Ingredient[];
}

type StepType = 'MARINATING' | 'PREP' | 'COOKING';

function deriveStepType(text: string): StepType {
  const lower = text.toLowerCase();
  if (lower.includes('marinat')) return 'MARINATING';
  if (
    lower.includes('prep') ||
    lower.includes('chop') ||
    lower.includes('dice') ||
    lower.includes('slice') ||
    lower.includes('mince') ||
    lower.includes('peel') ||
    lower.includes('wash') ||
    lower.includes('rinse') ||
    lower.includes('measure')
  ) {
    return 'PREP';
  }
  return 'COOKING';
}

const BADGE_STYLES: Record<StepType, { bg: string; text: string }> = {
  MARINATING: { bg: colors.secondaryFixed, text: colors.secondary },
  PREP: { bg: colors.primaryFixed, text: colors.primary },
  COOKING: { bg: colors.secondaryContainer, text: colors.onSecondary },
};

function parseTip(text: string): string | null {
  const match = text.match(/(?:tip|note):\s*(.+?)(?:\.|$)/i);
  return match ? match[1].trim() : null;
}

export function StepCard({
  step,
  stepIndex,
  totalSteps,
  unitSystem,
  recipeImageUrl,
  recipeCategory,
  recipeId,
  ingredients,
}: StepCardProps) {
  const displayText =
    unitSystem !== 'imperial'
      ? convertInstructionText(step.text, unitSystem)
      : step.text;

  const stepType = useMemo(() => deriveStepType(step.text), [step.text]);
  const badgeStyle = BADGE_STYLES[stepType];
  const tip = useMemo(() => parseTip(step.text), [step.text]);

  const imageUrl = recipeImageUrl || getDefaultRecipeImage(recipeId || '', recipeCategory || '');

  return (
    <View style={s.container}>
      {/* Step photo */}
      <Image
        source={{ uri: imageUrl }}
        style={s.photo}
        contentFit="cover"
        transition={200}
      />

      {/* Timer cards */}
      {step.timers && step.timers.length > 0 &&
        step.timers.map((timer, i) => (
          <CookingTimer
            key={`${stepIndex}-timer-${i}`}
            durationSeconds={timer.duration_seconds}
            label={timer.label}
          />
        ))
      }

      {/* Step type badge */}
      <View style={[s.badge, { backgroundColor: badgeStyle.bg }]}>
        <Text style={[s.badgeText, { color: badgeStyle.text }]}>{stepType}</Text>
      </View>

      {/* Instruction text */}
      <Text style={s.instruction} accessibilityRole="text">
        {displayText}
      </Text>

      {/* Chef's Tip callout */}
      {tip && (
        <View style={s.tipCard}>
          <Text style={s.tipTitle}>Chef's Tip:</Text>
          <Text style={s.tipText}>{tip}</Text>
        </View>
      )}

      {/* Ingredient chips */}
      {ingredients && ingredients.length > 0 && (
        <View style={s.ingredientList}>
          {ingredients.map((ing, i) => (
            <View key={`ing-${i}`} style={s.ingredientRow}>
              <View style={s.ingredientDot} />
              <Text style={s.ingredientText}>
                {ing.amount} {ing.unit} {ing.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: borderRadius.xl,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
  },
  badgeText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  instruction: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.25,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  tipCard: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  tipTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  tipText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  ingredientList: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
  },
  ingredientText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
});
