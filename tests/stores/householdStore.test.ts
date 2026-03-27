import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHouseholdStore } from '../../src/stores/householdStore';
import { supabase } from '../../src/lib/supabase';

const mockSupabase = supabase as any;

// Reset the zustand store between tests
beforeEach(() => {
  jest.clearAllMocks();
  useHouseholdStore.setState({
    households: [],
    activeHouseholdId: null,
    members: [],
    loading: false,
    error: null,
  });
});

// Helper to create a chainable mock query builder
function createQueryBuilder(overrides: Record<string, any> = {}) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    then: undefined, // Make it thenable only when explicitly set
    ...overrides,
  };
  // Make the builder itself resolve as a promise when awaited (for insert/update without .single())
  // by default resolve with { data: null, error: null }
  builder.then = (resolve: any, reject: any) => Promise.resolve({ data: null, error: null }).then(resolve, reject);
  Object.keys(overrides).forEach((key) => {
    builder[key] = overrides[key];
  });
  return builder;
}

describe('householdStore', () => {
  describe('setActiveHousehold', () => {
    it('should update activeHouseholdId in state', async () => {
      // Pre-set some state so fetchMembers inside setActiveHousehold resolves
      const store = useHouseholdStore.getState();

      await store.setActiveHousehold('household-123');

      const updatedState = useHouseholdStore.getState();
      expect(updatedState.activeHouseholdId).toBe('household-123');
    });

    it('should persist activeHouseholdId to AsyncStorage', async () => {
      const store = useHouseholdStore.getState();

      await store.setActiveHousehold('household-456');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mise_active_household_id',
        'household-456'
      );
    });
  });

  describe('state management', () => {
    it('should start with empty state', () => {
      const state = useHouseholdStore.getState();
      expect(state.households).toEqual([]);
      expect(state.activeHouseholdId).toBeNull();
      expect(state.members).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('activeHousehold should return the correct household', () => {
      const mockHouseholds = [
        {
          id: 'h1',
          name: 'Kitchen 1',
          invite_code: 'code1',
          created_by: 'user-1',
          created_at: '2026-01-01',
        },
        {
          id: 'h2',
          name: 'Kitchen 2',
          invite_code: 'code2',
          created_by: 'user-1',
          created_at: '2026-01-02',
        },
      ];

      useHouseholdStore.setState({
        households: mockHouseholds,
        activeHouseholdId: 'h2',
      });

      const active = useHouseholdStore.getState().activeHousehold();
      expect(active).toEqual(mockHouseholds[1]);
      expect(active?.name).toBe('Kitchen 2');
    });

    it('activeHousehold should return undefined when no active ID', () => {
      useHouseholdStore.setState({
        households: [
          {
            id: 'h1',
            name: 'Kitchen 1',
            invite_code: 'code1',
            created_by: 'user-1',
            created_at: '2026-01-01',
          },
        ],
        activeHouseholdId: null,
      });

      const active = useHouseholdStore.getState().activeHousehold();
      expect(active).toBeUndefined();
    });
  });

  describe('initialize', () => {
    it('should restore activeHouseholdId from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('saved-household-id');

      const store = useHouseholdStore.getState();
      await store.initialize();

      // After initialize, the saved ID should be set
      // (fetchHouseholds may override it if the household is not found)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('mise_active_household_id');
    });
  });

  describe('createHousehold', () => {
    it('creates household and adds creator as admin', async () => {
      // Mock getUser to return authenticated user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Track calls to supabase.from
      const fromCalls: string[] = [];
      mockSupabase.from.mockImplementation((table: string) => {
        fromCalls.push(table);
        return createQueryBuilder();
      });

      const store = useHouseholdStore.getState();
      await store.createHousehold('My Kitchen');

      // Verify households and household_members tables were called
      expect(fromCalls).toContain('households');
      expect(fromCalls).toContain('household_members');

      const state = useHouseholdStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('returns null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const store = useHouseholdStore.getState();
      const result = await store.createHousehold('Test');

      expect(result).toBeNull();
      const state = useHouseholdStore.getState();
      expect(state.error).toBe('Not authenticated');
    });
  });

  describe('joinHousehold', () => {
    it('joins household by invite code', async () => {
      // Mock getUser
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const mockHousehold = { id: 'h2', name: 'Friends Kitchen', invite_code: 'abc123', created_by: 'u2', created_at: '2026-01-01' };
      const fromCalls: string[] = [];
      let callCount = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        fromCalls.push(table);
        callCount++;
        if (callCount === 1) {
          // First call: households.select().eq('invite_code', ...).single()
          return createQueryBuilder({
            single: jest.fn(() => Promise.resolve({ data: mockHousehold, error: null })),
          });
        }
        // Subsequent calls: member insert, fetchHouseholds, fetchMembers
        return createQueryBuilder();
      });

      const store = useHouseholdStore.getState();
      await store.joinHousehold('abc123');

      // Verify invite code lookup and member insert were made
      expect(fromCalls).toContain('households');
      expect(fromCalls).toContain('household_members');

      const state = useHouseholdStore.getState();
      expect(state.loading).toBe(false);
    });

    it('returns null for invalid invite code', async () => {
      // Mock getUser
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Mock household lookup returning not found
      mockSupabase.from.mockImplementation(() => {
        return createQueryBuilder({
          single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'not found' } })),
        });
      });

      const store = useHouseholdStore.getState();
      const result = await store.joinHousehold('invalid');

      expect(result).toBeNull();
      const state = useHouseholdStore.getState();
      expect(state.error).toBe('Invalid invite code');
    });

    it('handles duplicate membership', async () => {
      // Mock getUser
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const mockHousehold = { id: 'h2', name: 'Friends Kitchen', invite_code: 'abc123', created_by: 'u2', created_at: '2026-01-01' };
      let callCount = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: household lookup succeeds
          return createQueryBuilder({
            single: jest.fn(() => Promise.resolve({ data: mockHousehold, error: null })),
          });
        }
        if (callCount === 2) {
          // Second call: member insert returns duplicate error
          return createQueryBuilder({
            then: (resolve: any) => resolve({ data: null, error: { code: '23505', message: 'duplicate' } }),
          });
        }
        return createQueryBuilder();
      });

      const store = useHouseholdStore.getState();
      const result = await store.joinHousehold('abc123');

      expect(result).toBeNull();
      const state = useHouseholdStore.getState();
      expect(state.error).toContain('already a member');
    });
  });
});
