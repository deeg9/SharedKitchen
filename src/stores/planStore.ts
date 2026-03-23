import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getWeekDays, getWeekLabel, toDateString } from '../lib/dates';
import { Recipe, Database } from '../types/database';

export type MealPlan = Database['public']['Tables']['meal_plans']['Row'];

export interface MealPlanWithRecipe extends MealPlan {
  recipes: Recipe | null;
}

interface PlanState {
  weekOffset: number;
  mealPlan: Map<string, MealPlanWithRecipe>;
  loading: boolean;
  error: string | null;

  // Computed
  weekDays: () => Date[];
  weekLabel: () => string;

  // Actions
  setWeekOffset: (offset: number) => void;
  fetchMealPlan: (householdId: string, weekStart: string) => Promise<void>;
  assignRecipe: (
    householdId: string,
    date: string,
    recipeId: string,
    cookId?: string,
    notes?: string
  ) => Promise<void>;
  clearDay: (householdId: string, date: string) => Promise<void>;
  getRandomSuggestion: (householdId: string) => Promise<Recipe | null>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  weekOffset: 0,
  mealPlan: new Map(),
  loading: false,
  error: null,

  weekDays: () => getWeekDays(get().weekOffset),
  weekLabel: () => getWeekLabel(get().weekOffset),

  setWeekOffset: (offset: number) => {
    set({ weekOffset: offset });
  },

  fetchMealPlan: async (householdId: string, weekStart: string) => {
    set({ loading: true, error: null });
    try {
      const days = getWeekDays(get().weekOffset);
      const startDate = toDateString(days[0]);
      const endDate = toDateString(days[6]);

      const { data, error } = await supabase
        .from('meal_plans')
        .select('*, recipes(*)')
        .eq('household_id', householdId)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate);

      if (error) throw error;

      const planMap = new Map<string, MealPlanWithRecipe>();
      (data ?? []).forEach((entry: any) => {
        planMap.set(entry.plan_date, entry as MealPlanWithRecipe);
      });

      set({ mealPlan: planMap, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to fetch meal plan' });
    }
  },

  assignRecipe: async (
    householdId: string,
    date: string,
    recipeId: string,
    cookId?: string,
    notes?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('meal_plans')
        .upsert(
          {
            household_id: householdId,
            recipe_id: recipeId,
            plan_date: date,
            assigned_cook: cookId ?? null,
            notes: notes ?? null,
            created_by: user?.id ?? null,
          },
          { onConflict: 'household_id,plan_date' }
        )
        .select('*, recipes(*)')
        .single();

      if (error) throw error;

      set((state) => {
        const newPlan = new Map(state.mealPlan);
        if (data) {
          newPlan.set(date, data as MealPlanWithRecipe);
        }
        return { mealPlan: newPlan, loading: false };
      });
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to assign recipe' });
    }
  },

  clearDay: async (householdId: string, date: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('household_id', householdId)
        .match({ plan_date: date });

      if (error) throw error;

      set((state) => {
        const newPlan = new Map(state.mealPlan);
        newPlan.delete(date);
        return { mealPlan: newPlan, loading: false };
      });
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to clear day' });
    }
  },

  getRandomSuggestion: async (householdId: string) => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('household_id', householdId);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex] as Recipe;
    } catch (error: any) {
      set({ error: error.message ?? 'Failed to get suggestion' });
      return null;
    }
  },
}));
