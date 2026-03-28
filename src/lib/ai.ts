import { supabase } from './supabase';
import { RecipeInsert } from '../types/database';
import { isVideoUrl } from './videoUrl';

/** Shape of the error context returned by supabase.functions.invoke for non-2xx responses. */
interface SupabaseFunctionError extends Error {
  context?: { status?: number };
}

// ── Client-side JSON-LD Recipe Extraction ──────────────────────────

function extractJsonLd(html: string, sourceUrl: string): Omit<RecipeInsert, 'household_id' | 'created_by'> | null {
  try {
    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        let parsed = JSON.parse(match[1]);
        // Handle @graph arrays
        if (parsed['@graph']) parsed = parsed['@graph'];
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const recipe = items.find((item: any) =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
        if (!recipe) continue;

        // Parse ISO 8601 duration (PT1H30M → 90)
        const parseDuration = (d: string | undefined): number | null => {
          if (!d) return null;
          const h = d.match(/(\d+)H/)?.[1];
          const m = d.match(/(\d+)M/)?.[1];
          return (parseInt(h ?? '0') * 60) + parseInt(m ?? '0') || null;
        };

        // Parse ingredients
        const ingredients = (recipe.recipeIngredient ?? []).map((ing: string, i: number) => {
          const amountMatch = ing.match(/^([\d./½¼¾⅓⅔]+)\s*/);
          const amount = amountMatch ? parseFloat(amountMatch[1].replace('½', '0.5').replace('¼', '0.25').replace('¾', '0.75').replace('⅓', '0.33').replace('⅔', '0.67')) || 1 : 1;
          const rest = amountMatch ? ing.slice(amountMatch[0].length) : ing;
          const unitMatch = rest.match(/^(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|g|kg|ml|l|cloves?|cans?|pieces?|slices?|pinch)\s+/i);
          const unit = unitMatch ? unitMatch[1] : 'unit';
          const name = unitMatch ? rest.slice(unitMatch[0].length) : rest;
          return { amount, unit, name: name.trim(), section: null };
        });

        // Parse instructions
        const rawInstructions = recipe.recipeInstructions ?? [];
        const instructions = rawInstructions.map((step: any, i: number) => {
          const text = typeof step === 'string' ? step : step.text ?? '';
          const timers: { duration_seconds: number; label: string }[] = [];
          const timeMatch = text.match(/(\d+)\s*(?:minutes?|mins?)/i);
          if (timeMatch) timers.push({ duration_seconds: parseInt(timeMatch[1]) * 60, label: `Step ${i + 1}` });
          return { step_number: i + 1, text, timers };
        });

        if (ingredients.length === 0 && instructions.length === 0) return null;

        // Extract image
        let imageUrl = null;
        if (recipe.image) {
          imageUrl = typeof recipe.image === 'string' ? recipe.image :
                     Array.isArray(recipe.image) ? recipe.image[0] :
                     recipe.image?.url ?? null;
        }

        // Extract nutrition
        let nutritionInfo = null;
        if (recipe.nutrition) {
          nutritionInfo = {
            calories: recipe.nutrition.calories ?? null,
            protein: recipe.nutrition.proteinContent ?? null,
            fat: recipe.nutrition.fatContent ?? null,
            carbohydrates: recipe.nutrition.carbohydrateContent ?? null,
          };
        }

        const category = recipe.recipeCategory
          ? (Array.isArray(recipe.recipeCategory) ? recipe.recipeCategory[0] : recipe.recipeCategory)
          : null;

        const tags = [
          ...(recipe.keywords ? (typeof recipe.keywords === 'string' ? recipe.keywords.split(',').map((k: string) => k.trim()) : recipe.keywords) : []),
          ...(recipe.recipeCuisine ? (Array.isArray(recipe.recipeCuisine) ? recipe.recipeCuisine : [recipe.recipeCuisine]) : []),
        ].slice(0, 5);

        return {
          name: recipe.name ?? 'Untitled Recipe',
          category,
          prep_time_minutes: parseDuration(recipe.prepTime),
          cook_time_minutes: parseDuration(recipe.cookTime),
          servings: parseInt(recipe.recipeYield?.[0] ?? recipe.recipeYield ?? '4') || 4,
          estimated_cost: null,
          source_url: sourceUrl,
          source_image_url: imageUrl,
          nutrition_info: nutritionInfo,
          ingredients,
          instructions,
          tags,
        };
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

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

export class VideoRateLimitError extends Error {
  limit: number;
  used: number;
  remaining: number;

  constructor(message: string, limit: number, used: number) {
    super(message);
    this.name = 'VideoRateLimitError';
    this.limit = limit;
    this.used = used;
    this.remaining = Math.max(0, limit - used);
  }
}

// ── Video Import Helpers ──────────────────────────────────────────

async function callEdgeFunctionForVideo(
  url: string
): Promise<Omit<RecipeInsert, 'household_id' | 'created_by'>> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const fnResponse = await fetch(`${supabaseUrl}/functions/v1/parse-recipe-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey ?? '',
    },
    body: JSON.stringify({ url, type: 'video' }),
  });

  let data: any;
  const contentType = fnResponse.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await fnResponse.json();
  } else {
    const text = await fnResponse.text();
    throw new Error(`Server error (${fnResponse.status}). Please try again.`);
  }

  if (!fnResponse.ok) {
    if (fnResponse.status === 429 && data?.type === 'video_limit_exceeded') {
      throw new VideoRateLimitError(
        data.error ?? 'Monthly video import limit reached',
        data.limit ?? 3,
        data.used ?? 0
      );
    }
    throw new Error(data.error ?? `Video import failed (${fnResponse.status})`);
  }

  // Validate response shape
  if (!data || typeof data.name !== 'string' || !Array.isArray(data.ingredients)) {
    throw new Error('Invalid response from video parser. The video may not contain a valid recipe.');
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

/**
 * Returns the current month's video import usage for a user.
 */
export async function getVideoImportCount(userId: string): Promise<{ used: number; limit: number }> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ai_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', 'parse-video-recipe')
    .gte('created_at', monthStart.toISOString());

  return { used: count ?? 0, limit: 3 };
}

/**
 * Parses a recipe URL. Tries JSON-LD client-side first (instant, free),
 * falls back to edge function + Gemini if JSON-LD is missing/incomplete.
 */
export async function parseRecipeUrl(
  url: string
): Promise<Omit<RecipeInsert, 'household_id' | 'created_by'>> {
  // Video URLs skip HTML fetch entirely -- per locked decision
  if (isVideoUrl(url)) {
    return callEdgeFunctionForVideo(url);
  }

  // Fetch HTML client-side — mobile browsers aren't blocked by recipe sites
  let html: string;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
  } catch {
    throw new Error('Failed to fetch the recipe page. Please check the URL and try again.');
  }

  // Try JSON-LD extraction client-side first (instant, no AI needed)
  const jsonLdRecipe = extractJsonLd(html, url);
  if (jsonLdRecipe) {
    return jsonLdRecipe;
  }

  // Fall back to edge function + Gemini
  // Strip non-content HTML to reduce payload
  let cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s{2,}/g, ' ');
  if (cleanHtml.length > 20000) cleanHtml = cleanHtml.slice(0, 20000);

  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const fnResponse = await fetch(`${supabaseUrl}/functions/v1/parse-recipe-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey ?? '',
    },
    body: JSON.stringify({ url, html: cleanHtml }),
  });

  let data: any;
  const contentType = fnResponse.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await fnResponse.json();
  } else {
    const text = await fnResponse.text();
    throw new Error(`Server error (${fnResponse.status}). Please try again.`);
  }

  if (!fnResponse.ok) {
    if (fnResponse.status === 429) {
      throw new RateLimitError(
        `Daily import limit reached (${data.limit ?? 10})`,
        data.limit ?? 10,
        0
      );
    }
    throw new Error(data.error ?? `Import failed (${fnResponse.status})`);
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
    if (errorBody.includes('Rate limit exceeded') || (error as SupabaseFunctionError).context?.status === 429) {
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
