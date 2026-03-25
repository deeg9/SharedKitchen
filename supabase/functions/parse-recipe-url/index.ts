// Supabase Edge Function: parse-recipe-url
// Tries JSON-LD structured data extraction first, falls back to OpenAI gpt-5-mini.
// Includes per-user rate limiting, URL-based response caching, and structured outputs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Inlined JSON-LD extraction functions ---
// These are pure functions copied from src/lib/jsonld.ts for Deno compatibility.
// The src/lib version is the canonical reference and test target.

interface SchemaOrgNutrition {
  '@type'?: string;
  calories?: string;
  proteinContent?: string;
  fatContent?: string;
  carbohydrateContent?: string;
  fiberContent?: string;
  sodiumContent?: string;
  sugarContent?: string;
}

interface HowToStep {
  '@type': string;
  text: string;
  name?: string;
  url?: string;
  image?: string;
  duration?: string;
}

interface HowToSection {
  '@type': string;
  name?: string;
  itemListElement: HowToStep[];
}

interface SchemaOrgRecipe {
  '@type': 'Recipe' | string;
  name?: string;
  image?: string | string[] | Array<{ url: string }>;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number;
  recipeCategory?: string | string[];
  recipeIngredient?: string[];
  recipeInstructions?: string | string[] | HowToStep[] | HowToSection[];
  nutrition?: SchemaOrgNutrition;
  keywords?: string | string[];
  description?: string;
}

interface NutritionInfo {
  calories?: string;
  protein?: string;
  fat?: string;
  carbohydrates?: string;
  fiber?: string;
  sodium?: string;
  sugar?: string;
}

interface Ingredient {
  amount: number;
  unit: string;
  name: string;
  section?: string;
}

interface InstructionStep {
  step_number: number;
  text: string;
  timers?: Array<{ duration_seconds: number; label: string }>;
}

function extractJsonLd(html: string): SchemaOrgRecipe | null {
  if (!html) return null;
  const scriptRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const recipes = findRecipeObjects(data);
      if (recipes.length > 0) return recipes[0];
    } catch { /* invalid JSON */ }
  }
  return null;
}

function findRecipeObjects(data: any): SchemaOrgRecipe[] {
  if (!data || typeof data !== 'object') return [];
  const results: SchemaOrgRecipe[] = [];
  if (Array.isArray(data)) {
    for (const item of data) results.push(...findRecipeObjects(item));
    return results;
  }
  if (data['@type'] === 'Recipe') { results.push(data); return results; }
  if (Array.isArray(data['@graph'])) results.push(...findRecipeObjects(data['@graph']));
  return results;
}

function parseIsoDuration(iso: string): number {
  if (!iso || typeof iso !== 'string') return 0;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  return parseInt(match[1] || '0', 10) * 3600 + parseInt(match[2] || '0', 10) * 60 + parseInt(match[3] || '0', 10);
}

function extractImageUrl(image: string | string[] | Array<{ url: string }> | undefined | null): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (Array.isArray(image) && image.length > 0) {
    const first = image[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) return (first as { url: string }).url;
  }
  return null;
}

