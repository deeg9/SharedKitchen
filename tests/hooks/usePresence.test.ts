import { renderHook, act } from '@testing-library/react-native';
import { supabase } from '../../src/lib/supabase';
import { usePresence, PresenceMember } from '../../src/hooks/usePresence';

// Track channel event handlers
let channelHandlers: Record<string, Function> = {};
let mockSubscribe: jest.Mock;
let mockUnsubscribe: jest.Mock;
let mockTrack: jest.Mock;
let mockPresenceState: jest.Mock;
let mockUntrack: jest.Mock;

const currentUser: PresenceMember = {
  user_id: 'user-1',
  display_name: 'Alice',
  avatar_url: null,
};

const otherUser: PresenceMember = {
  user_id: 'user-2',
  display_name: 'Bob',
  avatar_url: 'https://example.com/bob.jpg',
};

const thirdUser: PresenceMember = {
  user_id: 'user-3',
  display_name: 'Charlie',
  avatar_url: null,
};

beforeEach(() => {
  jest.useFakeTimers();
  channelHandlers = {};
  mockUnsubscribe = jest.fn();
  mockTrack = jest.fn();
  mockUntrack = jest.fn();
  mockPresenceState = jest.fn().mockReturnValue({});

  mockSubscribe = jest.fn().mockImplementation((callback?: Function) => {
    if (callback) callback('SUBSCRIBED');
    return { unsubscribe: mockUnsubscribe };
  });

  const mockOn = jest.fn().mockImplementation(
    (event: string, filter: any, callback: Function) => {
      const eventType = typeof filter === 'object' && filter?.event ? filter.event : event;
      channelHandlers[eventType] = callback;
      return { on: mockOn, subscribe: mockSubscribe, presenceState: mockPresenceState, track: mockTrack, untrack: mockUntrack };
    }
  );

  (supabase.channel as jest.Mock).mockReturnValue({
    on: mockOn,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    presenceState: mockPresenceState,
    track: mockTrack,
    untrack: mockUntrack,
  });

  (supabase as any).removeChannel = jest.fn();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePresence', () => {
  it('creates channel named "presence:{channelKey}" when channelKey and currentUser are provided', () => {
    renderHook(() => usePresence('grocery:list-1', currentUser));

    expect(supabase.channel).toHaveBeenCalledWith(
      'presence:grocery:list-1',
      expect.objectContaining({
        config: expect.objectContaining({
          presence: expect.objectContaining({ key: 'user-1' }),
        }),
      })
    );
  });

  it('does NOT create channel when channelKey is null', () => {
    renderHook(() => usePresence(null, currentUser));

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('does NOT create channel when currentUser is null', () => {
    renderHook(() => usePresence('grocery:list-1', null));

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('calls channel.track() with user data after subscribe status is SUBSCRIBED', () => {
    renderHook(() => usePresence('grocery:list-1', currentUser));

    expect(mockTrack).toHaveBeenCalledWith({
      user_id: 'user-1',
      display_name: 'Alice',
      avatar_url: null,
    });
  });

  it('calls supabase.removeChannel() on unmount', () => {
    const { unmount } = renderHook(() => usePresence('grocery:list-1', currentUser));

    unmount();

    expect((supabase as any).removeChannel).toHaveBeenCalled();
  });

  it('filters out current user from presence state (self not in returned members)', () => {
    mockPresenceState.mockReturnValue({
      'user-1': [{ user_id: 'user-1', display_name: 'Alice', avatar_url: null }],
      'user-2': [{ user_id: 'user-2', display_name: 'Bob', avatar_url: 'https://example.com/bob.jpg' }],
    });

    const { result } = renderHook(() => usePresence('grocery:list-1', currentUser));

    // Trigger sync event
    act(() => {
      channelHandlers['sync']?.();
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].user_id).toBe('user-2');
    expect(result.current[0].display_name).toBe('Bob');
  });

  it('debounces sync events -- two rapid sync events produce only one state update', () => {
    const stateValues: Record<string, PresenceMember[]>[] = [
      {
        'user-2': [{ user_id: 'user-2', display_name: 'Bob', avatar_url: null }],
      },
      {
        'user-2': [{ user_id: 'user-2', display_name: 'Bob', avatar_url: null }],
        'user-3': [{ user_id: 'user-3', display_name: 'Charlie', avatar_url: null }],
      },
    ];

    let callCount = 0;
    mockPresenceState.mockImplementation(() => {
      return stateValues[callCount++] || stateValues[stateValues.length - 1];
    });

    const { result } = renderHook(() => usePresence('grocery:list-1', currentUser));

    // Fire two rapid sync events
    act(() => {
      channelHandlers['sync']?.();
    });

    // Advance only 100ms (less than 300ms debounce)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      channelHandlers['sync']?.();
    });

    // Advance past debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should only have the second sync result (2 members minus self = 2)
    expect(result.current).toHaveLength(2);
    expect(result.current.map((m) => m.user_id)).toContain('user-2');
    expect(result.current.map((m) => m.user_id)).toContain('user-3');
  });
});
