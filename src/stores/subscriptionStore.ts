import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'canceled' | 'trialing';

// Preserve the same PREMIUM_FEATURES constant for canAccess() compatibility
export const PREMIUM_FEATURES = [
  'analytics_dashboard',
  'advanced_suggestions',
  'unlimited_recipes',
  'export_grocery_list',
] as const;

interface SubscriptionState {
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;

  isPremium: () => boolean;
  canAccess: (feature: string) => boolean;
  initialize: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

let currentUserId: string | null = null;

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: 'free',
  stripeCustomerId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  loading: true,

  isPremium: () => {
    const { status } = get();
    return status === 'active' || status === 'trialing';
  },

  canAccess: (feature: string) => {
    if (get().isPremium()) return true;
    // Non-premium features are always accessible
    return !(PREMIUM_FEATURES as readonly string[]).includes(feature);
  },

  initialize: async (userId: string) => {
    currentUserId = userId;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, stripe_customer_id, current_period_end, cancel_at_period_end')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        set({ status: 'free', loading: false });
        return;
      }

      if (data) {
        set({
          status: data.status as SubscriptionStatus,
          stripeCustomerId: data.stripe_customer_id,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
          loading: false,
        });
      } else {
        // No subscription row yet -- user is free tier
        set({ status: 'free', loading: false });
      }
    } catch {
      set({ status: 'free', loading: false });
    }
  },

  refreshSubscription: async () => {
    if (!currentUserId) return;
    await get().initialize(currentUserId);
  },
}));
