import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeGrid } from '../../../src/components/recipes/RecipeGrid';
import { MealGeneratorSheet } from '../../../src/components/recipes/MealGeneratorSheet';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { usePlanStore } from '../../../src/stores/planStore';
import { MealSuggestion } from '../../../src/lib/ai';
import { colors } from '../../../src/theme/colors';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchRecipes, ratings } = useRecipeStore();
  const { activeHouseholdId } = useHouseholdStore();
  const { assignRecipe } = usePlanStore();
  const [showGenerator, setShowGenerator] = useState(false);

  const handleAddToPlan = useCallback(async (suggestion: MealSuggestion) => {
    if (!activeHouseholdId) return;
    // Create recipe from suggestion then assign to today
    router.push({ pathname: '/recipe/add', params: { prefill: JSON.stringify(suggestion) } });
    setShowGenerator(false);
  }, [activeHouseholdId, router]);

  useEffect(() => {
    if (activeHouseholdId) {
      fetchRecipes(activeHouseholdId);
    }
  }, [activeHouseholdId]);

  const favorites = useMemo(() => {
    const map = new Map<string, boolean>();
    ratings.forEach((r) => {
      if (r.is_favorite) map.set(r.recipe_id, true);
    });
    return map;
  }, [ratings]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <RecipeGrid favorites={favorites} />

      {/* Meal Generator FAB */}
      <Pressable
        onPress={() => setShowGenerator(true)}
        style={[styles.generatorFab, { bottom: TAB_BAR_HEIGHT + spacing.md + 72 }]}
      >
        <MaterialCommunityIcons name="chef-hat" size={24} color={colors.onSecondaryContainer} />
      </Pressable>

      {/* Add Recipe FAB */}
      <Pressable
        onPress={() => router.push('/recipe/add')}
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + spacing.md }]}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </Pressable>

      {activeHouseholdId && (
        <MealGeneratorSheet
          visible={showGenerator}
          onClose={() => setShowGenerator(false)}
          householdId={activeHouseholdId}
          onAddToPlan={handleAddToPlan}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
  generatorFab: {
    position: 'absolute',
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
});
