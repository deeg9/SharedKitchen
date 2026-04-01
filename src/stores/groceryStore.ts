import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  GroceryItem,
  GroceryItemInsert,
  GroceryList,
  GrocerySummary,
  FrequentItem,
  Ingredient,
} from '../types/database';
import { aggregateIngredients, computeSummary, groupBySection } from '../lib/grocery-utils';
import { getErrorMessage } from '../lib/errors';
import { useHouseholdStore } from './householdStore';

interface RecipeWithIngredients {
  id: string;
  ingredients: Ingredient[];
}

interface GroceryState {
  items: GroceryItem[];
  activeListId: string | null;
  frequentItems: FrequentItem[];
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
  fetchFrequentItems: (householdId: string, excludeListId?: string | null) => Promise<void>;
  bulkAddGroceryItems: (
    listId: string,
    items: Array<{ name: string; quantity?: string; category?: string }>
  ) => Promise<{ addedCount: number }>;
  removeItem: (itemId: string) => Promise<void>;
  updateItem: (
    itemId: string,
    updates: { name?: string; quantity?: string; section?: string; estimated_price?: number | null }
  ) => Promise<void>;

  // Realtime helpers (called by useGrocerySync)
  _addItem: (item: GroceryItem) => void;
  _updateItem: (item: GroceryItem) => void;
  _removeItem: (itemId: string) => void;
  clear: () => void;
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  items: [],
  activeListId: null,
  frequentItems: [],
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
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
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
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
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

    // Auto-copy to pantry when checking off (not unchecking)
    if (checked && !error) {
      const householdId = useHouseholdStore.getState().activeHouseholdId;
      if (householdId && original) {
        import('./pantryStore').then((m) => {
          m.usePantryStore.getState().addFromGrocery(
            householdId,
            {
              name: original.name,
              quantity: original.quantity,
              section: original.section,
            },
            itemId
          );
        }).catch(() => {
          // Silently ignore pantry copy failures -- grocery check-off is the primary action
        });
      }
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
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  bulkAddGroceryItems: async (listId, items) => {
    try {
      const inserts = items.map((item) => ({
        grocery_list_id: listId,
        name: item.name,
        quantity: item.quantity || null,
        section: (item.category as GroceryItem['section']) || 'Other',
        estimated_price: null,
        is_manual: true,
      }));

      // Optimistic: create temp items
      const tempItems: GroceryItem[] = inserts.map((ins, idx) => ({
        id: `temp-bulk-${Date.now()}-${idx}`,
        ...ins,
        is_checked: false,
        checked_by: null,
        created_at: new Date().toISOString(),
      })) as unknown as GroceryItem[];
      set((state) => ({ items: [...state.items, ...tempItems] }));

      // Single batch insert
      const { data, error } = await supabase
        .from('grocery_items')
        .insert(inserts)
        .select();

      if (error) {
        const tempIds = new Set(tempItems.map((t) => t.id));
        set((state) => ({
          items: state.items.filter((i) => !tempIds.has(i.id)),
          error: error.message,
        }));
        return { addedCount: 0 };
      }

      // Replace temp items with real ones
      const tempIds = new Set(tempItems.map((t) => t.id));
      set((state) => ({
        items: [
          ...state.items.filter((i) => !tempIds.has(i.id)),
          ...(data as GroceryItem[]),
        ],
      }));
      return { addedCount: data.length };
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      return { addedCount: 0 };
    }
  },

  fetchFrequentItems: async (householdId, excludeListId) => {
    try {
      // Get recent lists for this household (last 8 weeks)
      let query = supabase
        .from('grocery_lists')
        .select('id')
        .eq('household_id', householdId)
        .order('week_start', { ascending: false })
        .limit(8);

      if (excludeListId) {
        query = query.neq('id', excludeListId);
      }

      const { data: lists } = await query;
      if (!lists || lists.length === 0) {
        set({ frequentItems: [] });
        return;
      }

      const listIds = lists.map((l) => l.id);
      const { data: rawItems } = await supabase
        .from('grocery_items')
        .select('name, quantity, section, estimated_price, created_at')
        .in('grocery_list_id', listIds);

      if (!rawItems || rawItems.length === 0) {
        set({ frequentItems: [] });
        return;
      }

      // Aggregate by normalized name, pick most recent defaults
      const map = new Map<string, FrequentItem & { latestAt: string }>();
      for (const item of rawItems) {
        const key = item.name.toLowerCase().trim();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (item.created_at > existing.latestAt) {
            existing.name = item.name;
            existing.quantity = item.quantity;
            existing.section = item.section;
            existing.estimated_price = item.estimated_price;
            existing.latestAt = item.created_at;
          }
        } else {
          map.set(key, {
            name: item.name,
            quantity: item.quantity,
            section: item.section,
            estimated_price: item.estimated_price,
            count: 1,
            latestAt: item.created_at,
          });
        }
      }

      const frequent = Array.from(map.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(({ latestAt, ...rest }) => rest);

      set({ frequentItems: frequent });
    } catch {
      // Non-critical — silently fail
      set({ frequentItems: [] });
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

  updateItem: async (itemId, updates) => {
    const { items } = get();
    const original = items.find((i) => i.id === itemId);

    // Optimistic update
    set({
      items: items.map((i) =>
        i.id === itemId ? { ...i, ...updates } as GroceryItem : i
      ),
    });

    const { error } = await supabase
      .from('grocery_items')
      .update(updates)
      .eq('id', itemId);

    if (error && original) {
      // Revert
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? original : i)),
        error: error.message,
      }));
    }
  },

  clear: () => set({ items: [], activeListId: null, frequentItems: [], loading: false, error: null }),

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