function parseSchemaIngredients(ingredients: string[]): Ingredient[] {
  if (!ingredients || !Array.isArray(ingredients)) return [];
  const unitPattern = /^([\d./\s]+)?\s*(cups?|tbsp|tsp|oz|lbs?|g|kg|ml|l|cloves?|pieces?|slices?|whole|pinch|dash|bunch|can|cans|package|packages|stalks?|heads?|medium|large|small)?\s*(.+)$/i;
  return ingredients.map((text) => {
    const trimmed = text.trim();
    const match = trimmed.match(unitPattern);
    if (!match) return { amount: 1, unit: '', name: trimmed };
    const rawAmount = match[1]?.trim();
    const unit = match[2]?.trim() || '';
    const name = match[3]?.trim() || trimmed;
    let amount = 1;
    if (rawAmount) {
      if (rawAmount.includes('/')) {
        const parts = rawAmount.split('/');
        amount = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else {
        const parsed = parseFloat(rawAmount);
        if (!isNaN(parsed)) amount = parsed;
      }
    }
    return { amount, unit, name };
  });
}

function parseSchemaInstructions(instructions: string | string[] | HowToStep[] | HowToSection[] | undefined): InstructionStep[] {
  if (!instructions) return [];
  if (typeof instructions === 'string') {
    return instructions.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean).map((text, i) => ({ step_number: i + 1, text }));
  }
  if (!Array.isArray(instructions) || instructions.length === 0) return [];
  if (typeof instructions[0] === 'string') {
    return (instructions as string[]).map((text, i) => ({ step_number: i + 1, text: text.trim() }));
  }
  const steps: InstructionStep[] = [];
  let stepNum = 1;
  for (const item of instructions as (HowToStep | HowToSection)[]) {
    if (item['@type'] === 'HowToSection') {
      const section = item as HowToSection;
      if (Array.isArray(section.itemListElement)) {
        for (const subStep of section.itemListElement) {
          const step: InstructionStep = { step_number: stepNum++, text: subStep.text || subStep.name || '' };
          if (subStep.duration) {
            const ds = parseIsoDuration(subStep.duration);
            if (ds > 0) step.timers = [{ duration_seconds: ds, label: subStep.name || subStep.text || 'Timer' }];
          }
          steps.push(step);
        }
      }
    } else {
      const howToStep = item as HowToStep;
      const step: InstructionStep = { step_number: stepNum++, text: howToStep.text || howToStep.name || '' };
      if (howToStep.duration) {
        const ds = parseIsoDuration(howToStep.duration);
        if (ds > 0) step.timers = [{ duration_seconds: ds, label: howToStep.name || howToStep.text || 'Timer' }];
      }
      steps.push(step);
    }
  }
  return steps;
}

function mapNutrition(nutrition: SchemaOrgNutrition | undefined | null): NutritionInfo | null {
  if (!nutrition) return null;
  return {
    calories: nutrition.calories || undefined,
    protein: nutrition.proteinContent || undefined,
    fat: nutrition.fatContent || undefined,
    carbohydrates: nutrition.carbohydrateContent || undefined,
    fiber: nutrition.fiberContent || undefined,
    sodium: nutrition.sodiumContent || undefined,
    sugar: nutrition.sugarContent || undefined,
  };
}

function mapSchemaOrgToRecipe(schema: SchemaOrgRecipe): Record<string, any> {
  const imageUrl = extractImageUrl(schema.image);
  const ingredients = parseSchemaIngredients(schema.recipeIngredient || []);
  const instructions = parseSchemaInstructions(schema.recipeInstructions);
  const nutritionInfo = mapNutrition(schema.nutrition);

  let servings = 4;
  if (schema.recipeYield) {
    if (typeof schema.recipeYield === 'number') { servings = schema.recipeYield; }
    else { const m = schema.recipeYield.match(/(\d+)/); if (m) servings = parseInt(m[1], 10); }
  }

  let category: string | null = null;
  if (schema.recipeCategory) {
    category = Array.isArray(schema.recipeCategory) ? schema.recipeCategory[0] || null : schema.recipeCategory;
  }

  const prepSec = parseIsoDuration(schema.prepTime || '');
  const cookSec = parseIsoDuration(schema.cookTime || '');

  let tags: string[] = [];
  if (schema.keywords) {
    if (typeof schema.keywords === 'string') tags = schema.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    else if (Array.isArray(schema.keywords)) tags = schema.keywords;
  }

  return {
    name: schema.name || 'Untitled Recipe',
    category,
    prep_time_minutes: prepSec > 0 ? Math.round(prepSec / 60) : null,
    cook_time_minutes: cookSec > 0 ? Math.round(cookSec / 60) : null,
    servings,
    estimated_cost: null,
    ingredients,
    instructions,
    tags,
    source_image_url: imageUrl,
    nutrition_info: nutritionInfo,
  };
}

