// Supabase Edge Function: food-barcode
// Accepts a barcode string, authenticates user, checks rate limits (shared with food-search),
// checks food_items cache by barcode, queries Open Food Facts first then FatSecret fallback,
// normalizes results, upserts into food_items, returns { found, food? }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Normalize a UPC-A (12 digits) to EAN-13 by prepending "0"
function normalizeBarcode(barcode: string): string {
  const cleaned = barcode.replace(/\D/g, '');
  if (cleaned.length === 12) {
    return '0' + cleaned;
  }
  return cleaned;
}

// Validate barcode: must be 8-14 digits (T-37-02 mitigation)
function isValidBarcode(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode.replace(/\D/g, ''));
}

// Normalize Open Food Facts product to our canonical format
function normalizeOFFProduct(product: any, barcode: string): Record<string, any> {
  const nutriments = product.nutriments ?? {};

  const nutrition: Record<string, any> = {
    calories: nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0,
    protein_g: nutriments['proteins_100g'] ?? 0,
    total_fat_g: nutriments['fat_100g'] ?? 0,
    total_carbs_g: nutriments['carbohydrates_100g'] ?? 0,
    // OFF stores sodium in grams; convert to mg
    sodium_mg: (nutriments['sodium_100g'] ?? 0) * 1000,
  };

  // Optional fields
  if (nutriments['saturated-fat_100g'] != null) nutrition.saturated_fat_g = nutriments['saturated-fat_100g'];
  if (nutriments['fiber_100g'] != null) nutrition.dietary_fiber_g = nutriments['fiber_100g'];
  if (nutriments['sugars_100g'] != null) nutrition.total_sugars_g = nutriments['sugars_100g'];

  // Extract category from categories_tags, removing "en:" prefix
  let category: string | null = null;
  if (Array.isArray(product.categories_tags) && product.categories_tags.length > 0) {
    category = product.categories_tags[0].replace(/^en:/, '');
  }

  return {
    off_barcode: barcode,
    name: product.product_name || product.generic_name || 'Unknown Product',
    name_normalized: (product.product_name || product.generic_name || 'unknown product').toLowerCase().trim(),
    brand: product.brands ?? null,
    barcode: barcode,
    category,
    nutrition,
    source: 'off',
    data_quality: 75,
    serving_sizes: [],
    image_url: product.image_url ?? null,
  };
}

