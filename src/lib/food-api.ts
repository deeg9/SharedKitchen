import { supabase } from './supabase';
import { FoodSearchResult, FoodItem } from '../types/food';

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
