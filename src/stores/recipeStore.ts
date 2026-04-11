import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  Ingredient,
  Recipe,
  RecipeInsert,
  RecipeUpdate,
  RecipeRating,
  RecipeNote,
} from '../types/database';
import { NutritionData } from '../types/food';
import { matchIngredients } from '../lib/food-api';
import { getErrorMessage } from '../lib/errors';

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  activeCategory: string | null;
  costRange: [number, number] | null;
  maxPrepTime: number | null;
  selectedRecipe: Recipe | null;
  ratings: RecipeRating[];
  notes: RecipeNote[];

  // Computed
  filteredRecipes: () => Recipe[];
  hasActiveFilters: () => boolean;

  // Nutrition
  nutritionLoading: boolean;
  nutritionError: string | null;

  // Actions
  fetchRecipes: (householdId: string) => Promise<void>;
  createRecipe: (recipe: RecipeInsert) => Promise<Recipe | null>;
  updateRecipe: (id: string, updates: RecipeUpdate) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  fetchRecipeDetail: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string | null) => void;
  setCostRange: (range: [number, number] | null) => void;
  setMaxPrepTime: (time: number | null) => void;
  resetFilters: () => void;
  toggleFavorite: (recipeId: string, userId: string, isFavorite: boolean) => Promise<void>;
  rateRecipe: (recipeId: string, userId: string, rating: number) => Promise<void>;
  addNote: (recipeId: string, userId: string, content: string) => Promise<void>;
  fetchNotes: (recipeId: string) => Promise<void>;
  computeNutrition: (recipeId: string) => Promise<void>;
  clear: () => void;
}

/**
 * Pure function to scale ingredient amounts by a multiplier.
 */