// --- End inlined JSON-LD functions ---

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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
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

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the URL for cache lookup
    const urlHash = await hashUrl(url);

    // Check cache: return cached response if same URL was parsed in last 24 hours
    const { data: cached } = await supabaseAdmin
      .from('ai_usage_log')
      .select('cached_response')
      .eq('input_hash', urlHash)
      .eq('function_name', 'parse-recipe-url')
      .not('cached_response', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.cached_response) {
      // Log cache hit (tokens_used: 0)
      await supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'parse-recipe-url',
        input_hash: urlHash,
        cached_response: null,
        tokens_used: 0,
      });

      return new Response(
        JSON.stringify(cached.cached_response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit: count requests in last 24 hours
    const { count: usageCount } = await supabaseAdmin
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'parse-recipe-url')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Determine premium status (gracefully handles missing subscriptions table)
    let isPremium = false;
    try {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      isPremium = sub?.status === 'active' || sub?.status === 'trialing';
    } catch {
      // subscriptions table may not exist yet -- default to free tier limits
      isPremium = false;
    }
    const limit = isPremium ? 50 : 10;

    if ((usageCount ?? 0) >= limit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', limit, remaining: 0 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the recipe page HTML
    let html: string;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SharedKitchen Recipe Parser/1.0' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      html = await response.text();
    } catch (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch the URL. Please check the link and try again.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- JSON-LD extraction (try first, skip OpenAI if successful) ---
    const jsonLdRecipe = extractJsonLd(html);
    if (jsonLdRecipe && jsonLdRecipe.name && jsonLdRecipe.recipeIngredient && jsonLdRecipe.recipeIngredient.length > 0 && jsonLdRecipe.recipeInstructions) {
      const mappedRecipe = mapSchemaOrgToRecipe(jsonLdRecipe);

      // Log JSON-LD hit with tokens_used: 0 (no LLM cost)
      await supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'parse-recipe-url',
        input_hash: urlHash,
        cached_response: mappedRecipe,
        tokens_used: 0,
      });

      return new Response(
        JSON.stringify(mappedRecipe),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- OpenAI fallback (JSON-LD missing or incomplete) ---

    // Truncate HTML to stay within token limits
    const truncatedHtml = html.slice(0, 50000);

    // Call OpenAI to extract recipe data
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const modelName = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5-mini';

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'recipe',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                category: { type: ['string', 'null'] },
                prep_time_minutes: { type: ['number', 'null'] },
                cook_time_minutes: { type: ['number', 'null'] },
                servings: { type: 'number' },
                estimated_cost: { type: ['number', 'null'] },
                source_image_url: { type: ['string', 'null'] },
                nutrition_info: {
                  type: ['object', 'null'],
                  properties: {
                    calories: { type: ['string', 'null'] },
                    protein: { type: ['string', 'null'] },
                    fat: { type: ['string', 'null'] },
                    carbohydrates: { type: ['string', 'null'] },
                  },
                  required: ['calories', 'protein', 'fat', 'carbohydrates'],
                  additionalProperties: false,
                },
                ingredients: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      amount: { type: 'number' },
                      unit: { type: 'string' },
                      name: { type: 'string' },
                      section: { type: ['string', 'null'] },
                    },
                    required: ['amount', 'unit', 'name', 'section'],
                    additionalProperties: false,
                  },
                },
                instructions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      step_number: { type: 'number' },
                      text: { type: 'string' },
                      timers: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            duration_seconds: { type: 'number' },
                            label: { type: 'string' },
                          },
                          required: ['duration_seconds', 'label'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['step_number', 'text', 'timers'],
                    additionalProperties: false,
                  },
                },
                tags: { type: 'array', items: { type: 'string' } },
              },
              required: [
                'name', 'category', 'prep_time_minutes', 'cook_time_minutes',
                'servings', 'estimated_cost', 'source_image_url', 'nutrition_info',
                'ingredients', 'instructions', 'tags',
              ],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: 'system',
            content: `You are a recipe extraction assistant. Given HTML from a recipe webpage, extract the recipe into structured JSON matching the provided schema. If you cannot determine a field, use null for nullable fields or reasonable defaults for required ones.

Additional extraction rules:
- source_image_url: Extract the main recipe image URL from og:image meta tag or the first prominent recipe image on the page.
- nutrition_info: Extract nutrition information if visible on the page (calories, protein, fat, carbohydrates). Use null if not found.
- timers: For each instruction step, parse time references (e.g., "simmer for 20 minutes", "bake for 1 hour", "rest 5 minutes") into a timers array with duration_seconds and a descriptive label. If no time reference exists in a step, use an empty array.`,
          },
          {
            role: 'user',
            content: `Extract the recipe from this HTML:\n\n${truncatedHtml}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse recipe. The AI service is temporarily unavailable.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const completion = await openaiResponse.json();
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Failed to extract recipe data from the page.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipe = JSON.parse(content);

    // Log usage with cached response for future lookups
    await supabaseAdmin.from('ai_usage_log').insert({
      user_id: user.id,
      function_name: 'parse-recipe-url',
      input_hash: urlHash,
      cached_response: recipe,
      tokens_used: completion.usage?.total_tokens ?? null,
    });

    return new Response(
      JSON.stringify(recipe),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Parse recipe error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred while parsing the recipe.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
