import { usePlanStore } from '../../src/stores/planStore';
import { useBudgetStore } from '../../src/stores/budgetStore';
import { supabase } from '../../src/lib/supabase';

// Get the mock from setup.tsx
const mockFrom = supabase.from as jest.Mock;

describe('planStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    usePlanStore.setState({
      weekOffset: 0,
      mealPlan: new Map(),
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('setWeekOffset', () => {
    it('updates weekOffset state', () => {
      usePlanStore.getState().setWeekOffset(2);
      expect(usePlanStore.getState().weekOffset).toBe(2);
    });

    it('can set negative offset', () => {
      usePlanStore.getState().setWeekOffset(-1);
      expect(usePlanStore.getState().weekOffset).toBe(-1);
    });
  });

  describe('weekDays', () => {
    it('returns 7 days based on weekOffset', () => {
      const days = usePlanStore.getState().weekDays();
      expect(days).toHaveLength(7);
    });
  });

  describe('fetchMealPlan', () => {
    it('queries meal_plans by household_id and date range', async () => {
      const mockData = [
        {
          id: 'mp-1',
          household_id: 'h-1',
          recipe_id: 'r-1',
          plan_date: '2026-03-23',
          assigned_cook: null,
          notes: null,
          created_by: 'u-1',
          created_at: '2026-03-23T00:00:00Z',
          recipes: { id: 'r-1', name: 'Test Recipe', category: null, image_url: null, prep_time_minutes: 15, cook_time_minutes: 30, servings: 4, estimated_cost: 10, ingredients: [], instructions: [], tags: [], source_url: null, created_by: 'u-1', created_at: '2026-03-23T00:00:00Z', updated_at: '2026-03-23T00:00:00Z', household_id: 'h-1' },
        },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      };
      mockFrom.mockReturnValue(mockChain);

      await usePlanStore.getState().fetchMealPlan('h-1', '2026-03-23');

      expect(mockFrom).toHaveBeenCalledWith('meal_plans');
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('household_id', 'h-1');
    });

    it('sets loading state during fetch', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn(() => Promise.resolve({ data: [], error: null })),
      };
      mockFrom.mockReturnValue(mockChain);

      const promise = usePlanStore.getState().fetchMealPlan('h-1', '2026-03-23');
      // loading should be true during fetch
      expect(usePlanStore.getState().loading).toBe(true);
      await promise;
      expect(usePlanStore.getState().loading).toBe(false);
    });

    it('sets error state on supabase failure', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Network error' } })),
      };
      mockFrom.mockReturnValue(mockChain);

      await usePlanStore.getState().fetchMealPlan('h-1', '2026-03-23');

      const state = usePlanStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.loading).toBe(false);
    });
  });

  describe('assignRecipe', () => {
    it('calls upsert on meal_plans', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: 'mp-1',
              household_id: 'h-1',
              recipe_id: 'r-1',
              plan_date: '2026-03-23',
              assigned_cook: 'u-1',
              notes: 'test notes',
              created_by: 'u-1',
              created_at: '2026-03-23T00:00:00Z',
            },
            error: null,
          })
        ),
      };
      mockFrom.mockReturnValue(mockChain);

      await usePlanStore.getState().assignRecipe('h-1', '2026-03-23', 'dinner', 'r-1', 'u-1', 'test notes');

      expect(mockFrom).toHaveBeenCalledWith('meal_plans');
      expect(mockChain.upsert).toHaveBeenCalled();
    });

    it('populates mealPlan Map with plan_date+meal_type key after assign', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: 'mp-1',
              household_id: 'h-1',
              recipe_id: 'r-1',
              plan_date: '2026-03-23',
              meal_type: 'dinner',
              assigned_cook: 'u-1',
              notes: null,
              created_by: 'u-1',
              created_at: '2026-03-23T00:00:00Z',
              recipes: { id: 'r-1', name: 'Pasta', prep_time_minutes: 20 },
            },
            error: null,
          })
        ),
      };
      mockFrom.mockReturnValue(mockChain);

      await usePlanStore.getState().assignRecipe('h-1', '2026-03-23', 'dinner', 'r-1', 'u-1');

      const state = usePlanStore.getState();
      expect(state.mealPlan.size).toBe(1);
      const entry = state.mealPlan.values().next().value;
      expect(entry.plan_date).toBe('2026-03-23');
    });

    it('auto-creates expense for takeout meals via budgetStore', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: 'mp-2',
              household_id: 'h-1',
              recipe_id: 'r-1',
              plan_date: '2026-03-23',
              meal_type: 'dinner',
              assigned_cook: 'u-1',
              notes: null,
              created_by: 'u-1',
              created_at: '2026-03-23T00:00:00Z',
              recipes: { id: 'r-1', name: 'Pizza', prep_time_minutes: 0 },
            },
            error: null,
          })
        ),
      };
      mockFrom.mockReturnValue(mockChain);

      // Mock budgetStore.addExpense
      const mockAddExpense = jest.fn().mockResolvedValue(undefined);
      useBudgetStore.setState({ addExpense: mockAddExpense } as any);

      await usePlanStore.getState().assignRecipe('h-1', '2026-03-23', 'dinner', 'r-1', 'u-1', undefined, 'takeout', 15.99);

      expect(mockAddExpense).toHaveBeenCalledWith('h-1', expect.objectContaining({
        amount: 15.99,
        category: 'Takeout',
        expense_date: '2026-03-23',
      }));
    });

    it('sets error state on assign failure', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: 'Conflict' },
          })
        ),
      };
      mockFrom.mockReturnValue(mockChain);

      await usePlanStore.getState().assignRecipe('h-1', '2026-03-23', 'dinner', 'r-1');

      const state = usePlanStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.loading).toBe(false);
    });
  });

  describe('clearMeal', () => {
    it('calls delete on meal_plans with meal_type', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Chain .eq() calls: first returns this, second returns this, third resolves
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: null, error: null });
      mockFrom.mockReturnValue(mockChain);

      await usePlanStore.getState().clearMeal('h-1', '2026-03-23', 'dinner');

      expect(mockFrom).toHaveBeenCalledWith('meal_plans');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('meal_type', 'dinner');
    });
  });

  describe('clear', () => {
    it('resets mealPlan, loading, error, weekOffset', () => {
      // Set up dirty state
      const dirtyMap = new Map();
      dirtyMap.set('2026-03-23-dinner', { id: 'mp-1', plan_date: '2026-03-23' });
      usePlanStore.setState({
        mealPlan: dirtyMap,
        weekOffset: 2,
        error: 'old error',
        loading: true,
      });

      usePlanStore.getState().clear();

      const state = usePlanStore.getState();
      expect(state.mealPlan.size).toBe(0);
      expect(state.weekOffset).toBe(0);
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('getRandomSuggestion', () => {
    it('returns a random recipe from the household', async () => {
      const mockRecipes = [
        { id: 'r-1', name: 'Recipe 1' },
        { id: 'r-2', name: 'Recipe 2' },
        { id: 'r-3', name: 'Recipe 3' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => Promise.resolve({ data: mockRecipes, error: null })),
      };
      mockFrom.mockReturnValue(mockChain);

      const result = await usePlanStore.getState().getRandomSuggestion('h-1');
      expect(result).toBeDefined();
      expect(mockFrom).toHaveBeenCalledWith('recipes');
    });
  });
});
