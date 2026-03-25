import { supabase } from './supabase';
import { RecipeInsert } from '../types/database';

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
