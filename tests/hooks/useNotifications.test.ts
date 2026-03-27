import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Must mock before importing hooks
jest.mock('../../src/lib/notifications', () => ({
  registerPushToken: jest.fn(() => Promise.resolve('mock-token')),
  requestPermission: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { usePermissionPrompt, useNotificationSetup } from '../../src/hooks/useNotifications';
import { registerPushToken, requestPermission } from '../../src/lib/notifications';
import { useAuthStore } from '../../src/stores/authStore';

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no session
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
    const state = { session: null };
    return selector ? selector(state) : state;
  });
});

describe('usePermissionPrompt', () => {
  it('shows prompt when permission is undetermined and not dismissed', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePermissionPrompt());

    await waitFor(() => {
      expect(result.current.showPrompt).toBe(true);
    });
  });

  it('hides prompt when permission is already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const { result } = renderHook(() => usePermissionPrompt());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('granted');
    });
    expect(result.current.showPrompt).toBe(false);
  });

  it('hides prompt when previously dismissed', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

    const { result } = renderHook(() => usePermissionPrompt());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('undetermined');
    });
    expect(result.current.showPrompt).toBe(false);
  });

  it('handleDismiss sets AsyncStorage and hides prompt', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePermissionPrompt());

    await waitFor(() => {
      expect(result.current.showPrompt).toBe(true);
    });

    await act(async () => {
      await result.current.handleDismiss();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('notif_prompt_dismissed', 'true');
    expect(result.current.showPrompt).toBe(false);
  });

  it('handleEnable calls requestPermission and hides prompt', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => usePermissionPrompt());

    await waitFor(() => {
      expect(result.current.showPrompt).toBe(true);
    });

    await act(async () => {
      await result.current.handleEnable();
    });

    expect(requestPermission).toHaveBeenCalled();
    expect(result.current.showPrompt).toBe(false);
  });

  it('handles getPermissionsAsync error gracefully', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Simulator error'));

    const { result } = renderHook(() => usePermissionPrompt());

    // Should not crash - showPrompt stays false
    await waitFor(() => {
      expect(result.current.showPrompt).toBe(false);
    });
  });
});

describe('useNotificationSetup', () => {
  it('registers push token when session exists', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = { session: { user: { id: 'user-1' } } };
      return selector ? selector(state) : state;
    });

    renderHook(() => useNotificationSetup());

    expect(registerPushToken).toHaveBeenCalledWith('user-1');
  });

  it('does not register when no session', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = { session: null };
      return selector ? selector(state) : state;
    });

    renderHook(() => useNotificationSetup());

    expect(registerPushToken).not.toHaveBeenCalled();
  });
});
