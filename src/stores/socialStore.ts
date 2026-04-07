import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  KitchenProfile,
  KitchenProfileUpdate,
  KitchenProfileWithRecipeCount,
} from '../types/database';
import { getErrorMessage } from '../lib/errors';

interface SocialState {
  // Profile being viewed (another kitchen's profile)
  viewedProfile: KitchenProfileWithRecipeCount | null;
  // Current user's kitchen profile (for active household)
  myKitchenProfile: KitchenProfile | null;
  // Search
  searchResults: KitchenProfile[];
  searchLoading: boolean;
  // Follow state
  isFollowing: boolean;
  followLoading: boolean;
  // General
  loading: boolean;
  error: string | null;

  // Actions
  fetchKitchenProfile: (kitchenId: string) => Promise<void>;
  fetchMyKitchenProfile: (householdId: string) => Promise<void>;
  getOrCreateKitchenProfile: (
    householdId: string,
    householdName: string
  ) => Promise<KitchenProfile | null>;
  updateKitchenProfile: (
    kitchenId: string,
    updates: KitchenProfileUpdate
  ) => Promise<void>;
  searchKitchens: (query: string) => Promise<void>;
  checkIsFollowing: (myKitchenId: string, targetKitchenId: string) => Promise<void>;
  followKitchen: (myKitchenId: string, targetKitchenId: string) => Promise<void>;
  unfollowKitchen: (myKitchenId: string, targetKitchenId: string) => Promise<void>;
  clearFollowState: () => void;
  clearSearch: () => void;
  clearViewedProfile: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  viewedProfile: null,
  myKitchenProfile: null,
  searchResults: [],
  searchLoading: false,
  isFollowing: false,
  followLoading: false,
  loading: false,
  error: null,

  fetchKitchenProfile: async (kitchenId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('id', kitchenId)
        .single();

      if (error) throw error;

      if (data) {
        // Get recipe count from recipes table
        const { count } = await supabase
          .from('recipes')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', data.household_id);

        set({
          viewedProfile: { ...data, recipe_count: count ?? 0 },
          loading: false,
        });
      } else {
        set({ viewedProfile: null, loading: false });
      }
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  fetchMyKitchenProfile: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('household_id', householdId)
        .maybeSingle();

      if (error) throw error;

      set({ myKitchenProfile: data, loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  getOrCreateKitchenProfile: async (
    householdId: string,
    householdName: string
  ) => {
    set({ loading: true, error: null });
    try {
      // First try to fetch existing profile
      const { data: existing, error: fetchError } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('household_id', householdId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        set({ myKitchenProfile: existing, loading: false });
        return existing;
      }

      // No profile exists -- create one lazily from household name
      const { data: created, error: createError } = await supabase
        .from('kitchen_profiles')
        .insert({ household_id: householdId, display_name: householdName })
        .select()
        .single();

      if (createError) throw createError;

      set({ myKitchenProfile: created, loading: false });
      return created;
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
      return null;
    }
  },

  updateKitchenProfile: async (
    kitchenId: string,
    updates: KitchenProfileUpdate
  ) => {
    set({ loading: true, error: null });
    try {
      const { error: updateError } = await supabase
        .from('kitchen_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', kitchenId);

      if (updateError) throw updateError;

      // Re-fetch to update local state
      const { data, error: fetchError } = await supabase
        .from('kitchen_profiles')
        .select('*')
        .eq('id', kitchenId)
        .single();

      if (fetchError) throw fetchError;

      set({ myKitchenProfile: data, loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  searchKitchens: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchLoading: false });
      return;
    }

    set({ searchLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('kitchen_profiles')
        .select('id, display_name, bio, avatar_url, follower_count')
        .eq('is_searchable', true)
        .ilike('display_name', `%${query}%`)
        .limit(20);

      if (error) throw error;

      set({
        searchResults: (data ?? []) as KitchenProfile[],
        searchLoading: false,
      });
    } catch (error: unknown) {
      set({ searchLoading: false, error: getErrorMessage(error) });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchLoading: false });
  },

  checkIsFollowing: async (myKitchenId: string, targetKitchenId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_kitchen_id', myKitchenId)
        .eq('following_kitchen_id', targetKitchenId)
        .maybeSingle();

      if (error) throw error;
      set({ isFollowing: !!data });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
    }
  },

  followKitchen: async (myKitchenId: string, targetKitchenId: string) => {
    if (get().followLoading) return;
    set({ followLoading: true });

    // Optimistic: set following state and increment counter
    set((state) => ({
      isFollowing: true,
      viewedProfile: state.viewedProfile
        ? { ...state.viewedProfile, follower_count: state.viewedProfile.follower_count + 1 }
        : state.viewedProfile,
    }));

    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_kitchen_id: myKitchenId, following_kitchen_id: targetKitchenId });

      if (error) throw error;
      set({ followLoading: false });
    } catch (error: unknown) {
      // Rollback optimistic update
      set((state) => ({
        isFollowing: false,
        followLoading: false,
        error: getErrorMessage(error),
        viewedProfile: state.viewedProfile
          ? { ...state.viewedProfile, follower_count: Math.max(state.viewedProfile.follower_count - 1, 0) }
          : state.viewedProfile,
      }));
    }
  },

  unfollowKitchen: async (myKitchenId: string, targetKitchenId: string) => {
    if (get().followLoading) return;
    set({ followLoading: true });

    // Optimistic: unset following state and decrement counter
    set((state) => ({
      isFollowing: false,
      viewedProfile: state.viewedProfile
        ? { ...state.viewedProfile, follower_count: Math.max(state.viewedProfile.follower_count - 1, 0) }
        : state.viewedProfile,
    }));

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_kitchen_id', myKitchenId)
        .eq('following_kitchen_id', targetKitchenId);

      if (error) throw error;
      set({ followLoading: false });
    } catch (error: unknown) {
      // Rollback optimistic update
      set((state) => ({
        isFollowing: true,
        followLoading: false,
        error: getErrorMessage(error),
        viewedProfile: state.viewedProfile
          ? { ...state.viewedProfile, follower_count: state.viewedProfile.follower_count + 1 }
          : state.viewedProfile,
      }));
    }
  },

  clearFollowState: () => {
    set({ isFollowing: false, followLoading: false });
  },

  clearViewedProfile: () => {
    set({ viewedProfile: null, isFollowing: false, followLoading: false });
  },
}));
