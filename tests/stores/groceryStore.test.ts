import { supabase } from '../../src/lib/supabase';
import { useGroceryStore } from '../../src/stores/groceryStore';
import { GroceryItem } from '../../src/types/database';

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
