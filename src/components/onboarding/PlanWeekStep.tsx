import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { usePlanStore } from '../../stores/planStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { toDateString } from '../../lib/dates';
import { addDays, format } from 'date-fns';
import { OnboardingProgress } from './OnboardingProgress';

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;

interface DayAssignment {
  date: Date;
  dateStr: string;
  recipeName: string | null;
  assigned: boolean;
}

export function PlanWeekStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const addedRecipeIds = useOnboardingStore((s) => s.addedRecipeIds);
  const householdId = useOnboardingStore((s) => s.householdId);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const recipes = useRecipeStore((s) => s.recipes);
  const assignRecipe = usePlanStore((s) => s.assignRecipe);

  const effectiveHouseholdId = householdId ?? activeHouseholdId;

  const [assignments, setAssignments] = useState<DayAssignment[]>([]);
  const [autoAssigned, setAutoAssigned] = useState(false);

  // Build next 3 days with auto-assigned recipes
  useEffect(() => {
    const today = new Date();
    const days: DayAssignment[] = [];
    const addedRecipes = recipes.filter((r) => addedRecipeIds.includes(r.id));

    for (let i = 0; i < 3; i++) {
      const date = addDays(today, i + 1);
      const recipe = addedRecipes[i] ?? null;
      days.push({
        date,
        dateStr: toDateString(date),
        recipeName: recipe?.name ?? null,
        assigned: false,
      });
    }

    setAssignments(days);
  }, []);

  const handleConfirm = async () => {
    if (!effectiveHouseholdId || autoAssigned) {
      nextStep();
      return;
    }

    const addedRecipes = recipes.filter((r) => addedRecipeIds.includes(r.id));

    // Auto-assign recipes to the next days
    for (let i = 0; i < Math.min(addedRecipes.length, 3); i++) {
      try {
        await assignRecipe(
          effectiveHouseholdId,
          assignments[i].dateStr,
          'dinner',
          addedRecipes[i].id
        );
      } catch {
        // Non-blocking -- continue with other assignments
      }
    }

    setAutoAssigned(true);
    nextStep();
  };

  const addedRecipes = recipes.filter((r) => addedRecipeIds.includes(r.id));

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={prevStep} hitSlop={12} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.brandText}>
          <Text style={styles.italic}>SharedKitchen</Text>
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Progress */}
      <OnboardingProgress currentStep={4} totalSteps={6} />

      {/* Headline + subtitle */}
      <Text style={styles.headline}>Plan Your Week</Text>
      <Text style={styles.subtitle}>
        Assign your first meals to the calendar. Let's build the foundation for your culinary week.
      </Text>

      {/* Day-by-day meal slots */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {assignments.map((day, dayIdx) => (
          <View key={day.dateStr} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayName}>{format(day.date, 'EEEE')}</Text>
                <Text style={styles.dayDate}>{format(day.date, 'MMM d').toUpperCase()}</Text>
              </View>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.onSurfaceVariant} />
            </View>

            {MEAL_SLOTS.map((slot) => {
              const isDinner = slot === 'DINNER';
              const hasRecipe = isDinner && day.recipeName;

              return (
                <View key={slot} style={styles.mealSlotRow}>
                  <Text style={styles.mealSlotLabel}>{slot}</Text>
                  <View style={styles.mealSlotContent}>
                    {hasRecipe ? (
                      <View style={styles.assignedRecipeRow}>
                        <View style={styles.recipeThumb}>
                          <MaterialCommunityIcons name="food" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.assignedRecipeInfo}>
                          <Text style={styles.assignedRecipeName}>{day.recipeName}</Text>
                          <Text style={styles.assignedRecipeMeta}>
                            {recipes.find((r) => r.name === day.recipeName)
                              ? `${(recipes.find((r) => r.name === day.recipeName)?.prep_time_minutes ?? 0) + (recipes.find((r) => r.name === day.recipeName)?.cook_time_minutes ?? 0)} min prep`
                              : ''}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.emptySlotRow}>
                        <Text style={styles.emptySlotText}>Select a recipe...</Text>
                        <MaterialCommunityIcons name="cog-outline" size={18} color={colors.outlineVariant} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Your Saved Recipes section */}
        <View style={styles.savedRecipesSection}>
          <View style={styles.savedRecipesHeader}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.onSurface} />
            <Text style={styles.savedRecipesTitle}>Your Saved Recipes</Text>
          </View>

          {addedRecipes.map((recipe) => (
            <View key={recipe.id} style={styles.savedRecipeRow}>
              <View style={styles.savedRecipeThumb}>
                <MaterialCommunityIcons name="food" size={18} color={colors.primary} />
              </View>
              <View style={styles.savedRecipeInfo}>
                <Text style={styles.savedRecipeName}>{recipe.name}</Text>
                <Text style={styles.savedRecipeMeta}>
                  {recipe.category ?? 'Recipe'}
                  {' \u00B7 '}
                  {(recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)}m
                </Text>
              </View>
              <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.outlineVariant} />
            </View>
          ))}
        </View>

        {/* Quote + Finalize */}
        <View style={styles.finalizeSection}>
          <Text style={styles.quoteText}>
            "A goal without a plan is just a wish."
          </Text>
          <Pressable
            style={({ pressed }) => [styles.finalizeButton, pressed && styles.pressed]}
            onPress={handleConfirm}
            testID="onboarding-plan-continue"
          >
            <Text style={styles.finalizeText}>Finalize Plan</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandText: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  italic: {
    fontStyle: 'italic',
  },
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  daySection: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.editorial,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  dayName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  dayDate: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  mealSlotRow: {
    marginBottom: spacing.sm,
  },
  mealSlotLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  mealSlotContent: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  assignedRecipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipeThumb: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedRecipeInfo: {
    flex: 1,
  },
  assignedRecipeName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  assignedRecipeMeta: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  emptySlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptySlotText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  savedRecipesSection: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.editorial,
  },
  savedRecipesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  savedRecipesTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  savedRecipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  savedRecipeThumb: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedRecipeInfo: {
    flex: 1,
  },
  savedRecipeName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  savedRecipeMeta: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  finalizeSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  quoteText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  finalizeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    ...shadows.editorial,
  },
  pressed: {
    opacity: 0.85,
  },
  finalizeText: {
    ...typography.titleMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
