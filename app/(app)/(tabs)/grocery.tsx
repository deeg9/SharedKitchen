import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, AppState, AppStateStatus, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { GrocerySection } from '../../../src/components/grocery/GrocerySection';
import { GrocerySummary } from '../../../src/components/grocery/GrocerySummary';
import { AddItemSheet } from '../../../src/components/grocery/AddItemSheet';
import { EditCategoriesSheet } from '../../../src/components/grocery/EditCategoriesSheet';
import { OnHandList } from '../../../src/components/pantry/OnHandList';
import { useGroceryCategoryStore } from '../../../src/stores/groceryCategoryStore';
import { useGroceryStore } from '../../../src/stores/groceryStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { usePlanStore } from '../../../src/stores/planStore';
import { usePantryStore } from '../../../src/stores/pantryStore';
import { useGrocerySync } from '../../../src/hooks/useGrocerySync';
import { usePantrySync } from '../../../src/hooks/usePantrySync';
import { getWeekDays, toDateString, formatDayLabel } from '../../../src/lib/dates';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';
import { usePresence, PresenceMember } from '../../../src/hooks/usePresence';
import { useActivityToast } from '../../../src/hooks/useActivityToast';
import { PresenceAvatarStack } from '../../../src/components/presence/PresenceAvatarStack';
import { ActivityToast } from '../../../src/components/presence/ActivityToast';
import { useAuthStore } from '../../../src/stores/authStore';
import { useCameraPermission } from '../../../src/hooks/useCameraPermission';
import { CameraSheet } from '../../../src/components/camera/CameraSheet';
import { CameraPermissionPrompt } from '../../../src/components/camera/CameraPermissionPrompt';
import { CameraPermissionCard } from '../../../src/components/camera/CameraPermissionCard';
import { VisionLoadingOverlay } from '../../../src/components/camera/VisionLoadingOverlay';
import { analyzePhoto, VisionRateLimitError } from '../../../src/lib/vision';
import { ScanReviewScreen } from '../../../src/components/scan/ScanReviewScreen';
import { DishIdentifiedSheet } from '../../../src/components/recipe-discovery/DishIdentifiedSheet';
import { RecipeResultsSheet } from '../../../src/components/recipe-discovery/RecipeResultsSheet';
import { MealSlotPickerSheet } from '../../../src/components/meal-logging/MealSlotPickerSheet';
import { DishIdentification, RecipeSearchResult } from '../../../src/types/recipeSearch';
import { MealType, MEAL_TYPE_CONFIG } from '../../../src/types/database';

const SECTION_ORDER = ['Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other'];

