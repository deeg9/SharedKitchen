import { parseRecipeUrl } from '../../src/lib/ai';
import { supabase } from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const mockInvoke = supabase.functions.invoke as jest.Mock;

describe('ai', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseRecipeUrl', () => {
    it('calls supabase.functions.invoke with correct params', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          name: 'Test Recipe',
          category: 'Italian',
          prep_time_minutes: 15,
          cook_time_minutes: 30,
          servings: 4,
          estimated_cost: 12.5,
          ingredients: [{ amount: 1, unit: 'cup', name: 'flour' }],
          instructions: [{ step_number: 1, text: 'Mix ingredients' }],
          tags: ['easy', 'italian'],
        },
        error: null,
      });

      await parseRecipeUrl('https://example.com/recipe');

      expect(mockInvoke).toHaveBeenCalledWith('parse-recipe-url', {
        body: { url: 'https://example.com/recipe' },
      });
    });

    it('returns structured recipe data', async () => {
      const mockRecipe = {
        name: 'Test Recipe',
        category: 'Italian',
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        servings: 4,
        estimated_cost: 12.5,
        ingredients: [{ amount: 1, unit: 'cup', name: 'flour' }],
        instructions: [{ step_number: 1, text: 'Mix ingredients' }],
        tags: ['easy'],
      };

      mockInvoke.mockResolvedValueOnce({
        data: mockRecipe,
        error: null,
      });

      const result = await parseRecipeUrl('https://example.com/recipe');
      expect(result.name).toBe('Test Recipe');
      expect(result.ingredients).toHaveLength(1);
      expect(result.instructions).toHaveLength(1);
    });

    it('throws on function invoke error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Edge function failed' },
      });

      await expect(parseRecipeUrl('https://example.com/bad')).rejects.toThrow();
    });

    it('throws on invalid response shape', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { invalid: true },
        error: null,
      });

      await expect(parseRecipeUrl('https://example.com/bad')).rejects.toThrow();
    });
  });
});
