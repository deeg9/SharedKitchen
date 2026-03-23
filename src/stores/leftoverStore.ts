import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Leftover } from '../types/database';

export type FreshnessStatus = 'Fresh' | 'Use Soon' | 'Expired' | 'Frozen';

export interface StatusBreakdown {
  fresh: number;
  useSoon: number;
  frozen: number;
  expired: number;
}

/**
 * Pure function to determine freshness status of a leftover item.
 * Exported for direct testing.
 */
export function getFreshnessStatus(leftover: Leftover): FreshnessStatus {
  if (leftover.status === 'frozen') return 'Frozen';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const useBy = new Date(leftover.use_by_date + 'T00:00:00');
  const diffMs = useBy.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 3) return 'Use Soon';
  return 'Fresh';
}

interface LeftoverState {
  leftovers: Leftover[];
  loading: boolean;
  error: string | null;

  // Computed
  statusBreakdown: () => StatusBreakdown;
  totalCount: () => number;

  // Actions
  fetchLeftovers: (householdId: string) => Promise<void>;
  addLeftover: (
    householdId: string,
    data: {
      name: string;
      date_made: string;
      use_by_date: string;
      portions: number;
      status: 'fresh' | 'frozen';
      notes: string | null;
    }
  ) => Promise<void>;
  updatePortions: (id: string, portions: number) => Promise<void>;
  deleteLeftover: (id: string) => Promise<void>;
}

export const useLeftoverStore = create<LeftoverState>((set, get) => ({
  leftovers: [],
  loading: false,
  error: null,

  statusBreakdown: () => {
    const { leftovers } = get();
    const breakdown: StatusBreakdown = { fresh: 0, useSoon: 0, frozen: 0, expired: 0 };

    leftovers.forEach((l) => {
      const status = getFreshnessStatus(l);
      switch (status) {
        case 'Fresh':
          breakdown.fresh++;
          break;
        case 'Use Soon':
          breakdown.useSoon++;
          break;
        case 'Frozen':
          breakdown.frozen++;
          break;
        case 'Expired':
          breakdown.expired++;
          break;
      }
    });

    return breakdown;
  },

  totalCount: () => get().leftovers.length,

  fetchLeftovers: async (householdId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('leftovers')
        .select('*')
        .eq('household_id', householdId)
        .order('use_by_date', { ascending: true });

      if (error) throw error;

      set({ leftovers: (data as Leftover[]) ?? [], loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message ?? 'Failed to fetch leftovers' });
    }
  },

  addLeftover: async (householdId, data) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: leftover, error } = await supabase
        .from('leftovers')
        .insert({
          household_id: householdId,
          name: data.name,
          date_made: data.date_made,
          use_by_date: data.use_by_date,
          portions: data.portions,
          status: data.status,
          notes: data.notes,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        leftovers: [...state.leftovers, leftover as Leftover],
      }));
    } catch (error: any) {
      set({ error: error.message ?? 'Failed to add leftover' });
    }
  },

  updatePortions: async (id, portions) => {
    const { leftovers } = get();
    const original = leftovers.find((l) => l.id === id);
    if (!original) return;

    // Optimistic update
    set({
      leftovers: leftovers.map((l) =>
        l.id === id ? { ...l, portions } : l
      ),
    });

    const { error } = await supabase
      .from('leftovers')
      .update({ portions })
      .eq('id', id);

    if (error) {
      // Revert on error
      set({
        leftovers: get().leftovers.map((l) =>
          l.id === id ? original : l
        ),
        error: error.message,
      });
    }
  },

  deleteLeftover: async (id) => {
    const { leftovers } = get();
    const original = leftovers.find((l) => l.id === id);

    // Optimistic remove
    set({ leftovers: leftovers.filter((l) => l.id !== id) });

    const { error } = await supabase
      .from('leftovers')
      .delete()
      .eq('id', id);

    if (error && original) {
      // Revert
      set((state) => ({
        leftovers: [...state.leftovers, original],
        error: error.message,
      }));
    }
  },
}));
