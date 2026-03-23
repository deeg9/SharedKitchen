import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mise_premium_tier';

export type PremiumTier = 'free' | 'premium';

export const PREMIUM_FEATURES = [
  'analytics_dashboard',
  'advanced_suggestions',
  'unlimited_recipes',
  'export_grocery_list',
] as const;

interface PremiumState {
  tier: PremiumTier;
  isPremium: () => boolean;
  initialize: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  downgradeToFree: () => Promise<void>;
  canAccess: (feature: string) => boolean;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  tier: 'free',

  isPremium: () => get().tier === 'premium',

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'premium' || stored === 'free') {
        set({ tier: stored });
      }
    } catch {
      // Default to free on error
    }
  },

  upgradeToPremium: async () => {
    set({ tier: 'premium' });
    await AsyncStorage.setItem(STORAGE_KEY, 'premium');
  },

  downgradeToFree: async () => {
    set({ tier: 'free' });
    await AsyncStorage.setItem(STORAGE_KEY, 'free');
  },

  canAccess: (feature: string) => {
    if (get().tier === 'premium') return true;
    return !(PREMIUM_FEATURES as readonly string[]).includes(feature);
  },
}));
