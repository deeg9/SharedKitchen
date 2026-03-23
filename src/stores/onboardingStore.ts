import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'mise_onboarding_completed';

export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5;

interface OnboardingState {
  currentStep: OnboardingStep;
  completed: boolean;
  initialized: boolean;
  householdId: string | null;
  addedRecipeIds: string[];

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  setHouseholdId: (id: string) => void;
  addRecipeId: (id: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 0,
  completed: false,
  initialized: false,
  householdId: null,
  addedRecipeIds: [],

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 5) {
      set({ currentStep: (currentStep + 1) as OnboardingStep });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: (currentStep - 1) as OnboardingStep });
    }
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      set({ completed: true });
    } catch (error) {
      console.error('Failed to persist onboarding completion:', error);
      // Still mark as completed in memory even if persistence fails
      set({ completed: true });
    }
  },

  checkOnboardingStatus: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ completed: value === 'true', initialized: true });
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      set({ initialized: true });
    }
  },

  setHouseholdId: (id: string) => {
    set({ householdId: id });
  },

  addRecipeId: (id: string) => {
    set((state) => ({
      addedRecipeIds: [...state.addedRecipeIds, id],
    }));
  },

  reset: () => {
    set({
      currentStep: 0,
      completed: false,
      initialized: false,
      householdId: null,
      addedRecipeIds: [],
    });
  },
}));
