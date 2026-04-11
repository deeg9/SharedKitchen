import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CookLog, CookLogInsert, CookLogWithProfile } from '../types/database';
import { getErrorMessage } from '../lib/errors';

interface UnloggedMeal {
  plan_id: string;
  recipe_id: string;
  recipe_name: string;
  recipe_image: string | null;
  plan_date: string;
}

interface CookLogState {
  cookLogs: CookLogWithProfile[];
  cookCount: number;
  loading: boolean;
  error: string | null;
  unloggedMeals: UnloggedMeal[];

  // Actions
  fetchCookCount: (recipeId: string) => Promise<void>;
  fetchCookLogs: (recipeId: string) => Promise<void>;
  createCookLog: (params: {
    recipeId: string;
    userId: string;
    householdId: string;
    photoUri?: string;
    notes?: string;
    recipeName: string;
    recipeImageUrl?: string;
    kitchenId?: string;
  }) => Promise<CookLog | null>;
  fetchUnloggedMeals: (householdId: string, userId: string) => Promise<void>;
  deleteCookLog: (logId: string, photoUrl: string | null) => Promise<void>;
}

export const useCookLogStore = create<CookLogState>((set, get) => ({
  cookLogs: [],
  cookCount: 0,
  loading: false,
  error: null,
  unloggedMeals: [],

  fetchCookCount: async (recipeId: string) => {
    try {
      const { count, error } = await supabase
        .from('cook_logs')
        .select('id', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      if (error) throw error;

      set({ cookCount: count ?? 0 });
    } catch (error: unknown) {
      set({ cookCount: 0, error: getErrorMessage(error) });
    }
  },

  fetchCookLogs: async (recipeId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('cook_logs')
        .select('*, profiles(handle, avatar_url)')
        .eq('recipe_id', recipeId)
        .order('cooked_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      set({ cookLogs: (data as CookLogWithProfile[]) ?? [], loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  createCookLog: async (params) => {
    const previousCount = get().cookCount;
    // Optimistically increment
    set({ cookCount: previousCount + 1, error: null });

    try {
      let photoUrl: string | null = null;

      if (params.photoUri) {
        const { uploadCookLogPhoto } = await import('../lib/cookLogHelpers');
        photoUrl = await uploadCookLogPhoto(params.recipeId, params.userId, params.photoUri);
      }

      const insert: CookLogInsert = {
        recipe_id: params.recipeId,
        user_id: params.userId,
        household_id: params.householdId,
        photo_url: photoUrl,
        notes: params.notes ?? null,
      };

      const { data, error } = await supabase
        .from('cook_logs')
        .insert(insert)
        .select()
        .single();

      if (error) throw error;

      // Fire-and-forget feed post for social feed (FEED-01)
      if (params.kitchenId) {
        const { createCookLogFeedPost } = await import('../lib/feedHelpers');
        createCookLogFeedPost({
          kitchenId: params.kitchenId,
          recipeId: params.recipeId,
          recipeName: params.recipeName,
          recipeImageUrl: photoUrl ?? params.recipeImageUrl ?? null,
          cookLogId: (data as CookLog).id,
          caption: params.notes ?? null,
          photoUrl: photoUrl,
        });
      }

      return data as CookLog;
    } catch (error: unknown) {
      // Rollback optimistic increment
      set({ cookCount: previousCount, error: getErrorMessage(error) });
      return null;
    }
  },

  fetchUnloggedMeals: async (householdId: string, userId: string) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Fetch yesterday's dinner meal plans with recipes
      const { data: mealPlans, error: mealError } = await supabase
        .from('meal_plans')
        .select('id, recipe_id, plan_date, meal_type, recipes(name, image_url)')
        .eq('household_id', householdId)
        .eq('plan_date', yesterdayStr)
        .eq('meal_type', 'dinner')
        .not('recipe_id', 'is', null)
        .order('created_at', { ascending: false });

      if (mealError) throw mealError;
      if (!mealPlans || mealPlans.length === 0) {
        set({ unloggedMeals: [] });
        return;
      }

      // Check which recipes already have cook logs for this user on that date
      const recipeIds = mealPlans.map((mp: Record<string, unknown>) => mp.recipe_id as string);
      const startOfDay = `${yesterdayStr}T00:00:00Z`;
      const endOfDay = `${yesterdayStr}T23:59:59Z`;

      const { data: existingLogs, error: logError } = await supabase
        .from('cook_logs')
        .select('recipe_id')
        .eq('user_id', userId)
        .in('recipe_id', recipeIds)
        .gte('cooked_at', startOfDay)
        .lte('cooked_at', endOfDay);

      if (logError) throw logError;

      const loggedRecipeIds = new Set(
        (existingLogs ?? []).map((log: Record<string, unknown>) => log.recipe_id as string)
      );

      const unlogged: UnloggedMeal[] = mealPlans
        .filter((mp: Record<string, unknown>) => !loggedRecipeIds.has(mp.recipe_id as string))
        .map((mp: Record<string, unknown>) => {
          const recipe = mp.recipes as { name: string; image_url: string | null } | null;
          return {
            plan_id: mp.id as string,
            recipe_id: mp.recipe_id as string,
            recipe_name: recipe?.name ?? 'Unknown Recipe',
            recipe_image: recipe?.image_url ?? null,
            plan_date: mp.plan_date as string,
          };
        });

      set({ unloggedMeals: unlogged });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  deleteCookLog: async (logId: string, photoUrl: string | null) => {
    try {
      const { error } = await supabase
        .from('cook_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      // Delete photo from storage if exists
      if (photoUrl) {
        try {
          const { deleteCookLogPhoto } = await import('../lib/cookLogHelpers');
          await deleteCookLogPhoto(photoUrl);
        } catch {
          // Non-blocking photo delete
        }
      }

      set((state) => ({
        cookCount: Math.max(0, state.cookCount - 1),
        cookLogs: state.cookLogs.filter((log) => log.id !== logId),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },
}));
