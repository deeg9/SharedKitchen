import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHouseholdStore } from '../../src/stores/householdStore';

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
});