import { GroceryItem as GroceryItemType } from '../../../src/types/database';

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItemType | null>(null);
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'shopping' | 'onhand'>('shopping');
  const [cameraSheetOpen, setCameraSheetOpen] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [scanResults, setScanResults] = useState<Array<{ name: string; category?: string; quantity?: string; brand?: string }> | null>(null);
  const [dishResult, setDishResult] = useState<DishIdentification | null>(null);
  const [recipeResults, setRecipeResults] = useState<RecipeSearchResult[] | null>(null);
  const [dishSheetOpen, setDishSheetOpen] = useState(false);
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [mealSlotPickerOpen, setMealSlotPickerOpen] = useState(false);
  const { showPrePrompt, permissionDenied, checkAndPrompt, requestAfterPrePrompt, dismissPrePrompt } = useCameraPermission();
  const initCategories = useGroceryCategoryStore((s) => s.initialize);

  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const members = useHouseholdStore((s) => s.members);
  const mealPlan = usePlanStore((s) => s.mealPlan);

  // Pantry sync -- always active regardless of segment
  usePantrySync(activeHouseholdId);
  const fetchPantryItems = usePantryStore((s) => s.fetchPantryItems);

  useEffect(() => {
    if (activeHouseholdId) {
      fetchPantryItems(activeHouseholdId);
    }
  }, [activeHouseholdId]);

  // AppState tracking for presence accuracy (RT-04)
  const [appActive, setAppActive] = useState(true);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Build currentUser for presence
  const profile = members.find((m) => m.user_id === user?.id)?.profiles;
  const currentPresenceUser: PresenceMember | null = user ? {
    user_id: user.id,
    display_name: profile?.display_name ?? user.user_metadata?.display_name ?? 'Me',
    avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
  } : null;

  const {
    items,
    activeListId,
    loading,
    error,
    summary,
    groupedItems,
    fetchGroceryList,
    generateGroceryList,
    fetchFrequentItems,
  } = useGroceryStore();

  // Realtime sync
  useGrocerySync(activeHouseholdId, activeListId);

  // Presence hook -- channelKey is null when app is backgrounded (RT-04)
  const presenceMembers = usePresence(
    appActive && activeListId ? `grocery:${activeListId}` : null,
    currentPresenceUser
  );

  // Activity toast hook
  const memberLookup = useCallback((uid: string) => {
    const m = members.find((mem) => mem.user_id === uid);
    if (!m?.profiles) return null;
    return { display_name: m.profiles.display_name ?? 'Someone', avatar_url: m.profiles.avatar_url };
  }, [members]);

  const { currentToast, dismissToast } = useActivityToast({
    groceryListId: appActive ? activeListId : null,
    householdId: appActive ? activeHouseholdId : null,
    currentUserId: user?.id ?? null,
    memberLookup,
  });

  // Init categories
  useEffect(() => {
    initCategories();
  }, []);

  // Fetch grocery list on mount
  useEffect(() => {
    if (!activeHouseholdId) return;
    const weekDays = getWeekDays(0);
    const weekStart = toDateString(weekDays[0]);
    fetchGroceryList(activeHouseholdId, weekStart);
  }, [activeHouseholdId]);

  // Pre-load frequent items for quick add
  useEffect(() => {
    if (!activeHouseholdId) return;
    fetchFrequentItems(activeHouseholdId, activeListId);
  }, [activeHouseholdId, activeListId]);

  const handleGenerate = useCallback(async () => {
    if (!activeHouseholdId) return;
    const weekDays = getWeekDays(0);
    const weekStart = toDateString(weekDays[0]);

    // Extract recipes from meal plan
    const recipes = Array.from(mealPlan.values())
      .filter((entry) => entry.recipes)
      .map((entry) => ({
        id: entry.recipes!.id,
        ingredients: entry.recipes!.ingredients ?? [],
      }));

    await generateGroceryList(activeHouseholdId, weekStart, recipes);
  }, [activeHouseholdId, mealPlan, generateGroceryList]);

  const handleCameraFab = useCallback(async () => {
    const granted = await checkAndPrompt();
    if (granted) {
      setCameraSheetOpen(true);
    }
  }, [checkAndPrompt]);

  const handleImageCaptured = useCallback(async (uri: string) => {
    setCameraSheetOpen(false);
    setVisionLoading(true);
    const intent = activeSegment === 'onhand' ? 'scan' : 'identify';
    try {
      const result = await analyzePhoto(uri, intent);
      setVisionLoading(false);
      if (intent === 'scan') {
        if (result.items && result.items.length > 0) {
          setScanResults(result.items);
        } else {
          Alert.alert('No items found', 'We couldn\'t identify any food items in that photo. Try taking a clearer photo of your fridge or pantry shelves.');
        }
      } else {
        // identify intent
        if (result.dish) {
          setDishResult({ name: result.dish.name, confidence: result.dish.confidence, description: result.dish.description });
          setDishSheetOpen(true);
        } else {
          Alert.alert('Could not identify dish', 'Try taking a clearer photo of the food.');
        }
      }
    } catch (err: unknown) {
      setVisionLoading(false);
      if (err instanceof VisionRateLimitError) {
        Alert.alert('Monthly scan limit reached', `You've used all ${err.limit} free scans this month. Upgrade to Premium for unlimited scans.`);
      } else {
        Alert.alert('Something went wrong', 'We couldn\'t analyze that photo. Please try again with a clearer image.');
      }
    }
  }, [activeSegment]);

  const handleScanClose = useCallback(() => {
    setScanResults(null);
  }, []);

  const handleScanSaved = useCallback((count: number) => {
    setScanResults(null);
    setActiveSegment('onhand');
    Alert.alert('Added to Pantry', `Added ${count} items to On Hand`);
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
      await usePlanStore.getState().assignRecipe(
        activeHouseholdId,
        date,
        mealType,
        null,            // no recipe_id — recipe-less meal
        undefined,       // no cook
        dishResult.name, // store dish name in notes field
        'home-cooked',   // default source
        undefined        // no cost
      );
      // Format day label for toast
      const dayDate = new Date(date + 'T12:00:00'); // avoid timezone issues
      const dayLabel = formatDayLabel(dayDate).weekday; // e.g. "Mon"
      const slotLabel = MEAL_TYPE_CONFIG[mealType].label; // e.g. "Dinner"
      Alert.alert('Meal Logged', `Added ${dishResult.name} to ${dayLabel} ${slotLabel}`);
      // Clean up all state
      setDishResult(null);
    } catch {
      Alert.alert('Error', 'Could not log meal. Please try again.');
    }
  }, [activeHouseholdId, dishResult]);

  const summaryData = summary();
  const { sections, completed } = groupedItems();

  // --- Segmented Control ---
  const segmentedControl = (
    <View style={styles.segmentRow}>
      <Pressable
        onPress={() => setActiveSegment('onhand')}
        style={[styles.segmentBtn, activeSegment === 'onhand' && styles.segmentBtnActive]}
      >
        <Text style={[styles.segmentText, activeSegment === 'onhand' && styles.segmentTextActive]}>On Hand</Text>
      </Pressable>
      <Pressable
        onPress={() => setActiveSegment('shopping')}
        style={[styles.segmentBtn, activeSegment === 'shopping' && styles.segmentBtnActive]}
      >
        <Text style={[styles.segmentText, activeSegment === 'shopping' && styles.segmentTextActive]}>Shopping List</Text>
      </Pressable>
    </View>
  );

  // --- On Hand segment ---
  // --- Scan review overlay (shown when scan results available) ---
  const scanReview = scanResults ? (
    <ScanReviewScreen
      initialItems={scanResults}
      onClose={handleScanClose}
      onSaved={handleScanSaved}
    />
  ) : null;

  // --- Camera components shared across all return paths ---
  const cameraComponents = (
    <>
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
          setDishSheetOpen(true); // go back to dish sheet
        }}
        onSelect={handleMealSlotSelected}
      />
    </>
  );

  if (activeSegment === 'onhand') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleSpacer} />
          <Text style={styles.screenTitle}>Kitchen</Text>
          <View style={styles.titleSpacer} />
        </View>
        {segmentedControl}
        <OnHandList />

        {/* Camera FAB */}
        <Pressable
          style={[styles.cameraFab, { bottom: TAB_BAR_HEIGHT + spacing.md }]}
          onPress={handleCameraFab}
          disabled={visionLoading}
          accessibilityLabel="Open camera"
          accessibilityRole="button"
          testID="camera-fab"
        >
          <MaterialCommunityIcons name="camera" size={28} color={colors.onPrimary} />
        </Pressable>

        {cameraComponents}
        {scanReview}
      </View>
    );
  }

  // --- Shopping List segment ---
  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleSpacer} />
          <Text style={styles.screenTitle}>Kitchen</Text>
          <View style={styles.titleSpacer} />
        </View>
        {segmentedControl}
        <View style={styles.skeletonContainer}>
          <Skeleton width="100%" height={80} />
          <Skeleton width="60%" height={20} style={{ marginTop: spacing.md }} />
          <Skeleton width="100%" height={44} style={{ marginTop: spacing.sm }} />
          <Skeleton width="100%" height={44} style={{ marginTop: spacing.sm }} />
          <Skeleton width="100%" height={44} style={{ marginTop: spacing.sm }} />
        </View>

        {/* Camera FAB */}
        <Pressable
          style={[styles.cameraFab, { bottom: TAB_BAR_HEIGHT + spacing.md }]}
          onPress={handleCameraFab}
          disabled={visionLoading}
          accessibilityLabel="Open camera"
          accessibilityRole="button"
          testID="camera-fab"
        >
          <MaterialCommunityIcons name="camera" size={28} color={colors.onPrimary} />
        </Pressable>

        {cameraComponents}
        {scanReview}
      </View>
    );
  }

  // No active list -- show generate button
  if (!activeListId && items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleSpacer} />
          <Text style={styles.screenTitle}>Kitchen</Text>
          <View style={styles.titleSpacer} />
        </View>
        {segmentedControl}
        <EmptyState
          icon="cart-outline"
          title="No grocery list yet"
          subtitle="Generate a list from this week's meal plan"
          actionLabel="Generate List"
          onAction={handleGenerate}
          loading={loading}
        />

        {/* Camera FAB */}
        <Pressable
          style={[styles.cameraFab, { bottom: TAB_BAR_HEIGHT + spacing.md }]}
          onPress={handleCameraFab}
          disabled={visionLoading}
          accessibilityLabel="Open camera"
          accessibilityRole="button"
          testID="camera-fab"
        >
          <MaterialCommunityIcons name="camera" size={28} color={colors.onPrimary} />
        </Pressable>

        {cameraComponents}
        {scanReview}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <PresenceAvatarStack members={presenceMembers} />
        <Text style={styles.screenTitle}>Kitchen</Text>
        <Pressable onPress={() => setCatSheetOpen(true)} style={styles.editCatBtn}>
          <MaterialCommunityIcons name="tag-edit-outline" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      {segmentedControl}

      <GrocerySummary summary={summaryData} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unchecked sections in defined order -- all collapsible */}
        {SECTION_ORDER.map((sectionName) => {
          const sectionItems = sections[sectionName];
          if (!sectionItems || sectionItems.length === 0) return null;
          return (
            <GrocerySection
              key={sectionName}
              title={sectionName}
              items={sectionItems}
              userId={userId}
              onEditItem={(item) => {
                setEditingItem(item);
                setAddSheetOpen(true);
              }}
            />
          );
        })}

        {/* Completed section at bottom */}
        {completed.length > 0 && (
          <GrocerySection
            title="Completed"
            items={completed}
            userId={userId}
            defaultCollapsed
            onEditItem={(item) => {
              setEditingItem(item);
              setAddSheetOpen(true);
            }}
          />
        )}

        {items.length === 0 && (
          <EmptyState
            icon="playlist-plus"
            title="No items in your list"
            subtitle="Tap + to add items manually"
          />
        )}
      </ScrollView>

      {/* Camera FAB — positioned above the add-item FAB */}
      <Pressable
        style={[styles.cameraFab, { bottom: TAB_BAR_HEIGHT + spacing.md + 56 + spacing.sm }]}
        onPress={handleCameraFab}
        disabled={visionLoading}
        accessibilityLabel="Open camera"
        accessibilityRole="button"
        testID="camera-fab"
      >
        <MaterialCommunityIcons name="camera" size={28} color={colors.onPrimary} />
      </Pressable>

      {/* FAB for manual add */}
      {activeListId && (
        <Pressable
          style={[styles.fab, { bottom: TAB_BAR_HEIGHT + spacing.md }]}
          onPress={() => { setEditingItem(null); setAddSheetOpen(true); }}
          testID="add-item-fab"
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
        </Pressable>
      )}

      {activeListId && (
        <AddItemSheet
          isOpen={addSheetOpen}
          onClose={() => {
            setAddSheetOpen(false);
            setEditingItem(null);
          }}
          listId={activeListId}
          editItem={editingItem}
        />
      )}

      <EditCategoriesSheet
        isOpen={catSheetOpen}
        onClose={() => setCatSheetOpen(false)}
      />

      {currentToast && (
        <ActivityToast
          avatar_url={currentToast.avatar_url}
          display_name={currentToast.display_name}
          message={currentToast.message}
          onDismiss={dismissToast}
        />
      )}

      {cameraComponents}
      {scanReview}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  titleSpacer: {
    width: 36,
  },
  editCatBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: borderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    textTransform: 'none',
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  skeletonContainer: {
    padding: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
  cameraFab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
});
