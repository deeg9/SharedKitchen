// Supabase Edge Function: food-search
// Accepts a query string, authenticates user, checks rate limits (20/day free,
// unlimited premium), checks food_search_cache, queries USDA FoodData Central
// and FatSecret APIs in parallel, normalizes results, deduplicates, upserts into
// food_items, caches search results, logs usage, returns FoodSearchResult[].

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USDA nutrient number -> NutritionData field mapping
// Map by nutrientNumber (integer), NOT nutrientName (string) to avoid kcal/kJ confusion
const USDA_NUTRIENT_MAP: Record<number, string> = {
  208: 'calories',           // Energy (kcal)
  203: 'protein_g',          // Protein
  204: 'total_fat_g',        // Total lipid (fat)
  205: 'total_carbs_g',      // Carbohydrate
  291: 'dietary_fiber_g',    // Fiber, total dietary
  269: 'total_sugars_g',     // Sugars, total
  606: 'saturated_fat_g',    // Fatty acids, total saturated
  605: 'trans_fat_g',        // Fatty acids, total trans
  601: 'cholesterol_mg',     // Cholesterol
  307: 'sodium_mg',          // Sodium
  324: 'vitamin_d_mcg',      // Vitamin D (D2 + D3)
  301: 'calcium_mg',         // Calcium
  303: 'iron_mg',            // Iron
  306: 'potassium_mg',       // Potassium
};

