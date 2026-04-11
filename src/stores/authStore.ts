import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  handle: string | null;
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
  handleChecked: false,

  setSession: (session) => {
    const currentUserId = get().user?.id;
    const newUserId = session?.user?.id;
    const userChanged = currentUserId !== newUserId;
    set({
      session,
      user: session?.user ?? null,
      ...(userChanged ? { handle: null, handleChecked: false } : {}),
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
      handleChecked: false,
    });
  },

  checkHandle: async () => {
    const userId = get().user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', userId)
      .single();

    set({ handle: data?.handle ?? null, handleChecked: true });
  },

  updateHandle: async (handle: string) => {
    const userId = get().user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

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

    set({ handle });
    return { success: true };
  },
}));
