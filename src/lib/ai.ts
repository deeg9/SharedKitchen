import { supabase } from './supabase';
import { RecipeInsert } from '../types/database';

// ── Meal Suggestion Types ──────────────────────────────────────────

export interface MealSuggestion {
  name: string;
  description: string;
  estimated_cost: number | null;
  prep_time_minutes: number | null;
  uses_leftovers: boolean;
  leftover_items: string[];
}

export interface MealPromptContext {
  leftovers: Array<{ name: string; portions: number; use_by_date?: string | null }>;
  dietaryPreferences: string[];
  recentMeals: string[];
  remainingBudget: number | null;
}

// ── Meal Prompt Builder (pure, testable) ───────────────────────────

/**
 * Builds a prompt string for the meal suggestion AI from household context.
 */
export function buildMealPrompt(context: MealPromptContext): string {
  let prompt = 'Suggest 3 dinner ideas for tonight. Consider the following context:\n\n';

  if (context.dietaryPreferences.length > 0) {
    prompt += `Dietary preferences/restrictions: ${context.dietaryPreferences.join(', ')}. All suggestions MUST comply with these.\n\n`;
  }

  if (context.recentMeals.length > 0) {
    prompt += `Recent meals to avoid repeating: ${context.recentMeals.slice(0, 10).join(', ')}. Suggest something different.\n\n`;
  }

  if (context.leftovers.length > 0) {
    const leftoverDesc = context.leftovers
      .sort((a, b) => {
        if (!a.use_by_date) return 1;
        if (!b.use_by_date) return -1;
        return new Date(a.use_by_date).getTime() - new Date(b.use_by_date).getTime();
      })
      .map((l) => {
        const expiry = l.use_by_date ? ` (use by ${l.use_by_date})` : '';
        return `${l.name} (${l.portions} portions${expiry})`;
      })
      .join(', ');
    prompt += `Available leftovers to incorporate: ${leftoverDesc}. Prioritize using items expiring soon.\n\n`;
  }

  if (context.remainingBudget !== null) {
    prompt += `Remaining monthly budget: $${context.remainingBudget.toFixed(0)}. Keep suggestions budget-friendly.\n\n`;
  }

  prompt += 'For each suggestion, provide the recipe name, a brief appetizing description, estimated cost, prep time, whether it uses leftovers, and which leftover items it uses.';

  return prompt;
}

// ── Meal Suggestion Parser (pure, testable) ────────────────────────

/**
 * Parses the structured response from OpenAI into typed MealSuggestion array.
 */
export function parseMealSuggestions(response: any): MealSuggestion[] {
  if (!response || !Array.isArray(response.suggestions)) {
    return [];
  }

  return response.suggestions.map((s: any) => ({
    name: s.name ?? '',
    description: s.description ?? '',
    estimated_cost: s.estimated_cost ?? null,
    prep_time_minutes: s.prep_time_minutes ?? null,
    uses_leftovers: s.uses_leftovers ?? false,
    leftover_items: Array.isArray(s.leftover_items) ? s.leftover_items : [],
  }));
}

export class RateLimitError extends Error {
  limit: number;
  remaining: number;

  constructor(message: string, limit: number, remaining: number) {
    super(message);
    this.name = 'RateLimitError';
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Parses a recipe URL using the Supabase Edge Function (OpenAI-powered).
 * Returns structured recipe data ready for insertion (without household_id/created_by).
 */
export async function parseRecipeUrl(
  url: string
): Promise<Omit<RecipeInsert, 'household_id' | 'created_by'>> {
  const { data, error } = await supabase.functions.invoke('parse-recipe-url', {
    body: { url },
  });

  // Check for rate limit response
  if (error) {
    // Supabase functions.invoke returns the response body in error.context for non-2xx
    const errorBody = typeof error.message === 'string' ? error.message : '';
    if (errorBody.includes('Rate limit exceeded') || (error as any).context?.status === 429) {
      try {
        const parsed = JSON.parse(errorBody);
        throw new RateLimitError(
          `Daily import limit reached (${parsed.limit}/${parsed.limit})`,
          parsed.limit ?? 10,
          0
        );
      } catch (e) {
        if (e instanceof RateLimitError) throw e;
        throw new RateLimitError('Daily import limit reached. Try again tomorrow.', 10, 0);
      }
    }
  }

  if (error) {
    throw new Error(
      error.message ?? 'Failed to parse recipe from URL. Please try again.'
    );
  }

  // Validate response shape
  if (!data || typeof data.name !== 'string' || !Array.isArray(data.ingredients)) {
    throw new Error(
      'Invalid response from recipe parser. The URL may not contain a valid recipe.'
    );
  }

  return {
    name: data.name,
    category: data.category ?? null,
    prep_time_minutes: data.prep_time_minutes ?? null,
    cook_time_minutes: data.cook_time_minutes ?? null,
    servings: data.servings ?? 4,
    estimated_cost: data.estimated_cost ?? null,
    ingredients: data.ingredients ?? [],
    instructions: data.instructions ?? [],
    tags: data.tags ?? [],
    source_url: url,
  };
}

// ── Generate Meal Suggestions ──────────────────────────────────────

/**
 * Calls the generate-meal Edge Function to get context-aware meal suggestions.
 * Dietary preferences are read from AsyncStorage on the client and passed in.
 */
export async function generateMealSuggestions(
  householdId: string,
  dietaryPreferences: string[]
): Promise<MealSuggestion[]> {
  const { data, error } = await supabase.functions.invoke('generate-meal', {
    body: {
      household_id: householdId,
      dietary_preferences: dietaryPreferences,
    },
  });

  // Check for rate limit response
  if (error) {
    const errorBody = typeof error.message === 'string' ? error.message : '';
    if (errorBody.includes('Rate limit exceeded') || (error as any).context?.status === 429) {
      try {
        const parsed = JSON.parse(errorBody);
        throw new RateLimitError(
          `Daily meal generation limit reached (${parsed.limit}/${parsed.limit})`,
          parsed.limit ?? 5,
          0
        );
      } catch (e) {
        if (e instanceof RateLimitError) throw e;
        throw new RateLimitError('Daily meal generation limit reached. Try again tomorrow.', 5, 0);
      }
    }
  }

  if (error) {
    throw new Error(
      error.message ?? 'Failed to generate meal suggestions. Please try again.'
    );
  }

  return parseMealSuggestions(data);
}
