import { supabase } from '../../src/lib/supabase';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';

// Helper to build a chainable query mock ending in maybeSingle
function mockQuery(result: { data: any; error: any }) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
  (supabase.from as jest.Mock).mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptionStore.setState({
    status: 'free',
    stripeCustomerId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    loading: true,
  });
});

describe('subscriptionStore', () => {
  describe('initialize', () => {
    it('sets state from active subscription row', async () => {
      mockQuery({
        data: {
          status: 'active',
          stripe_customer_id: 'cus_123',
          current_period_end: '2026-04-01',
          cancel_at_period_end: false,
        },
        error: null,
      });

      await useSubscriptionStore.getState().initialize('user-1');

      const state = useSubscriptionStore.getState();
      expect(state.status).toBe('active');
      expect(state.stripeCustomerId).toBe('cus_123');
      expect(state.currentPeriodEnd).toBe('2026-04-01');
      expect(state.cancelAtPeriodEnd).toBe(false);
      expect(state.loading).toBe(false);
    });

    it('falls back to free when no subscription row exists', async () => {
      mockQuery({ data: null, error: null });

      await useSubscriptionStore.getState().initialize('user-1');

      const state = useSubscriptionStore.getState();
      expect(state.status).toBe('free');
      expect(state.loading).toBe(false);
    });

    it('falls back to free on DB error without crashing', async () => {
      mockQuery({ data: null, error: { message: 'DB down' } });

      await useSubscriptionStore.getState().initialize('user-1');

      const state = useSubscriptionStore.getState();
      expect(state.status).toBe('free');
      expect(state.loading).toBe(false);
    });

    it('handles null fields in subscription row without crashing', async () => {
      mockQuery({
        data: {
          status: 'active',
          stripe_customer_id: null,
          current_period_end: null,
          cancel_at_period_end: null,
        },
        error: null,
      });

      await useSubscriptionStore.getState().initialize('user-1');

      const state = useSubscriptionStore.getState();
      expect(state.status).toBe('active');
      expect(state.stripeCustomerId).toBeNull();
      expect(state.currentPeriodEnd).toBeNull();
      expect(state.cancelAtPeriodEnd).toBe(false); // defaults via ??
      expect(state.loading).toBe(false);
    });
  });

  describe('loading state transitions', () => {
    it('loading is true initially and false after initialize resolves', async () => {
      mockQuery({ data: null, error: null });

      // loading starts true (set in beforeEach)
      expect(useSubscriptionStore.getState().loading).toBe(true);

      await useSubscriptionStore.getState().initialize('user-1');

      expect(useSubscriptionStore.getState().loading).toBe(false);
    });
  });

  describe('isPremium', () => {
    it('returns true for active status', () => {
      useSubscriptionStore.setState({ status: 'active' });
      expect(useSubscriptionStore.getState().isPremium()).toBe(true);
    });

    it('returns true for trialing status', () => {
      useSubscriptionStore.setState({ status: 'trialing' });
      expect(useSubscriptionStore.getState().isPremium()).toBe(true);
    });

    it('returns false for free status', () => {
      useSubscriptionStore.setState({ status: 'free' });
      expect(useSubscriptionStore.getState().isPremium()).toBe(false);
    });

    it('returns false for past_due status', () => {
      useSubscriptionStore.setState({ status: 'past_due' });
      expect(useSubscriptionStore.getState().isPremium()).toBe(false);
    });

    it('returns false for canceled status', () => {
      useSubscriptionStore.setState({ status: 'canceled' });
      expect(useSubscriptionStore.getState().isPremium()).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('returns true for premium feature when status is active', () => {
      useSubscriptionStore.setState({ status: 'active' });
      expect(useSubscriptionStore.getState().canAccess('analytics_dashboard')).toBe(true);
    });

    it('returns false for premium feature when status is free', () => {
      useSubscriptionStore.setState({ status: 'free' });
      expect(useSubscriptionStore.getState().canAccess('analytics_dashboard')).toBe(false);
    });

    it('returns true for non-premium feature when status is free', () => {
      useSubscriptionStore.setState({ status: 'free' });
      expect(useSubscriptionStore.getState().canAccess('basic_recipes')).toBe(true);
    });
  });

  describe('refreshSubscription', () => {
    it('re-fetches subscription data using stored userId', async () => {
      // First initialize to set currentUserId
      mockQuery({
        data: { status: 'active', stripe_customer_id: 'cus_1', current_period_end: '2026-04-01', cancel_at_period_end: false },
        error: null,
      });
      await useSubscriptionStore.getState().initialize('user-1');

      // Clear and set up new mock for refresh
      jest.clearAllMocks();
      mockQuery({
        data: { status: 'canceled', stripe_customer_id: 'cus_1', current_period_end: '2026-04-01', cancel_at_period_end: true },
        error: null,
      });

      await useSubscriptionStore.getState().refreshSubscription();

      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      const state = useSubscriptionStore.getState();
      expect(state.status).toBe('canceled');
      expect(state.cancelAtPeriodEnd).toBe(true);
    });
  });
});
