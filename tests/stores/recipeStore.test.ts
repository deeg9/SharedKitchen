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
    costRange: null,
    maxPrepTime: null,
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

  describe('filteredRecipes - cost range', () => {
    const recipesWithCost = [
      { id: 'r1', name: 'Cheap Tacos', category: 'Mexican', estimated_cost: 5, household_id: 'h1' },
      { id: 'r2', name: 'Mid Pasta', category: 'Italian', estimated_cost: 20, household_id: 'h1' },
      { id: 'r3', name: 'Fancy Steak', category: 'American', estimated_cost: 45, household_id: 'h1' },
      { id: 'r4', name: 'No Cost Soup', category: 'Soup', household_id: 'h1' },
    ];

    it('filters by cost range [0, 10]', () => {
      useRecipeStore.setState({ recipes: recipesWithCost as any, costRange: [0, 10] });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(2);
      expect(filtered.map((r: any) => r.id)).toEqual(['r1', 'r4']);
    });

    it('filters by cost range [0, 25]', () => {
      useRecipeStore.setState({ recipes: recipesWithCost as any, costRange: [0, 25] });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(3);
      expect(filtered.map((r: any) => r.id)).toEqual(['r1', 'r2', 'r4']);
    });

    it('treats null estimated_cost as 0 for cost filter', () => {
      useRecipeStore.setState({ recipes: recipesWithCost as any, costRange: [0, 10] });
      const filtered = useRecipeStore.getState().filteredRecipes();
      const ids = filtered.map((r: any) => r.id);
      expect(ids).toContain('r4');
    });
  });

  describe('filteredRecipes - prep time', () => {
    const recipesWithTime = [
      { id: 'r1', name: 'Quick', prep_time_minutes: 10, household_id: 'h1' },
      { id: 'r2', name: 'Medium', prep_time_minutes: 25, household_id: 'h1' },
      { id: 'r3', name: 'Slow', prep_time_minutes: 90, household_id: 'h1' },
      { id: 'r4', name: 'No Time', household_id: 'h1' },
    ];

    it('filters by maxPrepTime 15', () => {
      useRecipeStore.setState({ recipes: recipesWithTime as any, maxPrepTime: 15 });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('r1');
    });

    it('filters by maxPrepTime 30', () => {
      useRecipeStore.setState({ recipes: recipesWithTime as any, maxPrepTime: 30 });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(2);
      expect(filtered.map((r: any) => r.id)).toEqual(['r1', 'r2']);
    });

    it('excludes recipes with null prep_time from time filter', () => {
      useRecipeStore.setState({ recipes: recipesWithTime as any, maxPrepTime: 30 });
      const filtered = useRecipeStore.getState().filteredRecipes();
      const ids = filtered.map((r: any) => r.id);
      expect(ids).not.toContain('r4');
    });
  });

  describe('filteredRecipes - combined filters', () => {
    const recipes = [
      { id: 'r1', name: 'Quick Tacos', category: 'Mexican', estimated_cost: 8, prep_time_minutes: 15, household_id: 'h1' },
      { id: 'r2', name: 'Slow Tacos', category: 'Mexican', estimated_cost: 8, prep_time_minutes: 60, household_id: 'h1' },
      { id: 'r3', name: 'Quick Pasta', category: 'Italian', estimated_cost: 8, prep_time_minutes: 15, household_id: 'h1' },
      { id: 'r4', name: 'Expensive Quick Tacos', category: 'Mexican', estimated_cost: 50, prep_time_minutes: 15, household_id: 'h1' },
    ];

    it('applies search + category + cost + time together', () => {
      useRecipeStore.setState({
        recipes: recipes as any,
        searchQuery: 'tacos',
        activeCategory: 'Mexican',
        costRange: [0, 10],
        maxPrepTime: 20,
      });
      const filtered = useRecipeStore.getState().filteredRecipes();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('r1');
    });
  });

  describe('hasActiveFilters', () => {
    it('returns false when no filters set', () => {
      expect(useRecipeStore.getState().hasActiveFilters()).toBe(false);
    });

    it('returns true when searchQuery is set', () => {
      useRecipeStore.setState({ searchQuery: 'test' });
      expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
    });

    it('returns true when activeCategory is set', () => {
      useRecipeStore.setState({ activeCategory: 'Mexican' });
      expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
    });

    it('returns true when costRange is set', () => {
      useRecipeStore.setState({ costRange: [0, 10] });
      expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
    });

    it('returns true when maxPrepTime is set', () => {
      useRecipeStore.setState({ maxPrepTime: 30 });
      expect(useRecipeStore.getState().hasActiveFilters()).toBe(true);
    });
  });

  describe('updateRecipe', () => {
    it('updates recipe via supabase and refreshes local state', async () => {
      // Seed store with a recipe
      useRecipeStore.setState({
        recipes: [
          { id: 'recipe-1', name: 'Old Name', household_id: 'h1', category: 'Mexican' } as any,
          { id: 'recipe-2', name: 'Other', household_id: 'h1', category: 'Italian' } as any,
        ],
      });

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().updateRecipe('recipe-1', { name: 'Updated Name' });

      expect(supabase.from).toHaveBeenCalledWith('recipes');
      expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Name' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'recipe-1');

      // Local state should be updated
      const recipe = useRecipeStore.getState().recipes.find((r) => r.id === 'recipe-1');
      expect(recipe?.name).toBe('Updated Name');
      expect(useRecipeStore.getState().loading).toBe(false);
    });

    it('sets error on update failure', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'update failed' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().updateRecipe('recipe-1', { name: 'Fail' });

      expect(useRecipeStore.getState().error).toBe('An unexpected error occurred');
      expect(useRecipeStore.getState().loading).toBe(false);
    });
  });

  describe('deleteRecipe', () => {
    it('deletes recipe via supabase and removes from local state', async () => {
      // Seed store with 2 recipes
      useRecipeStore.setState({
        recipes: [
          { id: 'recipe-1', name: 'Delete Me', household_id: 'h1' } as any,
          { id: 'recipe-2', name: 'Keep Me', household_id: 'h1' } as any,
        ],
      });

      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().deleteRecipe('recipe-1');

      expect(supabase.from).toHaveBeenCalledWith('recipes');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'recipe-1');

      const recipes = useRecipeStore.getState().recipes;
      expect(recipes).toHaveLength(1);
      expect(recipes[0].id).toBe('recipe-2');
      expect(useRecipeStore.getState().loading).toBe(false);
    });

    it('sets error on delete failure', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'delete failed' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().deleteRecipe('recipe-1');

      expect(useRecipeStore.getState().error).toBe('An unexpected error occurred');
      expect(useRecipeStore.getState().loading).toBe(false);
    });
  });

  describe('resetFilters', () => {
    it('clears all filters', () => {
      useRecipeStore.setState({
        searchQuery: 'tacos',
        activeCategory: 'Mexican',
        costRange: [0, 10],
        maxPrepTime: 30,
      });

      useRecipeStore.getState().resetFilters();

      const state = useRecipeStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.activeCategory).toBeNull();
      expect(state.costRange).toBeNull();
      expect(state.maxPrepTime).toBeNull();
    });
  });

  describe('fetchRecipeDetail', () => {
    it('fetches recipe, ratings, and notes and sets state', async () => {
      const mockRecipe = { id: 'r1', name: 'Tacos', household_id: 'h1' };
      const mockRatings = [{ id: 'rr1', recipe_id: 'r1', user_id: 'u1', rating: 4, is_favorite: false }];
      const mockNotes = [{ id: 'n1', recipe_id: 'r1', user_id: 'u1', content: 'Great!', created_at: '2026-01-01' }];

      const recipeChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRecipe, error: null }),
      };
      const ratingsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockRatings, error: null }),
      };
      const notesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockNotes, error: null }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(recipeChain)
        .mockReturnValueOnce(ratingsChain)
        .mockReturnValueOnce(notesChain);

      await useRecipeStore.getState().fetchRecipeDetail('r1');

      expect(useRecipeStore.getState().selectedRecipe).toEqual(mockRecipe);
      expect(useRecipeStore.getState().ratings).toEqual(mockRatings);
      expect(useRecipeStore.getState().notes).toEqual(mockNotes);
      expect(useRecipeStore.getState().loading).toBe(false);
    });

    it('sets error on recipe fetch failure', async () => {
      const recipeChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Recipe not found' } }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(recipeChain);

      await useRecipeStore.getState().fetchRecipeDetail('bad-id');

      expect(useRecipeStore.getState().error).toBe('An unexpected error occurred');
      expect(useRecipeStore.getState().loading).toBe(false);
    });
  });

  describe('addNote', () => {
    it('inserts note and appends to state', async () => {
      const newNote = { id: 'n1', recipe_id: 'r1', user_id: 'u1', content: 'Tip text', created_at: '2026-01-01' };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newNote, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().addNote('r1', 'u1', 'Tip text');

      expect(supabase.from).toHaveBeenCalledWith('recipe_notes');
      expect(mockChain.insert).toHaveBeenCalledWith({ recipe_id: 'r1', user_id: 'u1', content: 'Tip text' });
      expect(useRecipeStore.getState().notes).toEqual([newNote]);
    });

    it('sets error on note insert failure', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().addNote('r1', 'u1', 'Tip text');

      expect(useRecipeStore.getState().error).toBe('An unexpected error occurred');
    });
  });

  describe('fetchNotes', () => {
    it('fetches notes for recipe and sets state', async () => {
      const mockNotes = [
        { id: 'n1', recipe_id: 'r1', user_id: 'u1', content: 'Note 1', created_at: '2026-01-02' },
        { id: 'n2', recipe_id: 'r1', user_id: 'u2', content: 'Note 2', created_at: '2026-01-01' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockNotes, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().fetchNotes('r1');

      expect(supabase.from).toHaveBeenCalledWith('recipe_notes');
      expect(useRecipeStore.getState().notes).toEqual(mockNotes);
    });

    it('sets error on notes fetch failure', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useRecipeStore.getState().fetchNotes('r1');

      expect(useRecipeStore.getState().error).toBe('An unexpected error occurred');
    });
  });
});
