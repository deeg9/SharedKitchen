import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    session: null,
    user: null,
    initialized: false,
    loading: false,
  });
});

describe('authStore', () => {
  describe('initial state', () => {
    it('should have null session, null user, initialized false, loading false', () => {
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.initialized).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('setSession', () => {
    it('should set session and extract user from valid session', () => {
      const mockSession = {
        user: { id: 'u1', email: 'test@test.com' },
        access_token: 'tok',
      } as any;

      useAuthStore.getState().setSession(mockSession);

      const state = useAuthStore.getState();
      expect(state.session).toBe(mockSession);
      expect(state.user).toEqual({ id: 'u1', email: 'test@test.com' });
    });

    it('should clear session and user when called with null', () => {
      // Pre-set a session
      useAuthStore.setState({
        session: { user: { id: 'u1' }, access_token: 'tok' } as any,
        user: { id: 'u1' } as any,
      });

      useAuthStore.getState().setSession(null);

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
    });
  });

  describe('setInitialized', () => {
    it('should set initialized to true', () => {
      useAuthStore.getState().setInitialized(true);
      expect(useAuthStore.getState().initialized).toBe(true);
    });

    it('should set initialized to false', () => {
      useAuthStore.setState({ initialized: true });
      useAuthStore.getState().setInitialized(false);
      expect(useAuthStore.getState().initialized).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should clear session, user, and loading; call supabase.auth.signOut', async () => {
      // Pre-set state with a session
      useAuthStore.setState({
        session: { user: { id: 'u1' }, access_token: 'tok' } as any,
        user: { id: 'u1' } as any,
        loading: false,
      });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });
});
