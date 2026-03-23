// Supabase Edge Function: parse-recipe-url
// Uses OpenAI gpt-4o-mini to extract structured recipe data from a URL.

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
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the recipe page HTML
    let html: string;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mise Recipe Parser/1.0' },
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
    const truncatedHtml = html.slice(0, 15000);

    // Call OpenAI to extract recipe data
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a recipe extraction assistant. Given HTML from a recipe webpage, extract the recipe into structured JSON with these fields:
- name (string, required): Recipe title
- category (string|null): e.g. "Italian", "Mexican", "Dessert"
- prep_time_minutes (number|null): Prep time in minutes
- cook_time_minutes (number|null): Cook time in minutes
- servings (number): Number of servings (default 4)
- estimated_cost (number|null): Estimated cost in USD
- ingredients (array): Each with { amount: number, unit: string, name: string, section?: string }
- instructions (array): Each with { step_number: number, text: string }
- tags (string[]): Relevant tags like "easy", "quick", "vegetarian"

Return valid JSON only. If you cannot extract a field, use null.`,
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
