import { supabase } from '../../src/lib/supabase';
import { useGroceryStore } from '../../src/stores/groceryStore';
import { GroceryItem } from '../../src/types/database';

// Mock aggregateIngredients to return a predictable result
jest.mock('../../src/lib/grocery-utils', () => {
  const actual = jest.requireActual('../../src/lib/grocery-utils');
  return {
    ...actual,
    aggregateIngredients: jest.fn(() => [
      { name: 'Flour', quantity: '2 cups', section: 'Baking', estimated_price: 3.50, source_recipe_id: 'r-1', is_checked: false, is_manual: false },
    ]),
  };
});

// Reset store between tests
beforeEach(() => {
  useGroceryStore.setState({
    items: [],
    activeListId: null,
    loading: false,
    error: null,
  });
  jest.clearAllMocks();
});

describe('groceryStore', () => {
  describe('toggleItem', () => {
    it('optimistically updates state', async () => {
      const mockItem = makeGroceryItem({ id: 'item-1', is_checked: false });
      useGroceryStore.setState({ items: [mockItem] });

      // Mock supabase update to succeed
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue(
        Promise.resolve({ data: null, error: null })
      );
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });
      mockUpdate.mockReturnValue({ eq: mockEq });

      await useGroceryStore.getState().toggleItem('item-1', true, 'user-1');

      const state = useGroceryStore.getState();
      const item = state.items.find((i) => i.id === 'item-1');
      expect(item?.is_checked).toBe(true);
      expect(item?.checked_by).toBe('user-1');
      expect(item?.checked_at).toBeTruthy();
    });

    it('reverts on Supabase error', async () => {
      const mockItem = makeGroceryItem({ id: 'item-1', is_checked: false });
      useGroceryStore.setState({ items: [mockItem] });

      // Mock supabase update to fail
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue(
        Promise.resolve({ data: null, error: { message: 'Network error' } })
      );
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });
      mockUpdate.mockReturnValue({ eq: mockEq });

      await useGroceryStore.getState().toggleItem('item-1', true, 'user-1');

      const state = useGroceryStore.getState();
      const item = state.items.find((i) => i.id === 'item-1');
      expect(item?.is_checked).toBe(false);
      expect(item?.checked_by).toBeNull();
    });
  });

  describe('addManualItem', () => {
    it('inserts with is_manual=true', async () => {
      useGroceryStore.setState({ activeListId: 'list-1', items: [] });

      const newItem = makeGroceryItem({ id: 'new-1', is_manual: true, name: 'Apples' });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockReturnValue(
        Promise.resolve({ data: newItem, error: null })
      );
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await useGroceryStore.getState().addManualItem('list-1', 'Apples', '3', 'Produce');

      // Verify insert was called with is_manual: true
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ is_manual: true, name: 'Apples' })
      );

      const state = useGroceryStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Apples');
    });
  });

  describe('fetchGroceryList', () => {
    it('queries by household_id and week_start', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockReturnValue(
        Promise.resolve({
          data: { id: 'list-1', household_id: 'h-1', week_start: '2026-03-23' },
          error: null,
        })
      );
      const mockOrder = jest.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null })
      );

      // First call: grocery_lists.select
      // Second call: grocery_items.select
      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'grocery_lists') {
          return {
            select: mockSelect,
            eq: mockEq1,
            single: mockSingle,
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: mockOrder,
            }),
          }),
        };
      });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });

      await useGroceryStore.getState().fetchGroceryList('h-1', '2026-03-23');

      expect(supabase.from).toHaveBeenCalledWith('grocery_lists');
    });
  });

  describe('generateGroceryList', () => {
    it('creates list when none exists and populates items from recipe ingredients', async () => {
      const mockFrom = supabase.from as jest.Mock;
      let groceryListsCallCount = 0;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'grocery_lists') {
          groceryListsCallCount++;
          if (groceryListsCallCount === 1) {
            // First call: select existing list - returns not found
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116', message: 'Not found' },
                    }),
                  }),
                }),
              }),
            };
          }
          // Second call: insert new list
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'list-new' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'grocery_items') {
          // Could be insert or select
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [makeGroceryItem({ id: 'gi-1', name: 'Flour', grocery_list_id: 'list-new' })],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      await useGroceryStore.getState().generateGroceryList('h-1', '2026-03-23', [
        { id: 'r-1', ingredients: [{ name: 'Flour', amount: 2, unit: 'cups' }] } as any,
      ]);

      const state = useGroceryStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.activeListId).toBe('list-new');
    });

    it('sets error on list fetch failure (non-PGRST116)', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'grocery_lists') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST500', message: 'Server error' },
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await useGroceryStore.getState().generateGroceryList('h-1', '2026-03-23', []);

      const state = useGroceryStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  describe('removeItem', () => {
    it('optimistically removes item from state', async () => {
      const item1 = makeGroceryItem({ id: 'item-1', name: 'Apples' });
      const item2 = makeGroceryItem({ id: 'item-2', name: 'Bananas' });
      useGroceryStore.setState({ items: [item1, item2] });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await useGroceryStore.getState().removeItem('item-1');

      const state = useGroceryStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items.find((i) => i.id === 'item-1')).toBeUndefined();
    });

    it('reverts on delete failure', async () => {
      const item1 = makeGroceryItem({ id: 'item-1', name: 'Apples' });
      useGroceryStore.setState({ items: [item1] });

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      });

      await useGroceryStore.getState().removeItem('item-1');

      const state = useGroceryStore.getState();
      expect(state.items.find((i) => i.id === 'item-1')).toBeDefined();
      expect(state.error).toBeTruthy();
    });
  });

  describe('realtime helpers', () => {
    it('_addItem adds new item to state', () => {
      const item1 = makeGroceryItem({ id: 'item-1' });
      useGroceryStore.setState({ items: [item1] });

      useGroceryStore.getState()._addItem(makeGroceryItem({ id: 'item-2', name: 'Butter' }));

      expect(useGroceryStore.getState().items).toHaveLength(2);
    });

    it('_addItem skips duplicate ids', () => {
      const item1 = makeGroceryItem({ id: 'item-1' });
      useGroceryStore.setState({ items: [item1] });

      useGroceryStore.getState()._addItem(makeGroceryItem({ id: 'item-1' }));

      expect(useGroceryStore.getState().items).toHaveLength(1);
    });

    it('_updateItem replaces item by id', () => {
      const item1 = makeGroceryItem({ id: 'item-1', name: 'test item' });
      useGroceryStore.setState({ items: [item1] });

      useGroceryStore.getState()._updateItem(makeGroceryItem({ id: 'item-1', name: 'Updated' }));

      expect(useGroceryStore.getState().items[0].name).toBe('Updated');
    });

    it('_removeItem removes item by id', () => {
      const item1 = makeGroceryItem({ id: 'item-1' });
      const item2 = makeGroceryItem({ id: 'item-2' });
      useGroceryStore.setState({ items: [item1, item2] });

      useGroceryStore.getState()._removeItem('item-1');

      expect(useGroceryStore.getState().items).toHaveLength(1);
    });
  });
});

function makeGroceryItem(overrides: Partial<GroceryItem> = {}): GroceryItem {
  return {
    id: 'item-1',
    grocery_list_id: 'list-1',
    name: 'test item',
    quantity: '1 cup',
    estimated_price: null,
    section: 'Other',
    is_checked: false,
    checked_by: null,
    checked_at: null,
    is_manual: false,
    source_recipe_id: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
