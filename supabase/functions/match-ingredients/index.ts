// Supabase Edge Function: match-ingredients
// Accepts recipe ingredients, uses Gemini 2.5 Flash to match them to food_items,
// computes per-serving nutrition totals, caches on recipe, returns matches with nutrition.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngredientInput {
  amount: number;
  unit: string;
  name: string;
}

interface GeminiMatch {
  ingredient_name: string;
  matched_food_name: string;
  confidence: number;
  amount_grams_estimate: number | null;
}

interface NutritionData {
  calories: number;
  protein_g: number;
  total_fat_g: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  sodium_mg: number;
  total_carbs_g: number;
  dietary_fiber_g?: number;
  total_sugars_g?: number;
  added_sugars_g?: number;
  vitamin_d_mcg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
}

function emptyNutrition(): NutritionData {
  return {
    calories: 0,
    protein_g: 0,
    total_fat_g: 0,
    sodium_mg: 0,
    total_carbs_g: 0,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function scaleNutrition(per100g: NutritionData, amountGrams: number): NutritionData {
  const factor = amountGrams / 100;
  const result: NutritionData = {
    calories: round1(per100g.calories * factor),
    protein_g: round1(per100g.protein_g * factor),
    total_fat_g: round1(per100g.total_fat_g * factor),
    sodium_mg: round1(per100g.sodium_mg * factor),
    total_carbs_g: round1(per100g.total_carbs_g * factor),
  };

  const optionalKeys: (keyof NutritionData)[] = [
    'saturated_fat_g', 'trans_fat_g', 'cholesterol_mg', 'dietary_fiber_g',
    'total_sugars_g', 'added_sugars_g', 'vitamin_d_mcg', 'calcium_mg',
    'iron_mg', 'potassium_mg',
  ];
  for (const key of optionalKeys) {
    const val = per100g[key];
    if (val !== undefined && val !== null) {
      (result as Record<string, number>)[key] = round1((val as number) * factor);
    }
  }

  return result;
}

function sumNutrition(items: NutritionData[]): NutritionData {
  const result = emptyNutrition();
  const requiredKeys: (keyof NutritionData)[] = ['calories', 'protein_g', 'total_fat_g', 'sodium_mg', 'total_carbs_g'];
  const optionalKeys: (keyof NutritionData)[] = [
    'saturated_fat_g', 'trans_fat_g', 'cholesterol_mg', 'dietary_fiber_g',
    'total_sugars_g', 'added_sugars_g', 'vitamin_d_mcg', 'calcium_mg',
    'iron_mg', 'potassium_mg',
  ];

  for (const item of items) {
    for (const key of requiredKeys) {
      (result as Record<string, number>)[key] += (item[key] as number) || 0;
    }
    for (const key of optionalKeys) {
      const val = item[key];
      if (val !== undefined && val !== null) {
        const current = (result as Record<string, number | undefined>)[key];
        (result as Record<string, number>)[key] = ((current as number) ?? 0) + (val as number);
      }
    }
  }

  return result;
}

function divideNutrition(nutrition: NutritionData, divisor: number): NutritionData {
  if (divisor <= 0) return nutrition;
  const result: NutritionData = {
    calories: round1(nutrition.calories / divisor),
    protein_g: round1(nutrition.protein_g / divisor),
    total_fat_g: round1(nutrition.total_fat_g / divisor),
    sodium_mg: round1(nutrition.sodium_mg / divisor),
    total_carbs_g: round1(nutrition.total_carbs_g / divisor),
  };

  const optionalKeys: (keyof NutritionData)[] = [
    'saturated_fat_g', 'trans_fat_g', 'cholesterol_mg', 'dietary_fiber_g',
    'total_sugars_g', 'added_sugars_g', 'vitamin_d_mcg', 'calcium_mg',
    'iron_mg', 'potassium_mg',
  ];
  for (const key of optionalKeys) {
    const val = nutrition[key];
    if (val !== undefined && val !== null) {
      (result as Record<string, number>)[key] = round1((val as number) / divisor);
    }
  }

  return result;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client for writes (service_role bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { recipe_id, ingredients, servings } = await req.json();

    // Validate inputs
    if (!recipe_id || typeof recipe_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid recipe_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty ingredients array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipeServings = typeof servings === 'number' && servings > 0 ? servings : 1;

    // Verify user has access to this recipe via household membership
    const { data: recipe, error: recipeError } = await supabaseClient
      .from('recipes')
      .select('id, household_id')
      .eq('id', recipe_id)
      .single();

    if (recipeError || !recipe) {
      return new Response(
        JSON.stringify({ error: 'Recipe not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check premium status
    let isPremium = false;
    try {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      isPremium = sub?.status === 'active' || sub?.status === 'trialing';
    } catch {
      isPremium = false;
    }

    // Monthly rate limit check
    let usageCount = 0;
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count } = await supabaseAdmin
        .from('ai_usage_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('function_name', 'match-ingredients')
        .gte('created_at', monthStart.toISOString());

      usageCount = count ?? 0;
    } catch {
      console.warn('ai_usage_log query failed, skipping rate limit check');
    }

    const usageLimit = isPremium ? Infinity : 20;
    if (usageCount >= usageLimit) {
      return new Response(
        JSON.stringify({
          error: 'Monthly ingredient matching limit reached',
          limit: 20,
          remaining: 0,
          used: usageCount,
          type: 'match_limit_exceeded',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gemini API key check
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI matching not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const modelName = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    // Build the ingredient matching prompt
    const ingredientList = (ingredients as IngredientInput[]).map(
      (ing, i) => `${i}. ${ing.amount} ${ing.unit} ${ing.name}`
    ).join('\n');

    const matchPrompt = `You are a food nutrition database matcher. Given recipe ingredient lines, find the best matching common food name from a standard food database (like USDA FoodData Central). For each ingredient, return the most likely base food item and estimate the weight in grams.

Here are examples:
- Input: "2 lbs chicken breast" -> { "matched_food_name": "chicken breast, raw", "confidence": 0.95, "amount_grams_estimate": 907 }
- Input: "1 cup all-purpose flour" -> { "matched_food_name": "all-purpose flour", "confidence": 0.9, "amount_grams_estimate": 120 }
- Input: "salt and pepper to taste" -> { "matched_food_name": "salt", "confidence": 0.5, "amount_grams_estimate": 2 }
- Input: "3 cloves garlic, minced" -> { "matched_food_name": "garlic, raw", "confidence": 0.9, "amount_grams_estimate": 9 }

Now match these recipe ingredients:
${ingredientList}

Return JSON: { "matches": [{ "ingredient_name": string, "matched_food_name": string, "confidence": number, "amount_grams_estimate": number | null }] }

Rules:
- confidence: 0-1 score for how certain the match is
- amount_grams_estimate: total weight in grams for the specified amount, null if truly unknown
- For seasonings/spices with "to taste", estimate a small amount (1-5g)
- Use common USDA-style food names (e.g., "chicken breast, raw" not just "chicken")
- Include ALL ingredients, even low-confidence ones`;

    // Call Gemini with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: matchPrompt }],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (!geminiResp.ok) {
        const errText = await geminiResp.text();
        console.error(`Gemini API error: model=${modelName} status=${geminiResp.status} body=${errText.slice(0, 300)}`);
        return new Response(
          JSON.stringify({ error: 'AI matching failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const geminiData = await geminiResp.json();
      let resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      // Strip markdown fences if present
      resultText = resultText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

      const parsed = JSON.parse(resultText);
      const aiMatches: GeminiMatch[] = parsed.matches ?? [];

      // For each AI match with confidence >= 0.3, look up food_items
      const matchResults: Array<{
        ingredient_index: number;
        ingredient_name: string;
        food_id: string | null;
        food_name: string | null;
        confidence: number;
        amount_grams: number | null;
      }> = [];

      const ingredientNutritions: NutritionData[] = [];

      for (let i = 0; i < aiMatches.length; i++) {
        const match = aiMatches[i];
        const ingredientIndex = i;
        const ingredientName = match.ingredient_name ?? (ingredients as IngredientInput[])[i]?.name ?? '';

        if (match.confidence < 0.3) {
          matchResults.push({
            ingredient_index: ingredientIndex,
            ingredient_name: ingredientName,
            food_id: null,
            food_name: match.matched_food_name,
            confidence: match.confidence,
            amount_grams: match.amount_grams_estimate,
          });
          continue;
        }

        // Search food_items by normalized name
        const searchTerm = match.matched_food_name.toLowerCase().trim();
        const { data: foodResults } = await supabaseAdmin
          .from('food_items')
          .select('*')
          .ilike('name_normalized', `%${searchTerm}%`)
          .limit(3);

        let bestFood: any = null;
        if (foodResults && foodResults.length > 0) {
          // Pick best match by data_quality score
          bestFood = foodResults.reduce((best: any, curr: any) =>
            (curr.data_quality ?? 0) > (best.data_quality ?? 0) ? curr : best
          , foodResults[0]);
        }

        const amountGrams = match.amount_grams_estimate;
        matchResults.push({
          ingredient_index: ingredientIndex,
          ingredient_name: ingredientName,
          food_id: bestFood?.id ?? null,
          food_name: bestFood?.name ?? match.matched_food_name,
          confidence: match.confidence,
          amount_grams: amountGrams,
        });

        // Compute per-ingredient nutrition if we have food data and gram estimate
        if (bestFood?.nutrition && amountGrams && amountGrams > 0) {
          const nutrition = bestFood.nutrition as NutritionData;
          const scaled = scaleNutrition(nutrition, amountGrams);
          ingredientNutritions.push(scaled);
        }
      }

      // Compute recipe total nutrition
      const totalNutrition = ingredientNutritions.length > 0
        ? sumNutrition(ingredientNutritions)
        : emptyNutrition();

      // Per-serving nutrition
      const perServingNutrition = divideNutrition(totalNutrition, recipeServings);

      const matchedCount = matchResults.filter(m => m.food_id !== null).length;

      // Cache results on recipe using admin client
      await supabaseAdmin
        .from('recipes')
        .update({
          computed_nutrition: perServingNutrition,
          ingredient_matches: matchResults,
        })
        .eq('id', recipe_id);

      // Non-blocking usage logging
      supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'match-ingredients',
        input_hash: null,
        cached_response: null,
        tokens_used: geminiData.usageMetadata?.totalTokenCount ?? 0,
      }).then(() => {}).catch(() => {});

      const response = {
        matches: matchResults,
        total_nutrition: totalNutrition,
        per_serving_nutrition: perServingNutrition,
        matched_count: matchedCount,
        total_count: matchResults.length,
      };

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'AI matching timed out. Please try again.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    console.error('match-ingredients error:', error?.message, error?.stack?.substring(0, 300));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
