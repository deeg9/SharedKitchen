import { create } from 'zustand';
import { FoodSearchResult, FoodItem } from '../types/food';
import { searchFoods, getFoodDetail, lookupBarcode as lookupBarcodeApi, SearchLimitError } from '../lib/food-api';

interface FoodStoreState {
  query: string;
  results: FoodSearchResult[];
  loading: boolean;
  error: string | null;
  rateLimited: boolean;
  expandedItemId: string | null;
  expandedItemDetail: FoodItem | null;
  detailLoading: boolean;

  // Barcode scanning state
  scannedProduct: FoodItem | null;
  scanLoading: boolean;
  scanError: string | null;
  scanNotFound: boolean;

  setQuery: (query: string) => void;
  searchFoods: (query: string) => Promise<void>;
  clearResults: () => void;
  toggleExpanded: (itemId: string) => Promise<void>;
  reset: () => void;

  // Barcode scanning actions
  lookupBarcode: (barcode: string) => Promise<void>;
  clearScan: () => void;
}

const initialState = {
  query: '',
  results: [],
  loading: false,
  error: null,
  rateLimited: false,
  expandedItemId: null,
  expandedItemDetail: null,
  detailLoading: false,
  scannedProduct: null,
  scanLoading: false,
  scanError: null,
  scanNotFound: false,
};

export const useFoodStore = create<FoodStoreState>((set, get) => ({
  ...initialState,

  setQuery: (query: string) => {
    set({ query });
  },

  searchFoods: async (query: string) => {
    set({ loading: true, error: null, rateLimited: false });
    try {
      const results = await searchFoods(query);
      set({ results, loading: false });
    } catch (err: unknown) {
      if (err instanceof SearchLimitError) {
        set({
          loading: false,
          rateLimited: true,
          error: `Daily search limit reached (${err.used}/${err.limit})`,
        });
      } else {
        set({
          loading: false,
          error: err instanceof Error ? err.message : 'Food search failed',
        });
      }
    }
  },

  clearResults: () => {
    set({
      results: [],
      error: null,
      rateLimited: false,
      expandedItemId: null,
      expandedItemDetail: null,
      detailLoading: false,
    });
  },

  toggleExpanded: async (itemId: string) => {
    const { expandedItemId } = get();

    // Collapse if already expanded
    if (expandedItemId === itemId) {
      set({ expandedItemId: null, expandedItemDetail: null, detailLoading: false });
      return;
    }

    // Expand new item
    set({ expandedItemId: itemId, expandedItemDetail: null, detailLoading: true });
    const detail = await getFoodDetail(itemId);
    set({ expandedItemDetail: detail, detailLoading: false });
  },

  reset: () => {
    set(initialState);
  },

  lookupBarcode: async (barcode: string) => {
    set({ scanLoading: true, scanError: null, scanNotFound: false, scannedProduct: null });
    try {
      const result = await lookupBarcodeApi(barcode);
      if (result.found && result.food) {
        set({ scannedProduct: result.food, scanLoading: false });
      } else {
        set({ scanNotFound: true, scanLoading: false });
      }
    } catch (err: unknown) {
      if (err instanceof SearchLimitError) {
        set({
          scanLoading: false,
          rateLimited: true,
          scanError: `Daily search limit reached (${err.used}/${err.limit})`,
        });
      } else {
        set({
          scanLoading: false,
          scanError: err instanceof Error ? err.message : 'Barcode lookup failed',
        });
      }
    }
  },

  clearScan: () => {
    set({
      scannedProduct: null,
      scanLoading: false,
      scanError: null,
      scanNotFound: false,
    });
  },
}));
