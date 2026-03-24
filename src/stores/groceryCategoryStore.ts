import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mise_grocery_categories';

/** The 5 DB-level section values (immutable — CHECK constraint) */
export const DB_SECTIONS = ['Proteins', 'Produce', 'Dairy & Eggs', 'Pantry', 'Other'] as const;
export type DbSection = typeof DB_SECTIONS[number];

export interface GroceryCategory {
  label: string;
  dbValue: DbSection;
}

const DEFAULT_CATEGORIES: GroceryCategory[] = [
  { label: 'Produce', dbValue: 'Produce' },
  { label: 'Dairy', dbValue: 'Dairy & Eggs' },
  { label: 'Meat', dbValue: 'Proteins' },
  { label: 'Pantry', dbValue: 'Pantry' },
  { label: 'Frozen', dbValue: 'Other' },
  { label: 'Household', dbValue: 'Other' },
];

interface CategoryState {
  categories: GroceryCategory[];
  initialized: boolean;

  initialize: () => Promise<void>;
  addCategory: (label: string, dbValue: DbSection) => Promise<void>;
  removeCategory: (label: string) => Promise<void>;
  renameCategory: (oldLabel: string, newLabel: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

async function persist(categories: GroceryCategory[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export const useGroceryCategoryStore = create<CategoryState>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  initialized: false,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GroceryCategory[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ categories: parsed, initialized: true });
          return;
        }
      }
    } catch {}
    set({ initialized: true });
  },

  addCategory: async (label, dbValue) => {
    const { categories } = get();
    if (categories.find((c) => c.label === label)) return;
    const updated = [...categories, { label, dbValue }];
    set({ categories: updated });
    await persist(updated);
  },

  removeCategory: async (label) => {
    const { categories } = get();
    const updated = categories.filter((c) => c.label !== label);
    if (updated.length === 0) return; // keep at least one
    set({ categories: updated });
    await persist(updated);
  },

  renameCategory: async (oldLabel, newLabel) => {
    if (!newLabel.trim()) return;
    const { categories } = get();
    const updated = categories.map((c) =>
      c.label === oldLabel ? { ...c, label: newLabel.trim() } : c
    );
    set({ categories: updated });
    await persist(updated);
  },

  resetToDefaults: async () => {
    set({ categories: DEFAULT_CATEGORIES });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
