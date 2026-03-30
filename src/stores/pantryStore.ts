import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PantryItem, PantryItemUpdate } from '../types/database';
import { getErrorMessage } from '../lib/errors';

interface PantryState {
  items: PantryItem[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPantryItems: (householdId: string) => Promise<void>;
  addPantryItem: (
    householdId: string,
    item: {
      name: string;
      quantity?: string;
      unit?: string;
      category?: string;
      expires_at?: string;
    }
  ) => Promise<void>;
  updatePantryItem: (itemId: string, updates: Partial<PantryItemUpdate>) => Promise<void>;
  removePantryItem: (itemId: string) => Promise<void>;
  addFromGrocery: (
    householdId: string,
    groceryItem: { name: string; quantity: string | null; section: string | null },
    groceryItemId: string
  ) => Promise<void>;
  bulkAddPantryItems: (
    householdId: string,
    items: Array<{
      name: string;
      quantity?: string;
      category?: string;
    }>
  ) => Promise<{ addedCount: number }>;

  // Realtime helpers (called by usePantrySync)
  _addItem: (item: PantryItem) => void;
  _updateItem: (item: PantryItem) => void;
  _removeItem: (itemId: string) => void;
  clear: () => void;
}

/** Map grocery section names to pantry categories */
function mapSectionToCategory(section: string | null): string {
  if (!section) return 'Other';
  const map: Record<string, string> = {
    'Proteins': 'Proteins',
    'Produce': 'Produce',
    'Dairy & Eggs': 'Dairy & Eggs',
    'Pantry': 'Pantry',
    'Other': 'Other',
  };
  return map[section] ?? 'Other';
}

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchPantryItems: async (householdId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('household_id', householdId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      set({ items: (data as PantryItem[]) ?? [], loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  addPantryItem: async (householdId, item) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newItem = {
        household_id: householdId,
        name: item.name,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        category: item.category ?? 'Other',
        expires_at: item.expires_at ?? null,
        created_by: user?.id ?? null,
      };

      // Optimistic: create a temporary item
      const tempId = `temp-${Date.now()}`;
      const optimistic: PantryItem = {
        id: tempId,
        ...newItem,
        added_at: new Date().toISOString(),
        source_grocery_item_id: null,
      };
      set((state) => ({ items: [optimistic, ...state.items] }));

      const { data, error } = await supabase
        .from('pantry_items')
        .insert(newItem)
        .select()
        .single();

      if (error) {
        // Revert optimistic add
        set((state) => ({ items: state.items.filter((i) => i.id !== tempId), error: error.message }));
        return;
      }

      // Replace temp with real item
      set((state) => ({
        items: state.items.map((i) => (i.id === tempId ? (data as PantryItem) : i)),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  updatePantryItem: async (itemId, updates) => {
    const { items } = get();
    const original = items.find((i) => i.id === itemId);

    // Optimistic update
    set({
      items: items.map((i) =>
        i.id === itemId ? { ...i, ...updates } as PantryItem : i
      ),
    });

    const { error } = await supabase
      .from('pantry_items')
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

  removePantryItem: async (itemId) => {
    const { items } = get();
    const original = items.find((i) => i.id === itemId);

    // Optimistic remove
    set({ items: items.filter((i) => i.id !== itemId) });

    const { error } = await supabase
      .from('pantry_items')
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

  addFromGrocery: async (householdId, groceryItem, groceryItemId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newItem = {
        household_id: householdId,
        name: groceryItem.name,
        quantity: groceryItem.quantity,
        unit: null,
        category: mapSectionToCategory(groceryItem.section),
        created_by: user?.id ?? null,
        source_grocery_item_id: groceryItemId,
      };

      const { data, error } = await supabase
        .from('pantry_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        items: [data as PantryItem, ...state.items],
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  bulkAddPantryItems: async (householdId, items) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const inserts = items.map((item) => ({
        household_id: householdId,
        name: item.name,
        quantity: item.quantity ?? null,
        unit: null,
        category: item.category ?? 'Other',
        created_by: user?.id ?? null,
      }));

      // Optimistic: create temp items
      const tempItems: PantryItem[] = inserts.map((ins, idx) => ({
        id: `temp-bulk-${Date.now()}-${idx}`,
        ...ins,
        added_at: new Date().toISOString(),
        expires_at: null,
        source_grocery_item_id: null,
      }));
      set((state) => ({ items: [...tempItems, ...state.items] }));

      // Single batch insert
      const { data, error } = await supabase
        .from('pantry_items')
        .insert(inserts)
        .select();

      if (error) {
        // Revert all temp items
        const tempIds = new Set(tempItems.map(t => t.id));
        set((state) => ({
          items: state.items.filter((i) => !tempIds.has(i.id)),
          error: error.message,
        }));
        return { addedCount: 0 };
      }

      // Replace temp items with real ones
      const tempIds = new Set(tempItems.map(t => t.id));
      set((state) => ({
        items: [
          ...(data as PantryItem[]),
          ...state.items.filter((i) => !tempIds.has(i.id)),
        ],
      }));
      return { addedCount: data.length };
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      return { addedCount: 0 };
    }
  },

  clear: () => set({ items: [], loading: false, error: null }),

  // Realtime helpers
  _addItem: (item) => {
    set((state) => {
      if (state.items.find((i) => i.id === item.id)) return state;
      return { items: [item, ...state.items] };
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
