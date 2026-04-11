import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { validateHandle } from '../lib/handle-utils';

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  handle: string | null;
  handleChangedAt: string | null;
  handleChecked: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<void>;
  checkHandle: () => Promise<void>;
  updateHandle: (handle: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  initialized: false,
  loading: false,
  handle: null,
  handleChangedAt: null,
  handleChecked: false,

  setSession: (session) => {
    const currentUserId = get().user?.id;
    const newUserId = session?.user?.id;
    const userChanged = currentUserId !== newUserId;
    set({
      session,
      user: session?.user ?? null,
      ...(userChanged ? { handle: null, handleChangedAt: null, handleChecked: false } : {}),
    });
  },

  setInitialized: (initialized) => set({ initialized }),

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      loading: false,
      handle: null,
      handleChangedAt: null,
      handleChecked: false,
    });
  },

  checkHandle: async () => {
    const userId = get().user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from('profiles')
      .select('handle, handle_changed_at')
      .eq('id', userId)
      .single();

    set({
      handle: data?.handle ?? null,
      handleChangedAt: data?.handle_changed_at ?? null,
      handleChecked: true,
    });
  },

  updateHandle: async (handle: string) => {
    const userId = get().user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const validation = validateHandle(handle);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { handleChangedAt } = get();
    if (handleChangedAt) {
      const lastChanged = new Date(handleChangedAt);
      const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        const daysLeft = Math.ceil(30 - daysSince);
        return {
          success: false,
          error: `You can change your handle again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        };
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ handle, handle_changed_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'This handle was just taken' };
      }
      return { success: false, error: error.message };
    }

    const now = new Date().toISOString();
    set({ handle, handleChangedAt: now });
    return { success: true };
  },
}));