// Normalize FatSecret food item to our canonical format (reused from food-search)
function normalizeFatSecretFood(food: any, barcode: string): Record<string, any> | null {
  const servingsRaw = food.servings?.serving;
  const servings = Array.isArray(servingsRaw) ? servingsRaw : servingsRaw ? [servingsRaw] : [];

  const per100g = servings.find((s: any) =>
    s.serving_description === '100 g' || s.metric_serving_amount === '100.000'
  );
  const baseServing = per100g || servings[0];

  if (!baseServing) return null;

  const metricGrams = parseFloat(baseServing.metric_serving_amount || '100');
  const factor = per100g ? 1 : 100 / metricGrams;

  const nutrition: Record<string, any> = {
    calories: parseFloat(baseServing.calories || '0') * factor,
    protein_g: parseFloat(baseServing.protein || '0') * factor,
    total_fat_g: parseFloat(baseServing.fat || '0') * factor,
    total_carbs_g: parseFloat(baseServing.carbohydrate || '0') * factor,
    sodium_mg: parseFloat(baseServing.sodium || '0') * factor,
  };

  if (baseServing.saturated_fat) nutrition.saturated_fat_g = parseFloat(baseServing.saturated_fat) * factor;
  if (baseServing.fiber) nutrition.dietary_fiber_g = parseFloat(baseServing.fiber) * factor;
  if (baseServing.sugar) nutrition.total_sugars_g = parseFloat(baseServing.sugar) * factor;
  if (baseServing.cholesterol) nutrition.cholesterol_mg = parseFloat(baseServing.cholesterol) * factor;
  if (baseServing.potassium) nutrition.potassium_mg = parseFloat(baseServing.potassium) * factor;

  const dataQuality = food.food_type === 'Generic' ? 70 : 60;

  return {
    fatsecret_id: parseInt(food.food_id),
    name: food.food_name,
    name_normalized: food.food_name.toLowerCase().trim(),
    brand: food.brand_name ?? null,
    barcode: barcode,
    category: null,
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // T-37-01: Authenticate user
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
    const rawBarcode = body?.barcode;

    // T-37-02: Validate barcode is string of 8-14 digits only
    if (!rawBarcode || typeof rawBarcode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid barcode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidBarcode(rawBarcode)) {
      return new Response(
        JSON.stringify({ error: 'Barcode must be 8-14 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize UPC-A to EAN-13
    const normalizedBarcode = normalizeBarcode(rawBarcode);

    // T-37-03: Check premium status for rate limiting
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

    // T-37-03: Daily rate limit check (shared with food-search: 20/day free, unlimited premium)
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

    // Cache-first: check food_items table by barcode
    try {
      const { data: cached } = await supabaseAdmin
        .from('food_items')
        .select('*')
        .eq('barcode', normalizedBarcode)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cached) {
        // Non-blocking usage logging
        supabaseAdmin.from('ai_usage_log').insert({
          user_id: user.id,
          function_name: 'food-search',
          input_hash: null,
          cached_response: null,
          tokens_used: 0,
        }).then(() => {}).catch(() => {});

        return new Response(
          JSON.stringify({ found: true, food: cached }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      console.warn('food_items cache lookup failed, proceeding to API calls');
    }

    // 1. Try Open Food Facts first (free, no auth)
    let offResult: Record<string, any> | null = null;

    const offController = new AbortController();
    const offTimeout = setTimeout(() => offController.abort(), 10000);

    try {
      const offResp = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${normalizedBarcode}.json`,
        {
          headers: {
            'User-Agent': 'SharedKitchen/1.0 (contact@sharedkitchen.app)',
          },
          signal: offController.signal,
        }
      );

      if (offResp.ok) {
        const offData = await offResp.json();
        if (offData.status === 1 && offData.product) {
          offResult = normalizeOFFProduct(offData.product, normalizedBarcode);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Open Food Facts request timed out');
      } else {
        console.warn('Open Food Facts lookup failed:', err?.message);
      }
    } finally {
      clearTimeout(offTimeout);
    }

    // 2. FatSecret fallback (if OFF returned no result)
    let fsResult: Record<string, any> | null = null;

    if (!offResult) {
      const fsController = new AbortController();
      const fsTimeout = setTimeout(() => fsController.abort(), 10000);

      try {
        const token = await getFatSecretToken();

        // Step 1: Find food_id by barcode
        const barcodeResp = await fetch(
          `https://platform.fatsecret.com/rest/food/barcode/find-id/v1?barcode=${normalizedBarcode}&format=json`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: fsController.signal,
          }
        );

        if (barcodeResp.ok) {
          const barcodeData = await barcodeResp.json();
          const foodId = barcodeData?.food_id?.value;

          if (foodId) {
            // Step 2: Get full food details
            const detailResp = await fetch(
              `https://platform.fatsecret.com/rest/food/v4?food_id=${foodId}&format=json&include_food_images=true`,
              {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: fsController.signal,
              }
            );

            if (detailResp.ok) {
              const detailData = await detailResp.json();
              if (detailData.food) {
                fsResult = normalizeFatSecretFood(detailData.food, normalizedBarcode);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('FatSecret barcode lookup timed out');
        } else {
          console.warn('FatSecret barcode lookup failed:', err?.message);
        }
      } finally {
        clearTimeout(fsTimeout);
      }
    }

    // If both failed, return not found (200, not an error)
    const result = offResult ?? fsResult;
    if (!result) {
      // Still log usage
      supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'food-search',
        input_hash: null,
        cached_response: null,
        tokens_used: 0,
      }).then(() => {}).catch(() => {});

      return new Response(
        JSON.stringify({ found: false, barcode: normalizedBarcode }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert into food_items table
    let foodItem = result;
    try {
      const { data: upserted } = await supabaseAdmin
        .from('food_items')
        .upsert({
          fdc_id: result.fdc_id ?? null,
          off_barcode: result.off_barcode ?? null,
          fatsecret_id: result.fatsecret_id ?? null,
          name: result.name,
          name_normalized: result.name_normalized,
          brand: result.brand,
          barcode: result.barcode,
          category: result.category ?? null,
          nutrition: result.nutrition,
          serving_sizes: result.serving_sizes ?? [],
          source: result.source,
          image_url: result.image_url,
          data_quality: result.data_quality,
        }, { onConflict: 'barcode' })
        .select('*')
        .maybeSingle();

      if (upserted) {
        foodItem = upserted;
      }
    } catch (err: any) {
      console.warn('food_items upsert failed:', err?.message);
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
      JSON.stringify({ found: true, food: foodItem }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Barcode lookup error:', error?.message, error?.stack?.substring(0, 300));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
