import { supabase } from '../../src/lib/supabase';
import { useRecipeStore, scaleIngredients } from '../../src/stores/recipeStore';
import { Ingredient } from '../../src/types/database';

// Reset store state between tests
beforeEach(() => {
  useRecipeStore.setState({
    recipes: [],
    loading: false,
    error: null,
    searchQuery: '',
    activeCategory: null,
    selectedRecipe: null,
    ratings: [],
    notes: [],
  });
  jest.clearAllMocks();
});

describe('recipeStore', () => {
  describe('fetchRecipes', () => {
    it('calls supabase.from("recipes").select().eq("household_id", ...)', async () => {
      const mockData = [
        { id: 'r1', name: 'Tacos', household_id: 'h1', category: 'Mexican' },
        { id: 'r2', name: 'Pasta', household_id: 'h1', category: 'Italian' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().fetchRecipes('h1');

      expect(supabase.from).toHaveBeenCalledWith('recipes');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('household_id', 'h1');
      expect(useRecipeStore.getState().recipes).toEqual(mockData);
      expect(useRecipeStore.getState().loading).toBe(false);
    });
  });

  describe('createRecipe', () => {
    it('calls insert and returns recipe', async () => {
      const newRecipe = {
        name: 'New Recipe',
        household_id: 'h1',
        category: 'Mexican',
        servings: 4,
        ingredients: [],
        instructions: [],
        created_by: 'user1',
      };
      const createdRecipe = { id: 'r3', ...newRecipe, created_at: '2026-01-01' };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await useRecipeStore.getState().createRecipe(newRecipe as any);

      expect(supabase.from).toHaveBeenCalledWith('recipes');
      expect(mockChain.insert).toHaveBeenCalledWith(newRecipe);
      expect(result).toEqual(createdRecipe);
    });
  });

  describe('filteredRecipes', () => {
    const sampleRecipes = [
      { id: 'r1', name: 'Street Tacos', category: 'Mexican', household_id: 'h1' },
      { id: 'r2', name: 'Chicken Pasta', category: 'Italian', household_id: 'h1' },
      { id: 'r3', name: 'Taco Salad', category: 'Mexican', household_id: 'h1' },
      { id: 'r4', name: 'Grilled Chicken', category: 'Chicken', household_id: 'h1' },
    ];

    it('filters by search query (case-insensitive)', () => {
      useRecipeStore.setState({ recipes: sampleRecipes as any, searchQuery: 'taco' });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(2);
      expect(filtered.map((r: any) => r.id)).toEqual(['r1', 'r3']);
    });

    it('filters by category', () => {
      useRecipeStore.setState({ recipes: sampleRecipes as any, activeCategory: 'Mexican' });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r: any) => r.category === 'Mexican')).toBe(true);
    });

    it('returns intersection of search + category filters', () => {
      useRecipeStore.setState({
        recipes: sampleRecipes as any,
        searchQuery: 'chicken',
        activeCategory: 'Italian',
      });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('r2');
    });

    it('returns all recipes when no filters', () => {
      useRecipeStore.setState({ recipes: sampleRecipes as any });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(4);
    });
  });

  describe('toggleFavorite', () => {
    it('calls upsert on recipe_ratings with is_favorite', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'rr1', recipe_id: 'r1', user_id: 'u1', is_favorite: true, rating: null },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().toggleFavorite('r1', 'u1', true);

      expect(supabase.from).toHaveBeenCalledWith('recipe_ratings');
      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_id: 'r1',
          user_id: 'u1',
          is_favorite: true,
        }),
        expect.objectContaining({ onConflict: 'recipe_id,user_id' })
      );
    });
  });

  describe('rateRecipe', () => {
    it('calls upsert with rating value', async () => {
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'rr1', recipe_id: 'r1', user_id: 'u1', is_favorite: false, rating: 4 },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().rateRecipe('r1', 'u1', 4);

      expect(supabase.from).toHaveBeenCalledWith('recipe_ratings');
      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_id: 'r1',
          user_id: 'u1',
          rating: 4,
        }),
        expect.objectContaining({ onConflict: 'recipe_id,user_id' })
      );
    });
  });

  describe('scaleIngredients', () => {
    const ingredients: Ingredient[] = [
      { amount: 2, unit: 'cups', name: 'flour' },
      { amount: 0.5, unit: 'tsp', name: 'salt' },
      { amount: 1, unit: 'lb', name: 'chicken' },
    ];

    it('scales by x1 (no change)', () => {
      const scaled = scaleIngredients(ingredients, 1);
      expect(scaled[0].amount).toBe(2);
      expect(scaled[1].amount).toBe(0.5);
      expect(scaled[2].amount).toBe(1);
    });

    it('scales by x2', () => {
      const scaled = scaleIngredients(ingredients, 2);
      expect(scaled[0].amount).toBe(4);
      expect(scaled[1].amount).toBe(1);
      expect(scaled[2].amount).toBe(2);
    });

    it('scales by x3', () => {
      const scaled = scaleIngredients(ingredients, 3);
      expect(scaled[0].amount).toBe(6);
      expect(scaled[1].amount).toBe(1.5);
      expect(scaled[2].amount).toBe(3);
    });

    it('handles zero amounts', () => {
      const withZero: Ingredient[] = [{ amount: 0, unit: 'pinch', name: 'saffron' }];
      const scaled = scaleIngredients(withZero, 3);
      expect(scaled[0].amount).toBe(0);
    });

    it('handles fractional amounts', () => {
      const fractional: Ingredient[] = [{ amount: 0.25, unit: 'cup', name: 'sugar' }];
      const scaled = scaleIngredients(fractional, 2);
      expect(scaled[0].amount).toBe(0.5);
    });
  });
});
