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

export function AddRecipesStep() {
  const router = useRouter();
  const nextStep = useOnboardingStore((s) => s.nextStep);
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
      <Text style={styles.headline}>Add 3 recipes to get started</Text>

      <Pressable
        style={({ pressed }) => [styles.importButton, pressed && styles.pressed]}
        onPress={handleImportUrl}
      >
        <MaterialCommunityIcons name="link-variant" size={20} color={colors.primary} />
        <Text style={styles.importText}>Import from URL</Text>
      </Pressable>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {STARTER_RECIPES.map((recipe, index) => {
          const isAdded = addedIndices.has(index);
          const isAdding = addingIndex === index;

          return (
            <View key={recipe.name} style={styles.recipeCard}>
              <View style={styles.recipeIcon}>
                <MaterialCommunityIcons
                  name="food-variant"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeMeta}>
                  {recipe.prep_time_minutes + recipe.cook_time_minutes}min
                  {' \u00B7 '}
                  {recipe.category}
                </Text>
              </View>
              <Pressable
                style={[styles.addButton, isAdded && styles.addedButton]}
                onPress={() => handleAddRecipe(recipe, index)}
                disabled={isAdded || isAdding}
                hitSlop={8}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : isAdded ? (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
                )}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.counter}>
          {addedRecipeIds.length} / 3 recipes
        </Text>
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
  headline: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  importText: {
    ...typography.labelLg,
    color: colors.primary,
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
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.editorial,
  },
  recipeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedButton: {
    backgroundColor: colors.primaryFixed,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  counter: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
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
