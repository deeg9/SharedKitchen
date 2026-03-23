import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  GroceryItem,
  GroceryItemInsert,
  GroceryList,
  GrocerySummary,
  Ingredient,
} from '../types/database';
import { aggregateIngredients, computeSummary, groupBySection } from '../lib/grocery-utils';

interface RecipeWithIngredients {
  id: string;
  ingredients: Ingredient[];
}

interface GroceryState {
  items: GroceryItem[];
  activeListId: string | null;
  loading: boolean;
  error: string | null;

  // Computed
  summary: () => GrocerySummary;
  groupedItems: () => {
    sections: Record<string, GroceryItem[]>;
    completed: GroceryItem[];
  };

  // Actions
  generateGroceryList: (
    householdId: string,
    weekStart: string,
    recipes: RecipeWithIngredients[]
  ) => Promise<void>;
  fetchGroceryList: (householdId: string, weekStart: string) => Promise<void>;
  toggleItem: (itemId: string, checked: boolean, userId: string) => Promise<void>;
  addManualItem: (
    listId: string,
    name: string,
    quantity?: string,
    section?: string,
    estimatedPrice?: number
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;

  // Realtime helpers (called by useGrocerySync)
  _addItem: (item: GroceryItem) => void;
  _updateItem: (item: GroceryItem) => void;
  _removeItem: (itemId: string) => void;
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  items: [],
  activeListId: null,
  loading: false,
  error: null,

  summary: () => computeSummary(get().items),

  groupedItems: () => {
    const { items } = get();
    const unchecked = items.filter((i) => !i.is_checked);
    const completed = items.filter((i) => i.is_checked);
    const sections = groupBySection(unchecked);
    return { sections, completed };
  },

  generateGroceryList: async (householdId, weekStart, recipes) => {
    set({ loading: true, error: null });
    try {
      // Get or create the grocery list for this week
      let listId: string;

      const { data: existing, error: fetchError } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('household_id', householdId)
        .eq('week_start', weekStart)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        listId = existing.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: newList, error: createError } = await supabase
          .from('grocery_lists')
          .insert({
            household_id: householdId,
            week_start: weekStart,
            created_by: user?.id ?? null,
          })
          .select()
          .single();

        if (createError) throw createError;
        listId = newList.id;
      }

      // Aggregate ingredients from recipes
      const aggregated = aggregateIngredients(recipes);

      // Batch insert grocery items
      if (aggregated.length > 0) {
        const itemsToInsert = aggregated.map((item) => ({
          ...item,
          grocery_list_id: listId,
        }));

        const { error: insertError } = await supabase
          .from('grocery_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // Fetch all items for this list
      const { data: items, error: itemsError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', listId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      set({
        items: (items as GroceryItem[]) ?? [],
        activeListId: listId,
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to generate grocery list' });
    }
  },

  fetchGroceryList: async (householdId, weekStart) => {
    set({ loading: true, error: null });
    try {
      const { data: list, error: listError } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('household_id', householdId)
        .eq('week_start', weekStart)
        .single();

      if (listError) {
        if (listError.code === 'PGRST116') {
          // No list found for this week
          set({ items: [], activeListId: null, loading: false });
          return;
        }
        throw listError;
      }

      const { data: items, error: itemsError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', list.id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      set({
        items: (items as GroceryItem[]) ?? [],
        activeListId: list.id,
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to fetch grocery list' });
    }
  },

  toggleItem: async (itemId, checked, userId) => {
    const { items } = get();
    const original = items.find((i) => i.id === itemId);
    if (!original) return;

    // Optimistic update
    const now = new Date().toISOString();
    set({
      items: items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              is_checked: checked,
              checked_by: checked ? userId : null,
              checked_at: checked ? now : null,
            }
          : i
      ),
    });

    // Sync to Supabase
    const { error } = await supabase
      .from('grocery_items')
      .update({
        is_checked: checked,
        checked_by: checked ? userId : null,
        checked_at: checked ? now : null,
      })
      .eq('id', itemId);

    if (error) {
      // Revert on error
      set({
        items: get().items.map((i) =>
          i.id === itemId ? original : i
        ),
        error: error.message,
      });
    }
  },

  addManualItem: async (listId, name, quantity?, section?, estimatedPrice?) => {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert({
          grocery_list_id: listId,
          name,
          quantity: quantity || null,
          section: (section as GroceryItem['section']) || 'Other',
          estimated_price: estimatedPrice ?? null,
          is_manual: true,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        items: [...state.items, data as GroceryItem],
      }));
    } catch (error: any) {
      set({ error: error.message ?? 'Failed to add item' });
    }
  },

  removeItem: async (itemId) => {
    const { items } = get();
    const original = items.find((i) => i.id === itemId);

    // Optimistic remove
    set({ items: items.filter((i) => i.id !== itemId) });

    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', itemId);

    if (error && original) {
      // Revert
      set((state) => ({
        items: [...state.items, original],
        error: error.message,
      }));
    }
  },

  // Realtime helpers
  _addItem: (item) => {
    set((state) => {
      if (state.items.find((i) => i.id === item.id)) return state;
      return { items: [...state.items, item] };
    });
  },

  _updateItem: (item) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === item.id ? item : i)),
    }));
  },

  _removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },
}));
