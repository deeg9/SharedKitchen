import { supabase } from '../../src/lib/supabase';
import { useLeftoverStore, getFreshnessStatus } from '../../src/stores/leftoverStore';
import { Leftover } from '../../src/types/database';

// Reset store state between tests
beforeEach(() => {
  useLeftoverStore.setState({
    leftovers: [],
    loading: false,
    error: null,
  });
  jest.clearAllMocks();
});

function makeLeftover(overrides: Partial<Leftover> = {}): Leftover {
  return {
    id: 'l1',
    household_id: 'h1',
    name: 'Pasta',
    date_made: '2026-03-20',
    use_by_date: '2026-03-28',
    portions: 3,
    status: 'fresh',
    notes: null,
    created_by: 'user1',
    created_at: '2026-03-20T12:00:00Z',
    ...overrides,
  };
}

describe('leftoverStore', () => {
  describe('fetchLeftovers', () => {
    it('loads leftovers for household and sets state', async () => {
      const mockLeftovers = [
        makeLeftover({ id: 'l1', name: 'Pasta' }),
        makeLeftover({ id: 'l2', name: 'Soup' }),
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockLeftovers, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useLeftoverStore.getState().fetchLeftovers('h1');

      expect(supabase.from).toHaveBeenCalledWith('leftovers');
      expect(mockChain.eq).toHaveBeenCalledWith('household_id', 'h1');
      expect(useLeftoverStore.getState().leftovers).toEqual(mockLeftovers);
      expect(useLeftoverStore.getState().loading).toBe(false);
    });
  });

  describe('addLeftover', () => {
    it('inserts row and appends to state', async () => {
      const newLeftover = makeLeftover({ id: 'l3', name: 'Chili' });

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newLeftover, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      (supabase.auth as any).getUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      await useLeftoverStore.getState().addLeftover('h1', {
        name: 'Chili',
        date_made: '2026-03-20',
        use_by_date: '2026-03-25',
        portions: 4,
        status: 'fresh',
        notes: null,
      });

      expect(supabase.from).toHaveBeenCalledWith('leftovers');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          household_id: 'h1',
          name: 'Chili',
        })
      );
      expect(useLeftoverStore.getState().leftovers).toContainEqual(newLeftover);
    });
  });

  describe('updatePortions', () => {
    it('updates portions field for given leftover id', async () => {
      useLeftoverStore.setState({
        leftovers: [makeLeftover({ id: 'l1', portions: 3 })],
      });

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await useLeftoverStore.getState().updatePortions('l1', 2);

      expect(supabase.from).toHaveBeenCalledWith('leftovers');
      expect(mockChain.update).toHaveBeenCalledWith({ portions: 2 });
      // Optimistic update
      expect(useLeftoverStore.getState().leftovers[0].portions).toBe(2);
    });
  });

  describe('getFreshnessStatus', () => {
    it('returns Fresh when use_by > 3 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const leftover = makeLeftover({
        use_by_date: futureDate.toISOString().split('T')[0],
        status: 'fresh',
      });
      expect(getFreshnessStatus(leftover)).toBe('Fresh');
    });

    it('returns Use Soon when 0-3 days away', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 2);
      const leftover = makeLeftover({
        use_by_date: soonDate.toISOString().split('T')[0],
        status: 'fresh',
      });
      expect(getFreshnessStatus(leftover)).toBe('Use Soon');
    });

    it('returns Expired when past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const leftover = makeLeftover({
        use_by_date: pastDate.toISOString().split('T')[0],
        status: 'fresh',
      });
      expect(getFreshnessStatus(leftover)).toBe('Expired');
    });

    it('returns Frozen when status is frozen', () => {
      const leftover = makeLeftover({
        use_by_date: '2026-03-28',
        status: 'frozen',
      });
      expect(getFreshnessStatus(leftover)).toBe('Frozen');
    });
  });

  describe('statusBreakdown', () => {
    it('computes count per freshness status', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 2);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      useLeftoverStore.setState({
        leftovers: [
          makeLeftover({ id: 'l1', use_by_date: futureDate.toISOString().split('T')[0], status: 'fresh' }),
          makeLeftover({ id: 'l2', use_by_date: soonDate.toISOString().split('T')[0], status: 'fresh' }),
          makeLeftover({ id: 'l3', use_by_date: pastDate.toISOString().split('T')[0], status: 'fresh' }),
          makeLeftover({ id: 'l4', status: 'frozen' }),
        ],
      });

      const breakdown = useLeftoverStore.getState().statusBreakdown();
      expect(breakdown.fresh).toBe(1);
      expect(breakdown.useSoon).toBe(1);
      expect(breakdown.expired).toBe(1);
      expect(breakdown.frozen).toBe(1);
    });
  });
});
