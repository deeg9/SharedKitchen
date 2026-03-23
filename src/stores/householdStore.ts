import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'];

export interface HouseholdMemberWithProfile extends HouseholdMember {
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const ACTIVE_HOUSEHOLD_KEY = 'mise_active_household_id';

interface HouseholdState {
  households: Household[];
  activeHouseholdId: string | null;
  members: HouseholdMemberWithProfile[];
  loading: boolean;
  error: string | null;

  // Computed
  activeHousehold: () => Household | undefined;

  // Actions
  fetchHouseholds: () => Promise<void>;
  setActiveHousehold: (id: string) => Promise<void>;
  createHousehold: (name: string) => Promise<Household | null>;
  joinHousehold: (inviteCode: string) => Promise<Household | null>;
  fetchMembers: (householdId: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  households: [],
  activeHouseholdId: null,
  members: [],
  loading: false,
  error: null,

  activeHousehold: () => {
    const { households, activeHouseholdId } = get();
    return households.find((h) => h.id === activeHouseholdId);
  },

  initialize: async () => {
    try {
      const savedId = await AsyncStorage.getItem(ACTIVE_HOUSEHOLD_KEY);
      if (savedId) {
        set({ activeHouseholdId: savedId });
      }
      await get().fetchHouseholds();
    } catch (error) {
      console.error('Failed to initialize household store:', error);
    }
  },

  fetchHouseholds: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return;
      }

      // Get household IDs the user is a member of
      const { data: memberRows, error: memberError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberRows || memberRows.length === 0) {
        set({ households: [], loading: false });
        return;
      }

      const householdIds = memberRows.map((m) => m.household_id);

      const { data: households, error: householdError } = await supabase
        .from('households')
        .select('*')
        .in('id', householdIds);

      if (householdError) throw householdError;

      const state = get();
      set({ households: households ?? [], loading: false });

      // If no active household set, or active household not in list, set first one
      if (
        !state.activeHouseholdId ||
        !households?.find((h) => h.id === state.activeHouseholdId)
      ) {
        if (households && households.length > 0) {
          await get().setActiveHousehold(households[0].id);
        }
      } else {
        // Refresh members for the active household
        await get().fetchMembers(state.activeHouseholdId);
      }
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to fetch households' });
    }
  },

  setActiveHousehold: async (id: string) => {
    set({ activeHouseholdId: id });
    await AsyncStorage.setItem(ACTIVE_HOUSEHOLD_KEY, id);
    await get().fetchMembers(id);
  },

  createHousehold: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      // Insert the household
      const { data: household, error: createError } = await supabase
        .from('households')
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (createError) throw createError;
      if (!household) throw new Error('Failed to create household');

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      // Refresh list and set as active
      await get().fetchHouseholds();
      await get().setActiveHousehold(household.id);

      set({ loading: false });
      return household;
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to create household' });
      return null;
    }
  },

  joinHousehold: async (inviteCode: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      // Look up household by invite code
      const { data: household, error: lookupError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.trim().toLowerCase())
        .single();

      if (lookupError || !household) {
        set({ loading: false, error: 'Invalid invite code' });
        return null;
      }

      // Add user as member
      const { error: joinError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) {
        if (joinError.code === '23505') {
          // Unique constraint violation - already a member
          set({ loading: false, error: 'You are already a member of this household' });
          return null;
        }
        throw joinError;
      }

      // Refresh list and set as active
      await get().fetchHouseholds();
      await get().setActiveHousehold(household.id);

      set({ loading: false });
      return household;
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to join household' });
      return null;
    }
  },

  fetchMembers: async (householdId: string) => {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('*, profiles(id, display_name, avatar_url)')
        .eq('household_id', householdId);

      if (error) throw error;

      set({ members: (data as HouseholdMemberWithProfile[]) ?? [] });
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
    }
  },
}));
