import React, { useEffect, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeGrid } from '../../../src/components/recipes/RecipeGrid';
import { useRecipeStore } from '../../../src/stores/recipeStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { colors } from '../../../src/theme/colors';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchRecipes, ratings } = useRecipeStore();
  const { activeHouseholdId } = useHouseholdStore();

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

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/recipe/add')}
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </Pressable>
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
});
