// Supabase Edge Function: parse-recipe-url
// Tries JSON-LD structured data extraction first, falls back to Gemini Flash.
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

    const { url, html: clientHtml } = await req.json();

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

    // Use client-provided HTML if available, otherwise fetch server-side
    let html: string;
    if (clientHtml && typeof clientHtml === 'string' && clientHtml.length > 100) {
      html = clientHtml;
    } else {
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
    }

    // --- JSON-LD extraction (try first, skip OpenAI if successful) ---
    const jsonLdRecipe = extractJsonLd(html);
    if (jsonLdRecipe && jsonLdRecipe.name && jsonLdRecipe.recipeIngredient && jsonLdRecipe.recipeIngredient.length > 0 && jsonLdRecipe.recipeInstructions) {
      const mappedRecipe = mapSchemaOrgToRecipe(jsonLdRecipe);

      // Log JSON-LD hit (non-blocking)
      supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'parse-recipe-url',
        input_hash: urlHash,
        cached_response: mappedRecipe,
        tokens_used: 0,
      }).then(() => {}).catch(() => {});

      return new Response(
        JSON.stringify(mappedRecipe),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Gemini fallback (JSON-LD missing or incomplete) ---

    // Truncate HTML to stay within token limits
    const truncatedHtml = html.slice(0, 50000);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const modelName = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    const systemPrompt = `You are a recipe extraction assistant. Given HTML from a recipe webpage, extract the recipe into structured JSON. Return a JSON object with these fields:
- name (string)
- category (string or null)
- prep_time_minutes (number or null)
- cook_time_minutes (number or null)
- servings (number, default 4)
- estimated_cost (number or null)
- source_image_url (string or null — from og:image meta tag or prominent recipe image)
- nutrition_info (object with calories, protein, fat, carbohydrates as strings, or null)
- ingredients (array of {amount: number, unit: string, name: string, section: string|null})
- instructions (array of {step_number: number, text: string, timers: [{duration_seconds: number, label: string}]})
- tags (array of strings)

Parse time references in instructions into timers (e.g., "simmer for 20 minutes" → {duration_seconds: 1200, label: "simmer"}). Use null for unknown nullable fields.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + '\n\nExtract the recipe from this HTML:\n\n' + truncatedHtml }] },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8000,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timed out. Please try again.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Gemini ${geminiResponse.status}: ${errorText.substring(0, 150)}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResult = await geminiResponse.json();
    const content = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      const finishReason = geminiResult.candidates?.[0]?.finishReason;
      const blockReason = geminiResult.candidates?.[0]?.safetyRatings?.find((r: any) => r.blocked)?.category;
      return new Response(
        JSON.stringify({ error: `No content from AI. Finish: ${finishReason || 'unknown'}. Block: ${blockReason || 'none'}. Try a different URL.` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let recipe: any;
    try {
      // Strip markdown code fences if Gemini wraps the JSON
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      recipe = JSON.parse(jsonStr);
    } catch (parseErr) {
      return new Response(
        JSON.stringify({ error: `AI response not valid JSON. Preview: ${content.substring(0, 100)}` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log usage (non-blocking — don't crash if this fails)
    supabaseAdmin.from('ai_usage_log').insert({
      user_id: user.id,
      function_name: 'parse-recipe-url',
      input_hash: urlHash,
      cached_response: recipe,
      tokens_used: geminiResult.usageMetadata?.totalTokenCount ?? null,
    }).then(() => {}).catch(() => {});

    return new Response(
      JSON.stringify(recipe),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Parse recipe error:', error?.message, error?.stack?.substring(0, 300));
    return new Response(
      JSON.stringify({ error: error?.message ?? 'An unexpected error occurred while parsing the recipe.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
