// Supabase Edge Function: analyze-food-photo
// Accepts base64 images with an intent parameter (scan/identify/extract),
// authenticates user, checks rate limits (5/month free, unlimited premium),
// calls Gemini 2.5 Flash vision API, logs usage, returns structured JSON.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { image, intent } = await req.json();

    // Validate image
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid image data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate intent
    if (intent !== 'scan' && intent !== 'identify' && intent !== 'extract') {
      return new Response(
        JSON.stringify({ error: 'Invalid intent. Must be scan, identify, or extract.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (~750KB image limit)
    if (image.length > 1_000_000) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Please compress before uploading.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Monthly rate limit check
    let visionCount = 0;
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count } = await supabaseAdmin
        .from('ai_usage_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('function_name', 'analyze-food-photo')
        .gte('created_at', monthStart.toISOString());

      visionCount = count ?? 0;
    } catch {
      // ai_usage_log table may not exist yet — skip rate limiting
      console.warn('ai_usage_log query failed, skipping rate limit check');
    }

    const visionLimit = isPremium ? Infinity : 5;
    if (visionCount >= visionLimit) {
      return new Response(
        JSON.stringify({
          error: 'Monthly vision limit reached',
          limit: 5,
          remaining: 0,
          used: visionCount,
          type: 'vision_limit_exceeded',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gemini API key check
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Vision not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const modelName = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    // Intent-specific prompts
    const categoryGuide = `Category assignment rules — use EXACTLY one of: Proteins, Produce, Dairy & Eggs, Pantry, Other.

Proteins: Any meat, poultry, fish, seafood, tofu, tempeh, seitan, deli meats, bacon, sausage, hot dogs, jerky, protein bars, protein shakes, protein powder.
Produce: Fresh fruits, fresh vegetables, herbs, salad greens, mushrooms, avocados, berries, citrus, bananas, apples, potatoes, onions, garlic, ginger, fresh juices (not shelf-stable).
Dairy & Eggs: Milk, cream, butter, cheese, yogurt, eggs, sour cream, cottage cheese, cream cheese, ice cream, whipped cream, half-and-half, plant-based milk (oat, almond, soy).
Pantry: Canned goods, pasta, rice, grains, cereals, flour, sugar, oils, vinegar, sauces, condiments (ketchup, mustard, mayo, hot sauce), spices, seasonings, baking supplies, nuts, seeds, dried fruit, honey, syrup, peanut butter, jelly, bread, tortillas, crackers, chips, snacks, cookies, candy, chocolate, coffee, tea, shelf-stable beverages, energy drinks, soda, sports drinks, water bottles, juice boxes.
Other: Non-food items, supplements, vitamins, pet food, cleaning supplies, household items, anything that doesn't fit above.

Key rules:
- Beverages (energy drinks like Celsius/Monster/Red Bull, soda, sparkling water, juice boxes, bottled tea/coffee) → Pantry
- Frozen vegetables/fruits → Produce
- Frozen meat/fish → Proteins
- Frozen meals/pizza/ice cream → Dairy & Eggs (ice cream) or Pantry (meals)
- Eggs always → Dairy & Eggs
- Deli/lunch meat → Proteins`;

    const scanPrompt = `You are a food inventory scanner. Analyze this photo of a fridge, pantry, or kitchen shelf. Identify every visible food item. For each item provide: name (specific, include brand if visible), category, quantity (estimated count or amount like "1 bag", "3 pieces", "half gallon"), and brand (if visible on packaging, otherwise null).

${categoryGuide}

Return JSON: { "items": [{ "name": string, "category": string, "quantity": string, "brand": string | null }] }

Be thorough -- include condiments, beverages, partial items. If unsure about an item, include it with your best guess. Do not include non-food items.`;

    const identifyPrompt = `You are a food identification expert. Look at this photo and identify the dish or food shown. Provide: the dish name (specific, e.g. "Pad Thai" not "noodles"), a confidence score from 0 to 1, and a brief description.

Return JSON: { "dish": { "name": string, "confidence": number, "description": string } }

If the image does not clearly show food, return: { "dish": { "name": "Unknown", "confidence": 0, "description": "Could not identify food in this image" } }`;

    const extractPrompt = `You are a shopping list and recipe ingredient extractor. Analyze this photo which may contain:
- A handwritten shopping list
- A printed shopping list
- A recipe card (physical or digital)
- A screenshot of a recipe from a website or app
- Any image containing food ingredients or grocery items

Extract every food item or ingredient mentioned. For each item provide: name (specific ingredient name), category, and quantity (if mentioned, e.g. "2 cups", "1 lb", "3"; if not specified use "1").

${categoryGuide}

Return JSON: { "items": [{ "name": string, "category": string, "quantity": string }] }

Be thorough -- include seasonings, oils, garnishes, and any ingredient listed. If the photo shows a recipe, extract ONLY the ingredients, not the cooking instructions. If a quantity range is given (e.g. "2-3 cloves"), use the higher number.`;

    const promptMap: Record<string, string> = { scan: scanPrompt, identify: identifyPrompt, extract: extractPrompt };
    const systemPrompt = promptMap[intent];

    // Gemini vision call with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: image } },
              { text: systemPrompt },
            ],
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
        throw new Error(`Gemini API error (${geminiResp.status}): ${errText.slice(0, 200)}`);
      }

      const geminiData = await geminiResp.json();
      let resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      // Strip markdown fences if present (Gemini sometimes wraps JSON in ```json...```)
      resultText = resultText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

      const parsed = JSON.parse(resultText);

      // Add intent to response
      const result = { intent, ...parsed };

      // Non-blocking usage logging
      supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'analyze-food-photo',
        input_hash: null,
        cached_response: null,
        tokens_used: geminiData.usageMetadata?.totalTokenCount ?? 0,
      }).then(() => {}).catch(() => {});

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Vision analysis timed out. Please try again.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    console.error('Vision analysis error:', error?.message, error?.stack?.substring(0, 300));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
