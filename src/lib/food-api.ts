import { supabase } from './supabase';
import { FoodSearchResult, FoodItem, NutritionData } from '../types/food';

/**
 * Custom error for search rate limit exceeded.
 * Thrown when user hits daily food search limit (20/day free tier).
 */
export class SearchLimitError extends Error {
  limit: number;
  used: number;
  constructor(message: string, limit: number, used: number) {
    super(message);
    this.name = 'SearchLimitError';
    this.limit = limit;
    this.used = used;
  }
}

/**
 * Search foods via the food-search Edge Function.
 * Returns lightweight FoodSearchResult[] for display in search results.
 */
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const { data, error } = await supabase.functions.invoke('food-search', {
    body: { query },
  });

  if (error) {
    // Try to read the response body for specific error types
    try {
      const ctx = (error as any).context;
      if (ctx && !ctx.bodyUsed) {
        const body = await ctx.json();
        if (body.type === 'search_limit_exceeded') {
          throw new SearchLimitError(
            body.error ?? 'Daily food search limit reached',
            body.limit ?? 20,
            body.used ?? 0
          );
        }
        throw new Error(body?.error ?? 'Food search failed');
      }
    } catch (readErr: any) {
      if (readErr instanceof SearchLimitError) {
        throw readErr;
      }
      if (readErr.message && readErr.message !== error.message) {
        throw readErr;
      }
    }
    throw new Error(error.message ?? 'Food search failed');
  }

  return data?.results ?? [];
}

/**
 * Look up a food product by barcode via the food-barcode Edge Function.
 * Returns { found: true, food } or { found: false }.
 * Throws SearchLimitError if daily limit reached.
 */
export async function lookupBarcode(barcode: string): Promise<{ found: boolean; food?: FoodItem }> {
  const { data, error } = await supabase.functions.invoke('food-barcode', {
    body: { barcode },
  });

  if (error) {
    // Try to read the response body for specific error types
    try {
      const ctx = (error as any).context;
      if (ctx && !ctx.bodyUsed) {
        const body = await ctx.json();
        if (body.type === 'search_limit_exceeded') {
          throw new SearchLimitError(
            body.error ?? 'Daily food search limit reached',
            body.limit ?? 20,
            body.used ?? 0
          );
        }
        throw new Error(body?.error ?? 'Barcode lookup failed');
      }
    } catch (readErr: any) {
      if (readErr instanceof SearchLimitError) {
        throw readErr;
      }
      if (readErr.message && readErr.message !== error.message) {
        throw readErr;
      }
    }
    throw new Error(error.message ?? 'Barcode lookup failed');
  }

  return {
    found: data?.found ?? false,
    food: data?.food ?? undefined,
  };
}

/**
 * Fetch full food item detail from the food_items cache table.
 * Returns null if not found or on error.
 */
export async function getFoodDetail(foodId: string): Promise<FoodItem | null> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .eq('id', foodId)
    .maybeSingle();

  if (error) {
    console.warn('[food-api] getFoodDetail error:', error.message);
    return null;
  }

  return data as FoodItem | null;
}

/**
 * A single ingredient-to-food match result from the AI matching pipeline.
 */
export interface IngredientMatch {
  ingredient_index: number;
  ingredient_name: string;
  food_id: string | null;
  food_name: string | null;
  confidence: number;
  amount_grams: number | null;
}

/**
 * Response from the match-ingredients Edge Function.
 */
export interface MatchIngredientsResponse {
  matches: IngredientMatch[];
  total_nutrition: NutritionData;
  per_serving_nutrition: NutritionData;
  matched_count: number;
  total_count: number;
}

/**
 * Custom error for ingredient matching rate limit exceeded.
 */
export class MatchLimitError extends Error {
  limit: number;
  used: number;
  constructor(message: string, limit: number, used: number) {
    super(message);
    this.name = 'MatchLimitError';
    this.limit = limit;
    this.used = used;
  }
}

/**
 * Match recipe ingredients to food database items via AI.
 * Calls the match-ingredients Edge Function which uses Gemini 2.5 Flash
 * to match ingredient text to food_items, computes nutrition, and caches on recipe.
 */
export async function matchIngredients(
  recipeId: string,
  ingredients: Array<{ amount: number; unit: string; name: string }>,
  servings: number
): Promise<MatchIngredientsResponse> {
  const { data, error } = await supabase.functions.invoke('match-ingredients', {
    body: { recipe_id: recipeId, ingredients, servings },
  });

  if (error) {
    // Try to read the response body for specific error types
    try {
      const ctx = (error as any).context;
      if (ctx && !ctx.bodyUsed) {
        const body = await ctx.json();
        if (body.type === 'match_limit_exceeded') {
          throw new MatchLimitError(
            body.error ?? 'Monthly ingredient matching limit reached',
            body.limit ?? 20,
            body.used ?? 0
          );
        }
        throw new Error(body?.error ?? 'Ingredient matching failed');
      }
    } catch (readErr: any) {
      if (readErr instanceof MatchLimitError) {
        throw readErr;
      }
      if (readErr.message && readErr.message !== error.message) {
        throw readErr;
      }
    }
    throw new Error(error.message ?? 'Ingredient matching failed');
  }

  return {
    matches: data?.matches ?? [],
    total_nutrition: data?.total_nutrition ?? { calories: 0, protein_g: 0, total_fat_g: 0, sodium_mg: 0, total_carbs_g: 0 },
    per_serving_nutrition: data?.per_serving_nutrition ?? { calories: 0, protein_g: 0, total_fat_g: 0, sodium_mg: 0, total_carbs_g: 0 },
    matched_count: data?.matched_count ?? 0,
    total_count: data?.total_count ?? 0,
  };
}
