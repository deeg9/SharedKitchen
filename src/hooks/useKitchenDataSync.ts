import { useEffect, useRef } from 'react';
import { useHouseholdStore } from '../stores/householdStore';
import { usePlanStore } from '../stores/planStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useGroceryStore } from '../stores/groceryStore';
import { useBudgetStore } from '../stores/budgetStore';
import { getWeekDays, toDateString } from '../lib/dates';

/**
 * Subscribes to activeHouseholdId changes and orchestrates
 * clearing + re-fetching all data stores when the user switches kitchens.
 *
 * Mount once in the tab layout so it runs regardless of which tab is active.
 * Individual tab useEffects still handle initial mount and tab-specific triggers.
 */
export function useKitchenDataSync() {
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip initial mount — tabs handle their own initial fetch
    if (prevIdRef.current === null) {
      prevIdRef.current = activeHouseholdId;
      return;
    }

    // If same id, skip
    if (prevIdRef.current === activeHouseholdId) return;

    prevIdRef.current = activeHouseholdId;

    if (!activeHouseholdId) return;

    // Clear all stores to prevent stale data flash
    usePlanStore.getState().clear();
    useRecipeStore.getState().clear();
    useGroceryStore.getState().clear();
    useBudgetStore.getState().clear();

    // Re-fetch all stores with new kitchen ID
    const weekDays = getWeekDays(0);
    const weekStart = toDateString(weekDays[0]);
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    usePlanStore.getState().fetchMealPlan(activeHouseholdId, weekStart);
    useRecipeStore.getState().fetchRecipes(activeHouseholdId);
    useGroceryStore.getState().fetchGroceryList(activeHouseholdId, weekStart);
    useBudgetStore.getState().fetchExpenses(activeHouseholdId, currentMonth);
    useBudgetStore.getState().fetchBudgetTarget(activeHouseholdId);
  }, [activeHouseholdId]);
}
