import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { STARTER_RECIPES, StarterRecipe } from '../../lib/starter-recipes';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { useHouseholdStore } from '../../stores/householdStore';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingProgress } from './OnboardingProgress';

export function AddRecipesStep() {
  const router = useRouter();
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const addedRecipeIds = useOnboardingStore((s) => s.addedRecipeIds);
  const addRecipeId = useOnboardingStore((s) => s.addRecipeId);
  const householdId = useOnboardingStore((s) => s.householdId);
  const createRecipe = useRecipeStore((s) => s.createRecipe);
  const user = useAuthStore((s) => s.user);
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);

  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());

  const effectiveHouseholdId = householdId ?? activeHouseholdId;
  const canContinue = addedRecipeIds.length >= 1;

  const handleAddRecipe = async (recipe: StarterRecipe, index: number) => {
    if (!effectiveHouseholdId || addedIndices.has(index)) return;

    setAddingIndex(index);
    try {
      const created = await createRecipe({
        household_id: effectiveHouseholdId,
        name: recipe.name,
        category: recipe.category,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        estimated_cost: recipe.estimated_cost,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tags: recipe.tags,
        created_by: user?.id ?? null,
      });

      if (created) {
        addRecipeId(created.id);
        setAddedIndices((prev) => new Set(prev).add(index));
      }
    } catch {
      // Error handled in store
    } finally {
      setAddingIndex(null);
    }
  };

  const handleImportUrl = () => {
    router.push('/(app)/recipe/add');
  };

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
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP 4 OF 6</Text>
        </View>
      </View>

      {/* Headline + subtitle */}
      <Text style={styles.headline}>Add 3 recipes to get started</Text>
      <Text style={styles.subtitle}>
        Select from our most-loved starters or import your own secret family recipes from across the web.
      </Text>

      {/* Progress counter + Import row */}
      <View style={styles.counterRow}>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>CURRENT PROGRESS</Text>
          <Text style={styles.progressCount}>{addedRecipeIds.length} of 3 added</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.importCard, pressed && styles.pressed]}
          onPress={handleImportUrl}
        >
          <MaterialCommunityIcons name="link-variant" size={24} color={colors.primary} />
          <Text style={styles.importText}>Import from URL</Text>
        </Pressable>
      </View>

      {/* Starter recipe cards */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {STARTER_RECIPES.map((recipe, index) => {
          const isAdded = addedIndices.has(index);
          const isAdding = addingIndex === index;

          return (
            <Pressable
              key={recipe.name}
              style={styles.recipeCard}
              onPress={() => handleAddRecipe(recipe, index)}
              disabled={isAdded || isAdding}
            >
              <View style={styles.recipePhoto}>
                <MaterialCommunityIcons
                  name="food-variant"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeMeta}>
                  {recipe.category}
                  {' \u00B7 '}
                  {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                </Text>
              </View>
              <View style={[styles.selectToggle, isAdded && styles.selectToggleActive]}>
                {isAdding ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : isAdded ? (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            !canContinue && styles.disabled,
            pressed && canContinue && styles.pressed,
          ]}
          onPress={nextStep}
          disabled={!canContinue}
          testID="onboarding-recipes-continue"
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
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
  stepBadge: {
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepBadgeText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  counterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  progressLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  progressCount: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  importCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  importText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.editorial,
  },
  recipePhoto: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  recipeMeta: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  selectToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectToggleActive: {
    backgroundColor: colors.primaryFixed,
  },
  footer: {
    paddingTop: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.editorial,
  },
  disabled: {
    opacity: 0.5,
  },
  continueText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