export function scaleIngredients(ingredients: Ingredient[], multiplier: number): Ingredient[] {
  return ingredients.map((ing) => ({
    ...ing,
    amount: ing.amount * multiplier,
  }));
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
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
  nutritionLoading: false,
  nutritionError: null,

  filteredRecipes: () => {
    const { recipes, searchQuery, activeCategory, costRange, maxPrepTime } = get();
    let filtered = recipes;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(q));
    }

    if (activeCategory) {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }

    if (costRange) {
      const [min, max] = costRange;
      filtered = filtered.filter((r) => {
        const cost = r.estimated_cost ?? 0;
        return cost >= min && cost <= max;
      });
    }

    if (maxPrepTime) {
      filtered = filtered.filter((r) => {
        const time = r.prep_time_minutes ?? 0;
        return time > 0 && time <= maxPrepTime;
      });
    }

    return filtered;
  },

  hasActiveFilters: () => {
    const { activeCategory, costRange, maxPrepTime, searchQuery } = get();
    return !!(activeCategory || costRange || maxPrepTime || searchQuery);
  },

  fetchRecipes: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ recipes: (data as Recipe[]) ?? [], loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  // Phase 45: created_by establishes recipe ownership for creator-only editing
  createRecipe: async (recipe: RecipeInsert) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipe)
        .select()
        .single();

      if (error) throw error;

      const created = data as Recipe;
      set((state) => ({
        recipes: [created, ...state.recipes],
        loading: false,
      }));
      return created;
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
      return null;
    }
  },

  updateRecipe: async (id: string, updates: RecipeUpdate) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === id ? { ...r, ...updates } as Recipe : r
        ),
        selectedRecipe:
          state.selectedRecipe?.id === id
            ? { ...state.selectedRecipe, ...updates } as Recipe
            : state.selectedRecipe,
        loading: false,
      }));
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  deleteRecipe: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  fetchRecipeDetail: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Fetch recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (recipeError) throw recipeError;

      // Fetch ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('recipe_ratings')
        .select('*')
        .eq('recipe_id', id);

      if (ratingsError) throw ratingsError;

      // Fetch notes
      const { data: notes, error: notesError } = await supabase
        .from('recipe_notes')
        .select('*')
        .eq('recipe_id', id);

      if (notesError) throw notesError;

      set({
        selectedRecipe: recipe as Recipe,
        ratings: (ratings as RecipeRating[]) ?? [],
        notes: (notes as RecipeNote[]) ?? [],
        loading: false,
      });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setActiveCategory: (category: string | null) => {
    set({ activeCategory: category });
  },

  setCostRange: (range: [number, number] | null) => {
    set({ costRange: range });
  },

  setMaxPrepTime: (time: number | null) => {
    set({ maxPrepTime: time });
  },

  resetFilters: () => {
    set({ activeCategory: null, costRange: null, maxPrepTime: null, searchQuery: '' });
  },

  toggleFavorite: async (recipeId: string, userId: string, isFavorite: boolean) => {
    try {
      const { data, error } = await supabase
        .from('recipe_ratings')
        .upsert(
          { recipe_id: recipeId, user_id: userId, is_favorite: isFavorite },
          { onConflict: 'recipe_id,user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      set((state) => {
        const existing = state.ratings.find(
          (r) => r.recipe_id === recipeId && r.user_id === userId
        );
        if (existing) {
          return {
            ratings: state.ratings.map((r) =>
              r.recipe_id === recipeId && r.user_id === userId
                ? (data as RecipeRating)
                : r
            ),
          };
        }
        return { ratings: [...state.ratings, data as RecipeRating] };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  rateRecipe: async (recipeId: string, userId: string, rating: number) => {
    try {
      const { data, error } = await supabase
        .from('recipe_ratings')
        .upsert(
          { recipe_id: recipeId, user_id: userId, rating },
          { onConflict: 'recipe_id,user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      set((state) => {
        const existing = state.ratings.find(
          (r) => r.recipe_id === recipeId && r.user_id === userId
        );
        if (existing) {
          return {
            ratings: state.ratings.map((r) =>
              r.recipe_id === recipeId && r.user_id === userId
                ? (data as RecipeRating)
                : r
            ),
          };
        }
        return { ratings: [...state.ratings, data as RecipeRating] };
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  addNote: async (recipeId: string, userId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('recipe_notes')
        .insert({ recipe_id: recipeId, user_id: userId, content })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        notes: [...state.notes, data as RecipeNote],
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  computeNutrition: async (recipeId: string) => {
    const { recipes, selectedRecipe } = get();
    const recipe = selectedRecipe?.id === recipeId
      ? selectedRecipe
      : recipes.find((r) => r.id === recipeId);

    if (!recipe) return;

    // Skip if already cached
    if (recipe.computed_nutrition != null) {
      return;
    }

    set({ nutritionLoading: true, nutritionError: null });
    try {
      const ingredients = (recipe.ingredients ?? []) as Ingredient[];
      if (ingredients.length === 0) {
        set({ nutritionLoading: false, nutritionError: 'No ingredients to analyze' });
        return;
      }

      const response = await matchIngredients(
        recipeId,
        ingredients.map((ing) => ({ amount: ing.amount, unit: ing.unit, name: ing.name })),
        recipe.servings ?? 1
      );

      const updates = {
        computed_nutrition: response.per_serving_nutrition as unknown as Record<string, unknown>,
        ingredient_matches: response.matches as unknown as Record<string, unknown>[],
      };

      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === recipeId ? { ...r, ...updates } as Recipe : r
        ),
        selectedRecipe:
          state.selectedRecipe?.id === recipeId
            ? { ...state.selectedRecipe, ...updates } as Recipe
            : state.selectedRecipe,
        nutritionLoading: false,
      }));
    } catch (error: unknown) {
      set({ nutritionLoading: false, nutritionError: getErrorMessage(error) });
    }
  },

  clear: () => set({ recipes: [], loading: false, error: null, searchQuery: '', activeCategory: null, costRange: null, maxPrepTime: null, selectedRecipe: null, ratings: [], notes: [], nutritionLoading: false, nutritionError: null }),

  fetchNotes: async (recipeId: string) => {
    try {
      const { data, error } = await supabase
        .from('recipe_notes')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ notes: (data as RecipeNote[]) ?? [] });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },
}));
