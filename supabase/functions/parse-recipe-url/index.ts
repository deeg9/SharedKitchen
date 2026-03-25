// Supabase Edge Function: parse-recipe-url
// Uses OpenAI gpt-5-mini to extract structured recipe data from a URL.
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
                    },
                    required: ['step_number', 'text'],
                    additionalProperties: false,
                  },
                },
                tags: { type: 'array', items: { type: 'string' } },
              },
              required: [
                'name', 'category', 'prep_time_minutes', 'cook_time_minutes',
                'servings', 'estimated_cost', 'ingredients', 'instructions', 'tags',
              ],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: 'system',
            content: `You are a recipe extraction assistant. Given HTML from a recipe webpage, extract the recipe into structured JSON matching the provided schema. If you cannot determine a field, use null for nullable fields or reasonable defaults for required ones.`,
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
