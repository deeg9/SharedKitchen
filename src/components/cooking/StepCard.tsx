import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { InstructionStep, Ingredient } from '../../types/database';
import { UnitSystem, convertInstructionText, convertIngredient } from '../../lib/unit-conversion';
import { CookingTimer } from './CookingTimer';

interface StepCardProps {
  step: InstructionStep;
  stepIndex: number;
  totalSteps: number;
  unitSystem: UnitSystem;
  ingredients?: Ingredient[];
}

type StepType = 'PREP' | 'GRILLING' | 'SIMMERING' | 'BAKING' | 'MIXING' | 'MARINATING' | 'COOK';

function deriveStepType(text: string): StepType {
  const lower = text.toLowerCase();
  if (lower.includes('marinat')) return 'MARINATING';
  if (/chop|dice|mince|slice|peel|wash|rinse|measure|prep/.test(lower)) return 'PREP';
  if (/grill|sear|char/.test(lower)) return 'GRILLING';
  if (/simmer|boil|reduce/.test(lower)) return 'SIMMERING';
  if (/bake|roast/.test(lower)) return 'BAKING';
  if (/mix|combine|whisk/.test(lower)) return 'MIXING';
  return 'COOK';
}

const BADGE_STYLES: Record<StepType, { bg: string; text: string }> = {
  PREP:       { bg: colors.secondaryFixed, text: colors.secondary },        // amber
  GRILLING:   { bg: colors.errorContainer, text: colors.error },            // red
  SIMMERING:  { bg: '#d0e4ff', text: '#00497e' },                           // blue (hardcoded — theme tertiaryContainer is dark green, not blue)
  BAKING:     { bg: colors.secondaryFixed, text: colors.secondary },        // warm orange
  MIXING:     { bg: colors.primaryFixed, text: colors.primary },            // green
  MARINATING: { bg: colors.secondaryFixed, text: colors.secondary },        // amber
  COOK:       { bg: colors.outlineVariant, text: colors.onSurfaceVariant }, // gray default
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
  ingredients,
}: StepCardProps) {
  const displayText =
    unitSystem !== 'imperial'
      ? convertInstructionText(step.text, unitSystem)
      : step.text;

  const stepType = useMemo(() => deriveStepType(step.text), [step.text]);
  const badgeStyle = BADGE_STYLES[stepType];
  const tip = useMemo(() => parseTip(step.text), [step.text]);

  const displayIngredients = useMemo(() => {
    if (!ingredients || ingredients.length === 0) return [];
    return ingredients.map((ing) =>
      unitSystem !== 'imperial' ? convertIngredient(ing, unitSystem) : ing
    );
  }, [ingredients, unitSystem]);

  return (
    <View style={s.container}>
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

      {/* Per-step ingredient card */}
      <View style={s.ingredientList}>
        {displayIngredients.length > 0 ? (
          displayIngredients.map((ing, i) => (
            <View key={`ing-${i}`} style={s.ingredientRow}>
              <View style={s.ingredientDot} />
              <Text style={s.ingredientText}>
                {ing.amount > 0 ? `${ing.amount} ` : ''}{ing.unit ? `${ing.unit} ` : ''}{ing.name}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.emptyIngredients}>No ingredients for this step</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
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
    fontSize: 12,
    letterSpacing: 1,
  },
  instruction: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.25,
    color: colors.onSurface,
    marginTop: spacing.sm,
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
    paddingVertical: spacing.xs, // 4px per UI-SPEC
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
  emptyIngredients: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant, // #43493f
  },
});
