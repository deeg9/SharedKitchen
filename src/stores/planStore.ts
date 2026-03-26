import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getWeekDays, getWeekLabel, toDateString, makePlanKey } from '../lib/dates';
import { Recipe, Database, MealType } from '../types/database';
import { scheduleCookingReminder, cancelNotification } from '../lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getErrorMessage } from '../lib/errors';

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
    mealType: MealType,
    recipeId: string,
    cookId?: string,
    notes?: string
  ) => Promise<void>;
  clearMeal: (householdId: string, date: string, mealType: MealType) => Promise<void>;
  getRandomSuggestion: (householdId: string) => Promise<Recipe | null>;
  clear: () => void;
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
      (data ?? []).forEach((entry) => {
        // Default to 'dinner' if meal_type column doesn't exist yet
        const mealType = (entry.meal_type as MealType) || 'dinner';
        const typed = { ...entry, meal_type: mealType } as MealPlanWithRecipe;
        planMap.set(makePlanKey(typed.plan_date, mealType), typed);
      });

      set({ mealPlan: planMap, loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  assignRecipe: async (
    householdId: string,
    date: string,
    mealType: MealType,
    recipeId: string,
    cookId?: string,
    notes?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Try with meal_type column; fall back to without if column doesn't exist yet
      let data: MealPlanWithRecipe | null = null;
      let error: { code?: string; message?: string } | null = null;

      const payload: Record<string, unknown> = {
        household_id: householdId,
        recipe_id: recipeId,
        plan_date: date,
        meal_type: mealType,
        assigned_cook: cookId ?? null,
        notes: notes ?? null,
        created_by: user?.id ?? null,
      };

      ({ data, error } = await supabase
        .from('meal_plans')
        .upsert(payload, { onConflict: 'household_id,plan_date,meal_type' })
        .select('*, recipes(*)')
        .single());

      // Fallback: if meal_type column doesn't exist yet (PGRST204), retry without it
      if (error && (error.code === 'PGRST204' || error.message?.includes('meal_type'))) {
        const { meal_type: _mt, ...fallbackPayload } = payload;
        ({ data, error } = await supabase
          .from('meal_plans')
          .upsert(fallbackPayload, { onConflict: 'household_id,plan_date' })
          .select('*, recipes(*)')
          .single());
        if (data) {
          (data as MealPlanWithRecipe).meal_type = mealType; // attach locally
        }
      }

      if (error) throw error;

      set((state) => {
        const newPlan = new Map(state.mealPlan);
        if (data) {
          newPlan.set(makePlanKey(date, mealType), data as MealPlanWithRecipe);
        }
        return { mealPlan: newPlan, loading: false };
      });

      // Schedule cooking reminder notification
      if (data?.id && data?.recipes) {
        try {
          const notifId = await scheduleCookingReminder(
            data.id,
            data.recipes.name,
            date,
            data.recipes.prep_time_minutes ?? 30
          );
          if (notifId) {
            await AsyncStorage.setItem(`notif_meal_${data.id}`, notifId);
          }
        } catch {}
      }
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  clearMeal: async (householdId: string, date: string, mealType: MealType) => {
    set({ loading: true, error: null });
    try {
      // Cancel cooking reminder if one was scheduled
      const planKey = makePlanKey(date, mealType);
      const existingEntry = get().mealPlan.get(planKey);
      if (existingEntry?.id) {
        const notifId = await AsyncStorage.getItem(`notif_meal_${existingEntry.id}`);
        if (notifId) {
          try { await cancelNotification(notifId); } catch {}
          await AsyncStorage.removeItem(`notif_meal_${existingEntry.id}`);
        }
      }

      let { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('household_id', householdId)
        .eq('plan_date', date)
        .eq('meal_type', mealType);

      // Fallback if meal_type column doesn't exist
      if (error && (error.code === 'PGRST204' || error.message?.includes('meal_type'))) {
        ({ error } = await supabase
          .from('meal_plans')
          .delete()
          .eq('household_id', householdId)
          .eq('plan_date', date));
      }

      if (error) throw error;

      set((state) => {
        const newPlan = new Map(state.mealPlan);
        newPlan.delete(makePlanKey(date, mealType));
        return { mealPlan: newPlan, loading: false };
      });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  clear: () => set({ mealPlan: new Map(), loading: false, error: null, weekOffset: 0 }),

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
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      return null;
    }
  },
}));
