import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';

export interface Rsvp {
  user_id: string;
  status: 'eating' | 'skipped';
}

interface RsvpState {
  rsvps: Map<string, Rsvp[]>;
  loading: boolean;
  error: string | null;

  fetchRsvps: (mealPlanIds: string[]) => Promise<void>;
  toggleRsvp: (mealPlanId: string, userId: string) => Promise<void>;
  ensureDefaults: (mealPlanId: string, memberUserIds: string[]) => Promise<void>;
}

export const useRsvpStore = create<RsvpState>((set, get) => ({
  rsvps: new Map(),
  loading: false,
  error: null,

  fetchRsvps: async (mealPlanIds: string[]) => {
    if (mealPlanIds.length === 0) return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await (supabase as any)
        .from('meal_rsvps')
        .select('meal_plan_id, user_id, status')
        .in('meal_plan_id', mealPlanIds) as { data: { meal_plan_id: string; user_id: string; status: string }[] | null; error: any };

      if (error) throw error;

      const map = new Map<string, Rsvp[]>();
      for (const row of data ?? []) {
        const key = row.meal_plan_id;
        const existing = map.get(key) ?? [];
        existing.push({ user_id: row.user_id, status: row.status as 'eating' | 'skipped' });
        map.set(key, existing);
      }

      // Merge with existing rsvps (keep entries for meal plans not in this fetch)
      const current = get().rsvps;
      const merged = new Map(current);
      Array.from(map.entries()).forEach(([key, value]) => {
        merged.set(key, value);
      });

      set({ rsvps: merged, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  toggleRsvp: async (mealPlanId: string, userId: string) => {
    const current = get().rsvps;
    const planRsvps = current.get(mealPlanId) ?? [];
    const existing = planRsvps.find((r) => r.user_id === userId);
    const newStatus: 'eating' | 'skipped' =
      existing?.status === 'eating' ? 'skipped' : 'eating';

    // Optimistic update
    const updatedRsvps = planRsvps.map((r) =>
      r.user_id === userId ? { ...r, status: newStatus } : r
    );
    // If user wasn't in the list, add them
    if (!existing) {
      updatedRsvps.push({ user_id: userId, status: newStatus });
    }
    const optimisticMap = new Map(current);
    optimisticMap.set(mealPlanId, updatedRsvps);
    set({ rsvps: optimisticMap });

    try {
      const { error } = await (supabase as any)
        .from('meal_rsvps')
        .upsert(
          { meal_plan_id: mealPlanId, user_id: userId, status: newStatus },
          { onConflict: 'meal_plan_id,user_id' }
        );

      if (error) throw error;
    } catch (err) {
      // Revert on error
      const revertMap = new Map(get().rsvps);
      revertMap.set(mealPlanId, planRsvps);
      set({ rsvps: revertMap, error: getErrorMessage(err) });
    }
  },

  ensureDefaults: async (mealPlanId: string, memberUserIds: string[]) => {
    if (memberUserIds.length === 0) return;

    try {
      const rows = memberUserIds.map((userId) => ({
        meal_plan_id: mealPlanId,
        user_id: userId,
        status: 'eating' as const,
      }));

      // ON CONFLICT DO NOTHING — only inserts for members without an RSVP
      const { error } = await (supabase as any)
        .from('meal_rsvps')
        .upsert(rows, { onConflict: 'meal_plan_id,user_id', ignoreDuplicates: true });

      if (error) throw error;
    } catch (err) {
      // Non-critical — log but don't block
      console.warn('ensureDefaults failed:', getErrorMessage(err));
    }
  },
}));
