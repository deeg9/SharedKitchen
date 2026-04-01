import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
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
import { useCameraPermission } from '../../../src/hooks/useCameraPermission';
import { CameraSheet } from '../../../src/components/camera/CameraSheet';
import { CameraPermissionPrompt } from '../../../src/components/camera/CameraPermissionPrompt';
import { CameraPermissionCard } from '../../../src/components/camera/CameraPermissionCard';
import { VisionLoadingOverlay } from '../../../src/components/camera/VisionLoadingOverlay';
import { analyzePhoto, VisionRateLimitError } from '../../../src/lib/vision';
import { DishIdentifiedSheet } from '../../../src/components/recipe-discovery/DishIdentifiedSheet';
import { RecipeResultsSheet } from '../../../src/components/recipe-discovery/RecipeResultsSheet';
import { MealSlotPickerSheet } from '../../../src/components/meal-logging/MealSlotPickerSheet';
import { DishIdentification, RecipeSearchResult } from '../../../src/types/recipeSearch';
import { MealType, MEAL_TYPE_CONFIG } from '../../../src/types/database';
import { formatDayLabel } from '../../../src/lib/dates';

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchRecipes, ratings } = useRecipeStore();
  const { activeHouseholdId } = useHouseholdStore();
  const { assignRecipe } = usePlanStore();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Dish identification state
  const [cameraSheetOpen, setCameraSheetOpen] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [dishResult, setDishResult] = useState<DishIdentification | null>(null);
  const [recipeResults, setRecipeResults] = useState<RecipeSearchResult[] | null>(null);
  const [dishSheetOpen, setDishSheetOpen] = useState(false);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [mealSlotPickerOpen, setMealSlotPickerOpen] = useState(false);
  const { showPrePrompt, permissionDenied, checkAndPrompt, requestAfterPrePrompt, dismissPrePrompt } = useCameraPermission();

  const handleIdentifyDish = useCallback(async () => {
    const granted = await checkAndPrompt();
    if (granted) {
      setCameraSheetOpen(true);
    }
  }, [checkAndPrompt]);

  const handleImageCaptured = useCallback(async (uri: string) => {
    setCameraSheetOpen(false);
    setVisionLoading(true);
    try {
      const result = await analyzePhoto(uri, 'identify');
      setVisionLoading(false);
      if (result.dish) {
        setDishResult({ name: result.dish.name, confidence: result.dish.confidence, description: result.dish.description });
        setDishSheetOpen(true);
      } else {
        Alert.alert('Could not identify dish', 'Try taking a clearer photo of the food.');
      }
    } catch (err: unknown) {
      setVisionLoading(false);
      if (err instanceof VisionRateLimitError) {
        Alert.alert('Monthly scan limit reached', `You've used all ${err.limit} free scans this month. Upgrade to Premium for unlimited scans.`);
      } else {
        Alert.alert('Something went wrong', 'We couldn\'t analyze that photo. Please try again with a clearer image.');
      }
    }
  }, []);

  const handlePermissionAllow = useCallback(async () => {
    const granted = await requestAfterPrePrompt();
    if (granted) {
      setCameraSheetOpen(true);
    }
  }, [requestAfterPrePrompt]);

  const handleSearchResults = useCallback((results: RecipeSearchResult[]) => {
    setRecipeResults(results);
    setDishSheetOpen(false);
    setRecipeSheetOpen(true);
  }, []);

  const handleDishSheetClose = useCallback(() => {
    setDishSheetOpen(false);
    setDishResult(null);
  }, []);

  const handleRecipeSheetClose = useCallback(() => {
    setRecipeSheetOpen(false);
    setRecipeResults(null);
    setDishSheetOpen(true);
  }, []);

  const handleImportComplete = useCallback(() => {
    setRecipeSheetOpen(false);
    setRecipeResults(null);
    setDishResult(null);
  }, []);

  const handleLogMeal = useCallback(() => {
    setDishSheetOpen(false);
    setMealSlotPickerOpen(true);
  }, []);

  const handleMealSlotSelected = useCallback(async (date: string, mealType: MealType) => {
    if (!activeHouseholdId || !dishResult) return;
    setMealSlotPickerOpen(false);
    try {
      await assignRecipe(
        activeHouseholdId,
        date,
        mealType,
        null,
        undefined,
        dishResult.name,
        'home-cooked',
        undefined
      );
      const dayDate = new Date(date + 'T12:00:00');
      const dayLabel = formatDayLabel(dayDate).weekday;
      const slotLabel = MEAL_TYPE_CONFIG[mealType].label;
      Alert.alert('Meal Logged', `Added ${dishResult.name} to ${dayLabel} ${slotLabel}`);
      setDishResult(null);
    } catch {
      Alert.alert('Error', 'Could not log meal. Please try again.');
    }
  }, [activeHouseholdId, dishResult, assignRecipe]);

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
              testID="recipe-add-menu-item"
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

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleIdentifyDish();
              }}
              testID="recipe-identify-dish-button"
            >
              <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
              <Text style={styles.menuText}>Identify a Dish</Text>
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

      {/* Dish identification camera components */}
      {permissionDenied && (
        <CameraPermissionCard onOpenSettings={() => Linking.openSettings()} />
      )}
      <CameraPermissionPrompt
        isOpen={showPrePrompt}
        onAllow={handlePermissionAllow}
        onDismiss={dismissPrePrompt}
      />
      <CameraSheet
        isOpen={cameraSheetOpen}
        onClose={() => setCameraSheetOpen(false)}
        onImageCaptured={handleImageCaptured}
      />
      <VisionLoadingOverlay visible={visionLoading} />
      <DishIdentifiedSheet
        isOpen={dishSheetOpen}
        dish={dishResult}
        onClose={handleDishSheetClose}
        onSearchResults={handleSearchResults}
        onLogMeal={handleLogMeal}
      />
      <RecipeResultsSheet
        isOpen={recipeSheetOpen}
        results={recipeResults ?? []}
        dishName={dishResult?.name ?? ''}
        onClose={handleRecipeSheetClose}
        onImportComplete={handleImportComplete}
      />
      <MealSlotPickerSheet
        isOpen={mealSlotPickerOpen}
        dishName={dishResult?.name ?? ''}
        onClose={() => {
          setMealSlotPickerOpen(false);
          setDishSheetOpen(true);
        }}
        onSelect={handleMealSlotSelected}
      />
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
