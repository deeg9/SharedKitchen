// Supabase Edge Function: analyze-food-photo
// Accepts base64 images with an intent parameter (scan/identify),
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
    if (intent !== 'scan' && intent !== 'identify') {
      return new Response(
        JSON.stringify({ error: 'Invalid intent. Must be scan or identify.' }),
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
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: visionCount } = await supabaseAdmin
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'analyze-food-photo')
      .gte('created_at', monthStart.toISOString());

    const visionLimit = isPremium ? Infinity : 5;
    if ((visionCount ?? 0) >= visionLimit) {
      return new Response(
        JSON.stringify({
          error: 'Monthly vision limit reached',
          limit: 5,
          remaining: 0,
          used: visionCount ?? 0,
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
    const scanPrompt = `You are a food inventory scanner. Analyze this photo of a fridge, pantry, or kitchen shelf. Identify every visible food item. For each item provide: name (specific, include brand if visible), category (one of: Proteins, Produce, Dairy & Eggs, Pantry, Other), quantity (estimated count or amount like "1 bag", "3 pieces", "half gallon"), and brand (if visible on packaging, otherwise null).

Return JSON: { "items": [{ "name": string, "category": string, "quantity": string, "brand": string | null }] }

Be thorough -- include condiments, beverages, partial items. If unsure about an item, include it with your best guess. Do not include non-food items.`;

    const identifyPrompt = `You are a food identification expert. Look at this photo and identify the dish or food shown. Provide: the dish name (specific, e.g. "Pad Thai" not "noodles"), a confidence score from 0 to 1, and a brief description.

Return JSON: { "dish": { "name": string, "confidence": number, "description": string } }

If the image does not clearly show food, return: { "dish": { "name": "Unknown", "confidence": 0, "description": "Could not identify food in this image" } }`;

    const systemPrompt = intent === 'scan' ? scanPrompt : identifyPrompt;

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
