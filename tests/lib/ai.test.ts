import { parseRecipeUrl } from '../../src/lib/ai';
import { supabase } from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('ai', () => {
  describe('parseRecipeUrl', () => {
    const validJsonLdHtml = `
      <html><head>
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Test Recipe",
        "recipeIngredient": ["1 cup flour", "2 tbsp sugar"],
        "recipeInstructions": [
          {"@type": "HowToStep", "text": "Mix ingredients"},
          {"@type": "HowToStep", "text": "Bake at 350F"}
        ],
        "recipeCategory": "Dessert",
        "prepTime": "PT15M",
        "cookTime": "PT30M",
        "recipeYield": "4"
      }
      </script>
      </head><body></body></html>
    `;

    it('calls fetch with the provided URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => validJsonLdHtml,
      });

      await parseRecipeUrl('https://example.com/recipe');

      expect(global.fetch).toHaveBeenCalledWith('https://example.com/recipe', {
        headers: { 'User-Agent': expect.stringContaining('Mozilla') },
      });
    });

    it('returns structured recipe data from JSON-LD', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => validJsonLdHtml,
      });

      const result = await parseRecipeUrl('https://example.com/recipe');
      expect(result.name).toBe('Test Recipe');
      expect(result.ingredients).toHaveLength(2);
      expect(result.instructions).toHaveLength(2);
    });

    it('throws on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(parseRecipeUrl('https://example.com/bad')).rejects.toThrow(
        'Failed to fetch the recipe page'
      );
    });

    it('falls back to edge function when no JSON-LD found', async () => {
      // First fetch: HTML with no JSON-LD
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><body>Hello world, no recipe here</body></html>',
      });

      // Second fetch: edge function response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => ({
          name: 'Edge Recipe',
          category: 'Italian',
          ingredients: [{ amount: 1, unit: 'cup', name: 'pasta' }],
          instructions: [{ step_number: 1, text: 'Cook pasta' }],
          tags: ['easy'],
        }),
      });

      // Mock auth session for the edge function call
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: { access_token: 'test-token' } },
      });

      const result = await parseRecipeUrl('https://example.com/recipe');
      expect(result.name).toBe('Edge Recipe');
      expect(result.ingredients).toHaveLength(1);
      expect(result.instructions).toHaveLength(1);
    });
  });
});
