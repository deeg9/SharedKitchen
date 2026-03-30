import { RecipeSearchResult } from '../types/recipeSearch';
import { supabase } from './supabase';
import { RateLimitError } from './ai';

/**
 * Searches the web for recipes matching a dish name via the search-recipes Edge Function.
 * Returns up to 3 recipe results with title, URL, source domain, and optional thumbnail.
 */
export async function searchRecipes(dishName: string): Promise<RecipeSearchResult[]> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/search-recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey ?? '',
    },
    body: JSON.stringify({ query: dishName }),
  });

  let data: any;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    throw new Error(`Server error (${response.status}). Please try again.`);
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new RateLimitError(
        'Monthly recipe search limit reached',
        data.limit ?? 20,
        0
      );
    }
    throw new Error(data.error ?? 'Recipe search failed');
  }

  return data.results as RecipeSearchResult[];
}
