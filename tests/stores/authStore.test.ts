import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    session: null,
    user: null,
    initialized: false,
    loading: false,
    handle: null,
    handleChecked: false,
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

  describe('handle state', () => {
    it('should have handle: null and handleChecked: false in initial state', () => {
      const state = useAuthStore.getState();
      expect(state.handle).toBeNull();
      expect(state.handleChecked).toBe(false);
    });
  });

  describe('checkHandle', () => {
    it('should fetch handle from profiles and set handle + handleChecked', async () => {
      useAuthStore.setState({
        user: { id: 'u1' } as any,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: { handle: 'myhandle' },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await useAuthStore.getState().checkHandle();

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('handle, handle_changed_at');
      expect(mockEq).toHaveBeenCalledWith('id', 'u1');

      const state = useAuthStore.getState();
      expect(state.handle).toBe('myhandle');
      expect(state.handleChecked).toBe(true);
    });

    it('should set handle: null and handleChecked: true when profile has no handle', async () => {
      useAuthStore.setState({
        user: { id: 'u1' } as any,
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: { handle: null },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await useAuthStore.getState().checkHandle();

      const state = useAuthStore.getState();
      expect(state.handle).toBeNull();
      expect(state.handleChecked).toBe(true);
    });
  });

  describe('updateHandle', () => {
    it('should update profiles table and set handle in store on success', async () => {
      useAuthStore.setState({
        user: { id: 'u1' } as any,
      });

      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await useAuthStore.getState().updateHandle('newhandle');

      expect(result).toEqual({ success: true });
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ handle: 'newhandle' })
      );

      const state = useAuthStore.getState();
      expect(state.handle).toBe('newhandle');
    });

    it('should return error for uniqueness violation (23505)', async () => {
      useAuthStore.setState({
        user: { id: 'u1' } as any,
      });

      const mockEq = jest.fn().mockResolvedValue({
        error: { code: '23505', message: 'duplicate key' },
      });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await useAuthStore.getState().updateHandle('taken');

      expect(result).toEqual({ success: false, error: 'This handle was just taken' });
    });

    it('should return error when no user is authenticated', async () => {
      useAuthStore.setState({ user: null });

      const result = await useAuthStore.getState().updateHandle('newhandle');

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });
  });

  describe('setSession resets handle state', () => {
    it('should reset handle and handleChecked when session changes', () => {
      useAuthStore.setState({
        handle: 'oldhandle',
        handleChecked: true,
      });

      const mockSession = {
        user: { id: 'u2', email: 'new@test.com' },
        access_token: 'tok2',
      } as any;

      useAuthStore.getState().setSession(mockSession);

      const state = useAuthStore.getState();
      expect(state.handle).toBeNull();
      expect(state.handleChecked).toBe(false);
    });
  });
});
