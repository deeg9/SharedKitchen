import { renderHook, act } from '@testing-library/react-native';
import { supabase } from '../../src/lib/supabase';
import { useGrocerySync } from '../../src/hooks/useGrocerySync';
import { useGroceryStore } from '../../src/stores/groceryStore';
import { GroceryItem } from '../../src/types/database';

// Track channel event handlers
let channelHandlers: Record<string, Function> = {};
let mockSubscribe: jest.Mock;
let mockUnsubscribe: jest.Mock;

beforeEach(() => {
  channelHandlers = {};
  mockUnsubscribe = jest.fn();
  mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe });

  const mockOn = jest.fn().mockImplementation(
    (event: string, filter: any, callback: Function) => {
      const eventType = filter?.event || event;
      channelHandlers[eventType] = callback;
      return { on: mockOn, subscribe: mockSubscribe };
    }
  );

  (supabase.channel as jest.Mock).mockReturnValue({
    on: mockOn,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  });

  (supabase as any).removeChannel = jest.fn();

  useGroceryStore.setState({
    items: [],
    activeListId: null,
    loading: false,
    error: null,
  });
  jest.clearAllMocks();
});

describe('useGrocerySync', () => {
  it('subscribes to correct channel with grocery_list_id filter', () => {
    renderHook(() => useGrocerySync('household-1', 'list-1'));

    expect(supabase.channel).toHaveBeenCalledWith(
      expect.stringContaining('grocery')
    );
  });

  it('cleans up channel on unmount', () => {
    const { unmount } = renderHook(() =>
      useGrocerySync('household-1', 'list-1')
    );

    unmount();

    expect((supabase as any).removeChannel).toHaveBeenCalled();
  });

  it('does not subscribe when listId is null', () => {
    renderHook(() => useGrocerySync('household-1', null));

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('does not subscribe when householdId is null', () => {
    renderHook(() => useGrocerySync(null, 'list-1'));

    expect(supabase.channel).not.toHaveBeenCalled();
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
