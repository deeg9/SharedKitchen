import { renderHook, act } from '@testing-library/react-native';
import { supabase } from '../../src/lib/supabase';
import { useActivityToast } from '../../src/hooks/useActivityToast';

// Track channel event handlers per channel
let groceryHandlers: Record<string, Function> = {};
let mealPlanHandlers: Record<string, Function> = {};
let channelCount = 0;
let mockSubscribes: jest.Mock[] = [];

const memberLookup = (userId: string) => {
  const members: Record<string, { display_name: string; avatar_url: string | null }> = {
    'user-1': { display_name: 'Alice', avatar_url: null },
    'user-2': { display_name: 'Bob', avatar_url: 'https://example.com/bob.jpg' },
  };
  return members[userId] || null;
};

beforeEach(() => {
  jest.clearAllMocks();
  groceryHandlers = {};
  mealPlanHandlers = {};
  channelCount = 0;
  mockSubscribes = [];

  (supabase.channel as jest.Mock).mockImplementation((name: string) => {
    const isGrocery = name.includes('grocery');
    const handlers = isGrocery ? groceryHandlers : mealPlanHandlers;

    const mockSubscribe = jest.fn().mockImplementation((callback?: Function) => {
      if (callback) callback('SUBSCRIBED');
      return { unsubscribe: jest.fn() };
    });
    mockSubscribes.push(mockSubscribe);

    const mockOn = jest.fn().mockImplementation(
      (event: string, filter: any, callback: Function) => {
        const key = `${filter?.event || '*'}:${filter?.table || event}`;
        handlers[key] = callback;
        return { on: mockOn, subscribe: mockSubscribe };
      }
    );

    channelCount++;
    return {
      on: mockOn,
      subscribe: mockSubscribe,
    };
  });

  (supabase as any).removeChannel = jest.fn();
});

describe('useActivityToast', () => {
  it('subscribes to postgres_changes on grocery_items table when groceryListId provided', () => {
    renderHook(() =>
      useActivityToast({
        groceryListId: 'list-1',
        householdId: null,
        currentUserId: 'user-1',
        memberLookup,
      })
    );

    expect(supabase.channel).toHaveBeenCalledWith(
      expect.stringContaining('grocery')
    );
  });

  it('subscribes to postgres_changes on meal_plans table when householdId provided', () => {
    renderHook(() =>
      useActivityToast({
        groceryListId: null,
        householdId: 'household-1',
        currentUserId: 'user-1',
        memberLookup,
      })
    );

    expect(supabase.channel).toHaveBeenCalledWith(
      expect.stringContaining('mealplan')
    );
  });

  it('does NOT enqueue toast when checked_by matches currentUserId (self-filter grocery)', () => {
    const { result } = renderHook(() =>
      useActivityToast({
        groceryListId: 'list-1',
        householdId: null,
        currentUserId: 'user-1',
        memberLookup,
      })
    );

    // Simulate grocery UPDATE where checked_by is current user
    const handler = groceryHandlers['UPDATE:grocery_items'];
    expect(handler).toBeDefined();

    act(() => {
      handler({
        new: { id: 'item-1', name: 'Milk', is_checked: true, checked_by: 'user-1' },
        old: { id: 'item-1', name: 'Milk', is_checked: false, checked_by: null },
      });
    });

    expect(result.current.currentToast).toBeNull();
  });

  it('does NOT enqueue toast when created_by matches currentUserId (self-filter meal plan)', () => {
    const { result } = renderHook(() =>
      useActivityToast({
        groceryListId: null,
        householdId: 'household-1',
        currentUserId: 'user-1',
        memberLookup,
      })
    );

    const handler = mealPlanHandlers['INSERT:meal_plans'] || mealPlanHandlers['*:meal_plans'];
    expect(handler).toBeDefined();

    act(() => {
      handler({
        eventType: 'INSERT',
        new: { id: 'mp-1', created_by: 'user-1', household_id: 'household-1' },
        old: {},
      });
    });

    expect(result.current.currentToast).toBeNull();
  });

  it('enqueues toast when checked_by differs from currentUserId', () => {
    const { result } = renderHook(() =>
      useActivityToast({
        groceryListId: 'list-1',
        householdId: null,
        currentUserId: 'user-1',
        memberLookup,
      })
    );

    const handler = groceryHandlers['UPDATE:grocery_items'];
    expect(handler).toBeDefined();

    act(() => {
      handler({
        new: { id: 'item-1', name: 'Milk', is_checked: true, checked_by: 'user-2' },
        old: { id: 'item-1', name: 'Milk', is_checked: false, checked_by: null },
      });
    });

    expect(result.current.currentToast).not.toBeNull();
    expect(result.current.currentToast?.display_name).toBe('Bob');
    expect(result.current.currentToast?.message).toContain('checked off');
    expect(result.current.currentToast?.message).toContain('Milk');
  });

  it('cleans up channels on unmount', () => {
    const { unmount } = renderHook(() =>
      useActivityToast({
        groceryListId: 'list-1',
        householdId: 'household-1',
        currentUserId: 'user-1',
        memberLookup,
      })
    );

    unmount();

    // removeChannel should be called for each channel created
    expect((supabase as any).removeChannel).toHaveBeenCalled();
  });
});
