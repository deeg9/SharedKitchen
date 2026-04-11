import { supabase } from '../../src/lib/supabase';
import { useCookLogStore } from '../../src/stores/cookLogStore';

// Reset store state between tests
beforeEach(() => {
  useCookLogStore.setState({
    cookLogs: [],
    cookCount: 0,
    loading: false,
    error: null,
    unloggedMeals: [],
  });
  jest.clearAllMocks();
});

describe('cookLogStore', () => {
  describe('fetchCookCount', () => {
    it('returns numeric count for a recipe', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useCookLogStore.getState().fetchCookCount('recipe-1');

      expect(supabase.from).toHaveBeenCalledWith('cook_logs');
      expect(mockChain.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
      expect(mockChain.eq).toHaveBeenCalledWith('recipe_id', 'recipe-1');
      expect(useCookLogStore.getState().cookCount).toBe(5);
    });

    it('sets cookCount to 0 on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: null, error: { message: 'fail' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useCookLogStore.getState().fetchCookCount('recipe-1');

      expect(useCookLogStore.getState().cookCount).toBe(0);
      expect(useCookLogStore.getState().error).toBeTruthy();
    });
  });

  describe('fetchCookLogs', () => {
    it('returns array of CookLogWithProfile objects ordered by cooked_at desc, limited to 20', async () => {
      const mockLogs = [
        {
          id: 'cl-1',
          recipe_id: 'r1',
          user_id: 'u1',
          household_id: 'h1',
          photo_url: null,
          notes: 'Great!',
          cooked_at: '2026-04-10T18:00:00Z',
          created_at: '2026-04-10T18:00:00Z',
          profiles: { handle: 'chef', avatar_url: null },
        },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockLogs, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useCookLogStore.getState().fetchCookLogs('r1');

      expect(supabase.from).toHaveBeenCalledWith('cook_logs');
      expect(mockChain.select).toHaveBeenCalledWith('*, profiles(handle, avatar_url)');
      expect(mockChain.eq).toHaveBeenCalledWith('recipe_id', 'r1');
      expect(mockChain.order).toHaveBeenCalledWith('cooked_at', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(20);
      expect(useCookLogStore.getState().cookLogs).toEqual(mockLogs);
      expect(useCookLogStore.getState().loading).toBe(false);
    });
  });

  describe('createCookLog', () => {
    it('calls supabase insert with correct fields and returns the new log', async () => {
      const newLog = {
        id: 'cl-new',
        recipe_id: 'r1',
        user_id: 'u1',
        household_id: 'h1',
        photo_url: null,
        notes: 'Yummy',
        cooked_at: '2026-04-10T18:00:00Z',
        created_at: '2026-04-10T18:00:00Z',
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newLog, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      // Set initial count
      useCookLogStore.setState({ cookCount: 3 });

      const result = await useCookLogStore.getState().createCookLog({
        recipeId: 'r1',
        userId: 'u1',
        householdId: 'h1',
        notes: 'Yummy',
      });

      expect(supabase.from).toHaveBeenCalledWith('cook_logs');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_id: 'r1',
          user_id: 'u1',
          household_id: 'h1',
          notes: 'Yummy',
        })
      );
      expect(result).toEqual(newLog);
      // Optimistic increment
      expect(useCookLogStore.getState().cookCount).toBe(4);
    });

    it('increments cookCount optimistically and rolls back on error', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      useCookLogStore.setState({ cookCount: 5 });

      await useCookLogStore.getState().createCookLog({
        recipeId: 'r1',
        userId: 'u1',
        householdId: 'h1',
      });

      // Should rollback to original count
      expect(useCookLogStore.getState().cookCount).toBe(5);
      expect(useCookLogStore.getState().error).toBeTruthy();
    });

    it.todo('createCookLog with photo calls uploadCookLogPhoto before insert');
  });

  describe('fetchUnloggedMeals', () => {
    it('returns yesterday dinner plans that have no matching cook_log', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const mockMealPlans = [
        {
          id: 'mp-1',
          recipe_id: 'r1',
          plan_date: yesterdayStr,
          meal_type: 'dinner',
          recipes: { name: 'Tacos', image_url: 'https://img.com/tacos.jpg' },
        },
        {
          id: 'mp-2',
          recipe_id: 'r2',
          plan_date: yesterdayStr,
          meal_type: 'dinner',
          recipes: { name: 'Pasta', image_url: null },
        },
      ];

      // First call: fetch meal_plans
      const mockMealChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockMealPlans, error: null }),
      };

      // Second call: check cook_logs for existing entries
      const mockLogChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ data: [{ recipe_id: 'r1' }], error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'meal_plans') return mockMealChain;
        if (table === 'cook_logs') return mockLogChain;
        return mockMealChain;
      });

      await useCookLogStore.getState().fetchUnloggedMeals('h1', 'u1');

      // Should only include r2 (r1 already has a cook log)
      const { unloggedMeals } = useCookLogStore.getState();
      expect(unloggedMeals).toHaveLength(1);
      expect(unloggedMeals[0].recipe_id).toBe('r2');
      expect(unloggedMeals[0].recipe_name).toBe('Pasta');
    });
  });

  describe('deleteCookLog', () => {
    it('deletes from cook_logs and decrements cookCount', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      useCookLogStore.setState({ cookCount: 3 });

      await useCookLogStore.getState().deleteCookLog('cl-1', null);

      expect(supabase.from).toHaveBeenCalledWith('cook_logs');
      expect(useCookLogStore.getState().cookCount).toBe(2);
    });

    it.todo('deleteCookLog with photoUrl deletes from storage');
  });
});
