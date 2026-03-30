jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from '../../src/lib/supabase';
import { searchRecipes } from '../../src/lib/recipeSearch';
import { RateLimitError } from '../../src/lib/ai';

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('recipeSearch', () => {
  describe('searchRecipes', () => {
    it('calls fetch with correct URL, auth headers, and body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => ({ results: [] }),
      });

      await searchRecipes('Pad Thai');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/search-recipes',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
            'apikey': 'test-anon-key',
          },
          body: JSON.stringify({ query: 'Pad Thai' }),
        })
      );
    });

    it('returns results array on success', async () => {
      const results = [{ title: 'Pasta Carbonara', url: 'https://example.com/pasta', source: 'example.com' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => ({ results }),
      });

      const response = await searchRecipes('Pasta');
      expect(response).toEqual(results);
    });

    it('throws RateLimitError on 429', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => ({ limit: 20 }),
      });

      await expect(searchRecipes('Pad Thai')).rejects.toThrow(RateLimitError);
    });

    it('throws generic Error on other failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'application/json']]) as any,
        json: async () => ({ error: 'Internal failure' }),
      });

      await expect(searchRecipes('Pad Thai')).rejects.toThrow('Internal failure');
    });

    it('throws Error on non-JSON content-type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]) as any,
      });

      await expect(searchRecipes('Pad Thai')).rejects.toThrow('Server error');
    });
  });
});
