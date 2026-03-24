import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { Button } from '../../../src/components/ui/Button';
import { GrocerySection } from '../../../src/components/grocery/GrocerySection';
import { GrocerySummary } from '../../../src/components/grocery/GrocerySummary';
import { AddItemSheet } from '../../../src/components/grocery/AddItemSheet';
import { EditCategoriesSheet } from '../../../src/components/grocery/EditCategoriesSheet';
import { useGroceryCategoryStore } from '../../../src/stores/groceryCategoryStore';
import { useGroceryStore } from '../../../src/stores/groceryStore';
import { useHouseholdStore } from '../../../src/stores/householdStore';
import { usePlanStore } from '../../../src/stores/planStore';
import { useGrocerySync } from '../../../src/hooks/useGrocerySync';
import { getWeekDays, toDateString } from '../../../src/lib/dates';
import { supabase } from '../../../src/lib/supabase';
import { TAB_BAR_HEIGHT } from '../../../src/lib/constants';

const SECTION_ORDER = ['Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other'];

import { GroceryItem as GroceryItemType } from '../../../src/types/database';

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItemType | null>(null);
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const initCategories = useGroceryCategoryStore((s) => s.initialize);

  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const mealPlan = usePlanStore((s) => s.mealPlan);

  const {
    items,
    activeListId,
    loading,
    error,
    summary,
    groupedItems,
    fetchGroceryList,
    generateGroceryList,
  } = useGroceryStore();

  // Realtime sync
  useGrocerySync(activeHouseholdId, activeListId);

  // Get current user id + init categories
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
    initCategories();
  }, []);

  // Fetch grocery list on mount
  useEffect(() => {
    if (!activeHouseholdId) return;
    const weekDays = getWeekDays(0);
    const weekStart = toDateString(weekDays[0]);
    fetchGroceryList(activeHouseholdId, weekStart);
  }, [activeHouseholdId]);

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

  const summaryData = summary();
  const { sections, completed } = groupedItems();

  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.screenTitle}>Grocery List</Text>
        <View style={styles.skeletonContainer}>
          <Skeleton width="100%" height={80} />
          <Skeleton width="60%" height={20} style={{ marginTop: spacing.md }} />
          <Skeleton width="100%" height={44} style={{ marginTop: spacing.sm }} />
          <Skeleton width="100%" height={44} style={{ marginTop: spacing.sm }} />
          <Skeleton width="100%" height={44} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  }

  // No active list -- show generate button
  if (!activeListId && items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.screenTitle}>Grocery List</Text>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="cart-outline"
            size={64}
            color={colors.outlineVariant}
          />
          <Text style={styles.emptyTitle}>No grocery list yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate a list from this week's meal plan
          </Text>
          <Button
            onPress={handleGenerate}
            loading={loading}
            style={styles.generateButton}
            testID="generate-list-button"
          >
            Generate List
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <View style={styles.editCatBtn} />
        <Text style={styles.screenTitle}>Grocery List</Text>
        <Pressable onPress={() => setCatSheetOpen(true)} style={styles.editCatBtn}>
          <MaterialCommunityIcons name="tag-edit-outline" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <GrocerySummary summary={summaryData} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unchecked sections in defined order — all collapsible */}
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
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>
              No items in your list. Tap + to add items manually.
            </Text>
          </View>
        )}
      </ScrollView>

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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  generateButton: {
    minWidth: 180,
  },
  emptyList: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyListText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
});
