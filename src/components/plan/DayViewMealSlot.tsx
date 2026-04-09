import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { getDefaultRecipeImage } from '../../lib/images';
import type { MealPlanWithRecipe } from '../../stores/planStore';
import type { MealType } from '../../types/database';

const MEAL_CONFIG: Record<
  'breakfast' | 'lunch',
  {
    icon: 'bread-slice-outline' | 'food-apple-outline';
    label: string;
    prompt: string;
  }
> = {
  breakfast: {
    icon: 'bread-slice-outline',
    label: 'Breakfast',
    prompt: "What's for breakfast?",
  },
  lunch: {
    icon: 'food-apple-outline',
    label: 'Lunch',
    prompt: 'Lunch time?',
  },
};

interface DayViewMealSlotProps {
  mealType: MealType; // 'breakfast' or 'lunch' (dinner uses HeroDinnerCard)
  plan?: MealPlanWithRecipe;
  onPress: () => void;
}

export function DayViewMealSlot({ mealType, plan, onPress }: DayViewMealSlotProps) {
  const config = MEAL_CONFIG[mealType as 'breakfast' | 'lunch'] ?? MEAL_CONFIG.breakfast;
  const hasRecipe = plan?.recipes != null;
  const hasNotes = plan != null && !hasRecipe && plan.notes;

  // Notes-only state (photo-logged meal)
  if (hasNotes && !hasRecipe) {
    return (
      <Pressable onPress={onPress} testID={`day-meal-${mealType}-filled`}>
        <Card variant="elevated" style={styles.filledCard}>
          <View style={styles.filledRow}>
            <View style={[styles.thumbnail, styles.notesPlaceholder]}>
              <MaterialCommunityIcons
                name="food"
                size={20}
                color={colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.mealLabel}>{config.label.toUpperCase()}</Text>
              <Text style={styles.recipeName} numberOfLines={1}>
                {plan!.notes}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  // Empty state
  if (!plan || !hasRecipe) {
    return (
      <Pressable onPress={onPress} testID={`day-meal-${mealType}-empty`}>
        <Card variant="filled" style={styles.emptyCard}>
          <MaterialCommunityIcons
            name={config.icon}
            size={32}
            color={colors.outlineVariant}
          />
          <Text style={styles.emptyLabel}>{config.label}</Text>
          <Text style={styles.emptyPrompt}>{config.prompt}</Text>
        </Card>
      </Pressable>
    );
  }

  // Filled state
  const recipe = plan.recipes!;
  const imageUri =
    recipe.image_url ||
    getDefaultRecipeImage(plan.recipe_id ?? plan.id, recipe.category ?? undefined);
  const totalTime =
    recipe.prep_time_minutes != null
      ? recipe.prep_time_minutes + (recipe.cook_time_minutes ?? 0)
      : null;

  return (
    <Pressable onPress={onPress} testID={`day-meal-${mealType}-filled`}>
      <Card variant="elevated" style={styles.filledCard}>
        <View style={styles.filledRow}>
          <Image
            source={{ uri: imageUri }}
            style={styles.thumbnail}
            contentFit="cover"
          />
          <View style={styles.info}>
            <Text style={styles.mealLabel}>{config.label.toUpperCase()}</Text>
            <Text style={styles.recipeName} numberOfLines={1}>
              {recipe.name}
            </Text>
            <View style={styles.metaRow}>
              {totalTime != null && (
                <View style={styles.pill}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={10}
                    color={colors.onSurfaceVariant}
                  />
                  <Text style={styles.pillText}>{totalTime}m</Text>
                </View>
              )}
              {recipe.estimated_cost != null && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    ${recipe.estimated_cost.toFixed(0)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Empty state
  emptyCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyLabel: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  emptyPrompt: {
    ...typography.bodySm,
    color: colors.outline,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  // Filled state
  filledCard: {
    padding: spacing.md,
  },
  filledRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  notesPlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  mealLabel: {
    ...typography.labelSm,
    color: colors.secondary,
    marginBottom: 1,
  },
  recipeName: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
});