// FatSecret OAuth2 in-memory token cache
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getFatSecretToken(): Promise<string> {
  // Return cached token if still valid (with 2-minute buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 120000) {
    return tokenCache.token;
  }

  const clientId = Deno.env.get('FATSECRET_CLIENT_ID');
  const clientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials not configured');
  }

  const resp = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`,
    },
    body: 'grant_type=client_credentials&scope=premier',
  });

  if (!resp.ok) {
    throw new Error(`FatSecret OAuth failed: ${resp.status}`);
  }

  const data = await resp.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 120) * 1000, // 2min buffer
  };
  return tokenCache.token;
}

// Normalize a USDA food item to our canonical format
function normalizeUSDAFood(food: any): Record<string, any> {
  const nutrition: Record<string, number> = {
    calories: 0,
    protein_g: 0,
    total_fat_g: 0,
    total_carbs_g: 0,
    sodium_mg: 0,
  };

  for (const n of (food.foodNutrients ?? [])) {
    const field = USDA_NUTRIENT_MAP[n.nutrientNumber];
    if (field) {
      nutrition[field] = n.value ?? 0;
    }
  }

  // Data quality: Foundation=90, SR Legacy=80, Branded=40
  const dataQuality = food.dataType === 'Foundation' ? 90
    : food.dataType === 'SR Legacy' ? 80 : 40;

  return {
    fdc_id: food.fdcId,
    name: food.description,
    name_normalized: food.description.toLowerCase().trim(),
    brand: food.brandOwner ?? null,
    barcode: food.gtinUpc ?? null,
    nutrition,
    source: 'usda',
    data_quality: dataQuality,
    serving_sizes: [],
    image_url: null,
  };
}

// Normalize a FatSecret food item to our canonical format
function normalizeFatSecretFood(food: any): Record<string, any> | null {
  // Handle FatSecret array/object quirk for servings
  const servingsRaw = food.servings?.serving;
  const servings = Array.isArray(servingsRaw) ? servingsRaw : servingsRaw ? [servingsRaw] : [];

  // Find per-100g serving or compute from first serving
  const per100g = servings.find((s: any) =>
    s.serving_description === '100 g' || s.metric_serving_amount === '100.000'
  );
  const baseServing = per100g || servings[0];

  if (!baseServing) return null;

  const metricGrams = parseFloat(baseServing.metric_serving_amount || '100');
  const factor = per100g ? 1 : 100 / metricGrams;

  // All FatSecret numeric values are STRINGS -- must parseFloat() every field
  const nutrition: Record<string, any> = {
    calories: parseFloat(baseServing.calories || '0') * factor,
    protein_g: parseFloat(baseServing.protein || '0') * factor,
    total_fat_g: parseFloat(baseServing.fat || '0') * factor,
    total_carbs_g: parseFloat(baseServing.carbohydrate || '0') * factor,
    sodium_mg: parseFloat(baseServing.sodium || '0') * factor,
  };

  // Optional fields
  if (baseServing.saturated_fat) nutrition.saturated_fat_g = parseFloat(baseServing.saturated_fat) * factor;
  if (baseServing.fiber) nutrition.dietary_fiber_g = parseFloat(baseServing.fiber) * factor;
  if (baseServing.sugar) nutrition.total_sugars_g = parseFloat(baseServing.sugar) * factor;
  if (baseServing.cholesterol) nutrition.cholesterol_mg = parseFloat(baseServing.cholesterol) * factor;
  if (baseServing.potassium) nutrition.potassium_mg = parseFloat(baseServing.potassium) * factor;

  // Data quality: Generic=70, Brand=60
  const dataQuality = food.food_type === 'Generic' ? 70 : 60;

  return {
    fatsecret_id: parseInt(food.food_id),
    name: food.food_name,
    name_normalized: food.food_name.toLowerCase().trim(),
    brand: food.brand_name ?? null,
    nutrition,
    source: 'fatsecret',
    data_quality: dataQuality,
    serving_sizes: servings.map((s: any) => ({
      description: s.serving_description,
      amount_g: parseFloat(s.metric_serving_amount || '0'),
      nutrition: {
        calories: parseFloat(s.calories || '0'),
        protein_g: parseFloat(s.protein || '0'),
        total_fat_g: parseFloat(s.fat || '0'),
        total_carbs_g: parseFloat(s.carbohydrate || '0'),
        sodium_mg: parseFloat(s.sodium || '0'),
      },
    })),
    image_url: null,
  };
}

// Deduplicate results: USDA takes priority, FatSecret fills gaps
function deduplicateResults(
  usdaResults: Record<string, any>[],
  fsResults: Record<string, any>[]
): Record<string, any>[] {
  const merged: Record<string, any>[] = [...usdaResults];
  const usdaNames = new Set(usdaResults.map(r => r.name_normalized));

  for (const fs of fsResults) {
    // Skip if USDA already has a food with matching name (exact or substring)
    const isDuplicate = [...usdaNames].some(name =>
      name === fs.name_normalized ||
      name?.includes(fs.name_normalized!) ||
      fs.name_normalized?.includes(name)
    );
    if (!isDuplicate) {
      merged.push(fs);
    }
  }

  // Sort by data_quality descending (Foundation > SR Legacy > FatSecret Generic > FatSecret Brand > USDA Branded)
  return merged.sort((a, b) => (b.data_quality ?? 0) - (a.data_quality ?? 0));
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

    const body = await req.json();
    const rawQuery = body?.query;

    // Validate query: string, trimmed length >= 2, max 100 chars
    if (!rawQuery || typeof rawQuery !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuery = rawQuery.trim();
    if (trimmedQuery.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (trimmedQuery.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Query must be 100 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      // subscriptions table may not exist yet -- default to free tier limits
      isPremium = false;
    }

    // Daily rate limit check (20/day free, unlimited premium)
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    let searchCount = 0;
    try {
      const { count } = await supabaseAdmin
        .from('ai_usage_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('function_name', 'food-search')
        .gte('created_at', dayStart.toISOString());

      searchCount = count ?? 0;
    } catch {
      // ai_usage_log table may not exist yet -- skip rate limiting
      console.warn('ai_usage_log query failed, skipping rate limit check');
    }

    const searchLimit = isPremium ? Infinity : 20;
    if (searchCount >= searchLimit) {
      return new Response(
        JSON.stringify({
          error: 'Daily food search limit reached',
          limit: 20,
          used: searchCount,
          type: 'search_limit_exceeded',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize query for cache key
    const normalizedQuery = trimmedQuery.toLowerCase().trim().replace(/\s+/g, ' ');

    // Generate SHA-256 cache key from normalized query
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(normalizedQuery)
    );
    const queryHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Check food_search_cache (cache-first strategy)
    try {
      const { data: cached } = await supabaseAdmin
        .from('food_search_cache')
        .select('results')
        .eq('query_hash', queryHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cached?.results) {
        // Non-blocking usage logging for cache hits too
        supabaseAdmin.from('ai_usage_log').insert({
          user_id: user.id,
          function_name: 'food-search',
          input_hash: null,
          cached_response: null,
          tokens_used: 0,
        }).then(() => {}).catch(() => {});

        return new Response(
          JSON.stringify({ results: cached.results }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      // Cache lookup failed -- proceed to external APIs
      console.warn('food_search_cache lookup failed, proceeding to API calls');
    }

    // Check USDA API key presence
    const usdaApiKey = Deno.env.get('USDA_API_KEY');
    if (!usdaApiKey) {
      return new Response(
        JSON.stringify({ error: 'Food search not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parallel external API search with 15-second timeout each
    const usdaController = new AbortController();
    const usdaTimeout = setTimeout(() => usdaController.abort(), 15000);

    const fsController = new AbortController();
    const fsTimeout = setTimeout(() => fsController.abort(), 15000);

    try {
      // Build USDA URL
      const usdaUrl = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
      usdaUrl.searchParams.set('api_key', usdaApiKey);
      usdaUrl.searchParams.set('query', normalizedQuery);
      usdaUrl.searchParams.set('dataType', 'Foundation,SR Legacy,Branded');
      usdaUrl.searchParams.set('pageSize', '25');
      usdaUrl.searchParams.set('sortBy', 'dataType.keyword');
      usdaUrl.searchParams.set('sortOrder', 'asc');

      // Build FatSecret fetch (may fail if credentials not configured)
      const fsFetchPromise = (async () => {
        const token = await getFatSecretToken();
        const fsUrl = new URL('https://platform.fatsecret.com/rest/foods/search/v3');
        fsUrl.searchParams.set('search_expression', normalizedQuery);
        fsUrl.searchParams.set('max_results', '15');
        fsUrl.searchParams.set('format', 'json');
        fsUrl.searchParams.set('flag_default_serving', 'true');

        return fetch(fsUrl.toString(), {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: fsController.signal,
        });
      })();

      const [usdaResult, fsResult] = await Promise.allSettled([
        fetch(usdaUrl.toString(), { signal: usdaController.signal }),
        fsFetchPromise,
      ]);

      // Process USDA results
      let usdaFoods: Record<string, any>[] = [];
      if (usdaResult.status === 'fulfilled' && usdaResult.value.ok) {
        const usdaData = await usdaResult.value.json();
        usdaFoods = (usdaData.foods ?? []).map(normalizeUSDAFood);
      } else if (usdaResult.status === 'rejected') {
        console.warn('USDA API failed:', usdaResult.reason?.message);
      }

      // Process FatSecret results
      let fsFoods: Record<string, any>[] = [];
      if (fsResult.status === 'fulfilled' && fsResult.value.ok) {
        const fsData = await fsResult.value.json();
        // Handle FatSecret array/object quirk for results
        const rawFoods = fsData.foods_search?.results?.food;
        const foodArray = Array.isArray(rawFoods) ? rawFoods : rawFoods ? [rawFoods] : [];
        fsFoods = foodArray
          .map(normalizeFatSecretFood)
          .filter((f: any): f is Record<string, any> => f !== null);
      } else if (fsResult.status === 'rejected') {
        console.warn('FatSecret API failed:', fsResult.reason?.message);
      }

      // If both APIs failed, return empty results
      if (usdaFoods.length === 0 && fsFoods.length === 0) {
        return new Response(
          JSON.stringify({ results: [], error: 'No results found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Normalize and deduplicate
      const allResults = deduplicateResults(usdaFoods, fsFoods);

      // Upsert into food_items table (individual upserts to handle mixed conflict columns)
      await Promise.all(
        allResults.map(async (item) => {
          try {
            const conflictColumn = item.source === 'usda' ? 'fdc_id' : 'fatsecret_id';
            await supabaseAdmin
              .from('food_items')
              .upsert({
                fdc_id: item.fdc_id ?? null,
                fatsecret_id: item.fatsecret_id ?? null,
                name: item.name,
                name_normalized: item.name_normalized,
                brand: item.brand,
                barcode: item.barcode ?? null,
                nutrition: item.nutrition,
                serving_sizes: item.serving_sizes ?? [],
                source: item.source,
                image_url: item.image_url,
                data_quality: item.data_quality,
              }, { onConflict: conflictColumn });
          } catch (err: any) {
            console.warn(`food_items upsert failed for ${item.name}:`, err?.message);
          }
        })
      );

      // Re-fetch inserted items to get their generated UUIDs
      const searchResults = [];
      for (const item of allResults) {
        let match;
        if (item.source === 'usda' && item.fdc_id) {
          const { data } = await supabaseAdmin
            .from('food_items')
            .select('id')
            .eq('fdc_id', item.fdc_id)
            .maybeSingle();
          match = data;
        } else if (item.source === 'fatsecret' && item.fatsecret_id) {
          const { data } = await supabaseAdmin
            .from('food_items')
            .select('id')
            .eq('fatsecret_id', item.fatsecret_id)
            .maybeSingle();
          match = data;
        }

        searchResults.push({
          id: match?.id ?? crypto.randomUUID(),
          name: item.name,
          brand: item.brand,
          source: item.source,
          calories: item.nutrition.calories ?? 0,
          protein_g: item.nutrition.protein_g ?? 0,
          total_fat_g: item.nutrition.total_fat_g ?? 0,
          total_carbs_g: item.nutrition.total_carbs_g ?? 0,
          image_url: item.image_url,
        });
      }

      // Write to food_search_cache
      try {
        await supabaseAdmin
          .from('food_search_cache')
          .upsert({
            query_hash: queryHash,
            query_text: normalizedQuery,
            results: searchResults,
            result_count: searchResults.length,
          });
      } catch (err: any) {
        console.warn('food_search_cache write failed:', err?.message);
      }

      // Non-blocking usage logging
      supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'food-search',
        input_hash: null,
        cached_response: null,
        tokens_used: 0,
      }).then(() => {}).catch(() => {});

      return new Response(
        JSON.stringify({ results: searchResults }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Food search timed out. Please try again.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw err;
    } finally {
      clearTimeout(usdaTimeout);
      clearTimeout(fsTimeout);
    }
  } catch (error: any) {
    console.error('Food search error:', error?.message, error?.stack?.substring(0, 300));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
