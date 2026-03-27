import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
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
import { typography } from '../../../src/theme/typography';
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
  const [showMenu, setShowMenu] = useState(false);

  const handleAddToPlan = useCallback(async (suggestion: MealSuggestion) => {
    if (!activeHouseholdId) return;
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

      {/* Single FAB — opens menu */}
      <Pressable
        onPress={() => setShowMenu(true)}
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + spacing.md }]}
        testID="recipe-add-button"
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </Pressable>

      {/* FAB Menu */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { bottom: TAB_BAR_HEIGHT + spacing.md + 72 }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/recipe/add');
              }}
            >
              <MaterialCommunityIcons name="pencil-plus" size={22} color={colors.primary} />
              <Text style={styles.menuText}>Add Recipe</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowGenerator(true);
              }}
              testID="recipe-generator-button"
            >
              <MaterialCommunityIcons name="chef-hat" size={22} color={colors.primary} />
              <Text style={styles.menuText}>What should we cook?</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    minWidth: 220,
    ...shadows.float,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuText: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.md,
  },
});
