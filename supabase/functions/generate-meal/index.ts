// Supabase Edge Function: generate-meal
// Context-aware meal generation using OpenAI gpt-5-mini.
// Gathers dietary preferences, cooking history, leftovers, and budget
// to suggest personalized dinner ideas.

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

    const { household_id, dietary_preferences } = await req.json();

    if (!household_id || typeof household_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid household_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit: count requests in last 24 hours
    const { count: usageCount } = await supabaseAdmin
      .from('meal_generation_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
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
      isPremium = false;
    }
    const limit = isPremium ? 20 : 5;

    if ((usageCount ?? 0) >= limit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', limit, remaining: 0 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gather context in parallel from 5 sources
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      recentMealsResult,
      recipesResult,
      leftoversResult,
      expensesResult,
      budgetResult,
    ] = await Promise.all([
      // a. Recent 30 days of meal plans with recipe names
      supabaseAdmin
        .from('meal_plans')
        .select('recipe_id, plan_date, recipes(name, category, tags)')
        .eq('household_id', household_id)
        .gte('plan_date', thirtyDaysAgo.split('T')[0])
        .order('plan_date', { ascending: false })
        .limit(30),

      // b. All household recipes
      supabaseAdmin
        .from('recipes')
        .select('id, name, category, tags, estimated_cost, servings')
        .eq('household_id', household_id),

      // c. Active leftovers with portions > 0
      supabaseAdmin
        .from('leftovers')
        .select('name, portions, use_by_date, status')
        .eq('household_id', household_id)
        .gt('portions', 0)
        .in('status', ['fresh', 'use_soon']),

      // d. Current month expenses sum
      supabaseAdmin
        .from('expenses')
        .select('amount')
        .eq('household_id', household_id)
        .gte('expense_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),

      // e. Budget settings (monthly_target)
      supabaseAdmin
        .from('budget_settings')
        .select('monthly_target')
        .eq('household_id', household_id)
        .maybeSingle(),
    ]);

    // Build context for prompt
    const recentMealNames = (recentMealsResult.data ?? [])
      .map((m: any) => m.recipes?.name)
      .filter(Boolean);

    const leftovers = (leftoversResult.data ?? [])
      .sort((a: any, b: any) => {
        // Prioritize items expiring soon
        if (!a.use_by_date) return 1;
        if (!b.use_by_date) return -1;
        return new Date(a.use_by_date).getTime() - new Date(b.use_by_date).getTime();
      });

    const totalSpent = (expensesResult.data ?? [])
      .reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0);
    const monthlyTarget = budgetResult.data?.monthly_target ?? null;
    const remainingBudget = monthlyTarget ? monthlyTarget - totalSpent : null;

    const dietaryPrefs = Array.isArray(dietary_preferences) ? dietary_preferences : [];

    // Build the prompt
    let prompt = 'Suggest 3 dinner ideas for tonight. Consider the following context:\n\n';

    if (dietaryPrefs.length > 0) {
      prompt += `Dietary preferences/restrictions: ${dietaryPrefs.join(', ')}. All suggestions MUST comply with these.\n\n`;
    }

    if (recentMealNames.length > 0) {
      prompt += `Recent meals to avoid repeating: ${recentMealNames.slice(0, 10).join(', ')}. Suggest something different.\n\n`;
    }

    if (leftovers.length > 0) {
      const leftoverDesc = leftovers.map((l: any) => {
        const expiry = l.use_by_date ? ` (use by ${l.use_by_date})` : '';
        return `${l.name} (${l.portions} portions${expiry})`;
      }).join(', ');
      prompt += `Available leftovers to incorporate: ${leftoverDesc}. Prioritize using items expiring soon.\n\n`;
    }

    if (remainingBudget !== null) {
      prompt += `Remaining monthly budget: $${remainingBudget.toFixed(0)}. Keep suggestions budget-friendly.\n\n`;
    }

    const recipeCount = recipesResult.data?.length ?? 0;
    if (recipeCount > 0) {
      prompt += `The household has ${recipeCount} recipes in their library. Feel free to suggest both existing favorites and new ideas.\n\n`;
    }

    prompt += 'For each suggestion, provide the recipe name, a brief appetizing description (1-2 sentences), estimated cost in USD, estimated prep time in minutes, whether it uses leftovers, and which leftover items it uses.';

    // Call Gemini API for meal suggestions
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const modelName = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    // 25-second timeout to avoid Edge Function timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const systemPrompt = 'You are a helpful home cooking assistant. Suggest practical, delicious dinner ideas based on the user\'s context. Return exactly 3 suggestions as a JSON object with a "suggestions" array. Each suggestion must have: name (string), description (string), estimated_cost (number or null), prep_time_minutes (number or null), uses_leftovers (boolean), leftover_items (array of strings).';

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
              { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] },
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 1500,
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
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate meal suggestions. The AI service is temporarily unavailable.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResult = await geminiResponse.json();
    const content = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate suggestions.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestions ?? [];

    // Log to meal_generation_log table
    const promptContext = {
      dietary_preferences: dietaryPrefs,
      recent_meals_count: recentMealNames.length,
      leftovers_count: leftovers.length,
      remaining_budget: remainingBudget,
      recipe_count: recipeCount,
    };

    await supabaseAdmin.from('meal_generation_log').insert({
      user_id: user.id,
      household_id: household_id,
      prompt_context: promptContext,
      suggestions: suggestions,
      tokens_used: geminiResult.usageMetadata?.totalTokenCount ?? null,
    });

    return new Response(
      JSON.stringify({ suggestions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate meal error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred while generating meal suggestions.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
