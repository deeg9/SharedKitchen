// Supabase Edge Function: search-recipes
// Accepts a dish name query, authenticates user, checks rate limits (20/month free,
// unlimited premium), calls Serper.dev Google Search API, logs usage, returns
// structured recipe search results.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domains that are video/social platforms, not recipe pages
const BLOCKED_DOMAINS = ['youtube.com', 'tiktok.com', 'instagram.com'];

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

    const { query } = await req.json();

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid query' }),
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

    // Monthly rate limit check
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: searchCount } = await supabaseAdmin
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'search-recipes')
      .gte('created_at', monthStart.toISOString());

    const searchLimit = isPremium ? Infinity : 20;
    if ((searchCount ?? 0) >= searchLimit) {
      return new Response(
        JSON.stringify({
          error: 'Monthly recipe search limit reached',
          limit: 20,
          remaining: 0,
          used: searchCount ?? 0,
          type: 'search_limit_exceeded',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Serper API key check
    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    if (!serperApiKey) {
      return new Response(
        JSON.stringify({ error: 'Recipe search not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Serper.dev Google Search API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const serperResp = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: `${query.trim()} recipe`, num: 5 }),
        signal: controller.signal,
      });

      if (!serperResp.ok) {
        const errText = await serperResp.text();
        console.error('Serper API error:', serperResp.status, errText.slice(0, 200));
        return new Response(
          JSON.stringify({ error: 'Recipe search failed. Please try again.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const serperData = await serperResp.json();
      const organic = serperData.organic ?? [];

      // Map and filter results
      const results = organic
        .map((result: any) => {
          try {
            const hostname = new URL(result.link).hostname.replace('www.', '');
            // Skip video/social platforms
            if (BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
              return null;
            }
            return {
              title: result.title ?? '',
              url: result.link ?? '',
              source: hostname,
              thumbnail: result.thumbnail ?? null,
              cookTime: null,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .slice(0, 3);

      // Non-blocking usage logging
      supabaseAdmin.from('ai_usage_log').insert({
        user_id: user.id,
        function_name: 'search-recipes',
        input_hash: null,
        cached_response: null,
        tokens_used: 0,
      }).then(() => {}).catch(() => {});

      return new Response(
        JSON.stringify({ results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Recipe search timed out. Please try again.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    console.error('Recipe search error:', error?.message, error?.stack?.substring(0, 300));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
