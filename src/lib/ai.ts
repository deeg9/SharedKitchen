import { supabase } from './supabase';
import { RecipeInsert } from '../types/database';

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
