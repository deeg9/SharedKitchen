import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import {
  requestPermission,
  registerPushToken,
  scheduleCookingReminder,
  scheduleLeftoverAlerts,
  checkBudgetThreshold,
  cancelLeftoverAlerts,
  getNotificationSettings,
} from '../../src/lib/notifications';

// Cast mocks for type safety
const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetPushToken = Notifications.getExpoPushTokenAsync as jest.Mock;
const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSchedule.mockResolvedValue('mock-notif-id');
  });

  describe('requestPermission', () => {
    it('returns true when permission is already granted', async () => {
      mockGetPermissions.mockResolvedValue({ status: 'granted' });
      const result = await requestPermission();
      expect(result).toBe(true);
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('requests permission and returns true when granted', async () => {
      mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });
      const result = await requestPermission();
      expect(result).toBe(true);
      expect(mockRequestPermissions).toHaveBeenCalled();
    });

    it('returns false when permission is denied', async () => {
      mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
      mockRequestPermissions.mockResolvedValue({ status: 'denied' });
      const result = await requestPermission();
      expect(result).toBe(false);
    });

    it('returns false when not a physical device', async () => {
      // Temporarily override Device.isDevice
      const original = Device.isDevice;
      Object.defineProperty(Device, 'isDevice', { value: false, writable: true });
      const result = await requestPermission();
      expect(result).toBe(false);
      Object.defineProperty(Device, 'isDevice', { value: original, writable: true });
    });
  });

  describe('registerPushToken', () => {
    it('gets push token and upserts to database', async () => {
      mockGetPermissions.mockResolvedValue({ status: 'granted' });
      mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[test-token]' });

      const result = await registerPushToken('user-123');

      expect(mockGetPushToken).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'mock-project-id' })
      );
      expect(supabase.from).toHaveBeenCalledWith('push_tokens');
      expect(result).toBe('ExponentPushToken[test-token]');
    });

    it('returns null when not a physical device', async () => {
      const original = Device.isDevice;
      Object.defineProperty(Device, 'isDevice', { value: false, writable: true });
      const result = await registerPushToken('user-123');
      expect(result).toBeNull();
      Object.defineProperty(Device, 'isDevice', { value: original, writable: true });
    });

    it('returns null when permission not granted', async () => {
      mockGetPermissions.mockResolvedValue({ status: 'denied' });
      const result = await registerPushToken('user-123');
      expect(result).toBeNull();
      expect(mockGetPushToken).not.toHaveBeenCalled();
    });
  });

  describe('scheduleCookingReminder', () => {
    it('schedules notification with correct title and body', async () => {
      // Set a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];

      const result = await scheduleCookingReminder('plan-1', 'Tacos', dateStr, 30);

      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Time to start cooking!',
            body: 'Tacos needs 30 min of prep. Start now to be ready by dinner.',
            data: { type: 'cooking_reminder', mealPlanId: 'plan-1' },
          }),
        })
      );
      expect(result).toBe('mock-notif-id');
    });

    it('returns null when cookingReminders setting is false', async () => {
      mockGetItem.mockResolvedValue(
        JSON.stringify({ cookingReminders: false, leftoverAlerts: true, budgetWarnings: true, householdActivity: true })
      );

      const result = await scheduleCookingReminder('plan-1', 'Tacos', '2099-12-25', 30);
      expect(result).toBeNull();
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('returns null when date is in the past', async () => {
      const result = await scheduleCookingReminder('plan-1', 'Tacos', '2020-01-01', 30);
      expect(result).toBeNull();
      expect(mockSchedule).not.toHaveBeenCalled();
    });
  });

  describe('scheduleLeftoverAlerts', () => {
    it('schedules two notifications for day-before and day-of', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateStr = futureDate.toISOString().split('T')[0];

      let callCount = 0;
      mockSchedule.mockImplementation(() => {
        callCount++;
        return Promise.resolve(`notif-${callCount}`);
      });

      const result = await scheduleLeftoverAlerts('left-1', 'Chicken Soup', dateStr);

      expect(result).toHaveLength(2);
      expect(mockSchedule).toHaveBeenCalledTimes(2);

      // Day-before notification
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Leftover expiring tomorrow',
            body: 'Chicken Soup should be used by tomorrow. Plan to use it today!',
          }),
        })
      );

      // Day-of notification
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Leftover expires today',
            body: 'Chicken Soup expires today. Use it or freeze it!',
          }),
        })
      );

      // Stores IDs in AsyncStorage
      expect(mockSetItem).toHaveBeenCalledWith(
        'notif_leftover_left-1',
        expect.any(String)
      );
    });

    it('returns empty array when leftoverAlerts setting is false', async () => {
      mockGetItem.mockResolvedValue(
        JSON.stringify({ cookingReminders: true, leftoverAlerts: false, budgetWarnings: true, householdActivity: true })
      );

      const result = await scheduleLeftoverAlerts('left-1', 'Soup', '2099-12-25');
      expect(result).toEqual([]);
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('skips past dates', async () => {
      const result = await scheduleLeftoverAlerts('left-1', 'Soup', '2020-01-01');
      expect(result).toEqual([]);
      expect(mockSchedule).not.toHaveBeenCalled();
    });
  });

  describe('checkBudgetThreshold', () => {
    it('fires immediate notification at 100% threshold', async () => {
      await checkBudgetThreshold(600, 500, 'Test Household');

      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Budget exceeded!',
            body: 'Test Household has exceeded the monthly budget of $500.',
            data: { type: 'budget_warning', threshold: 100 },
          }),
          trigger: null,
        })
      );

      expect(mockSetItem).toHaveBeenCalledWith(
        expect.stringContaining('_100'),
        'true'
      );
    });

    it('fires immediate notification at 80% threshold', async () => {
      await checkBudgetThreshold(420, 500, 'Test Household');

      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Budget warning',
            data: { type: 'budget_warning', threshold: 80 },
          }),
          trigger: null,
        })
      );
    });

    it('deduplicates using AsyncStorage keys', async () => {
      // Simulate already sent
      mockGetItem.mockImplementation((key: string) => {
        if (key.includes('_100')) return Promise.resolve('true');
        return Promise.resolve(null);
      });

      await checkBudgetThreshold(600, 500, 'Test Household');
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('respects budgetWarnings setting when disabled', async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === 'notification_settings') {
          return Promise.resolve(
            JSON.stringify({ cookingReminders: true, leftoverAlerts: true, budgetWarnings: false, householdActivity: true })
          );
        }
        return Promise.resolve(null);
      });

      await checkBudgetThreshold(600, 500, 'Test Household');
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('does not fire below 80% threshold', async () => {
      await checkBudgetThreshold(300, 500, 'Test Household');
      expect(mockSchedule).not.toHaveBeenCalled();
    });
  });

  describe('cancelLeftoverAlerts', () => {
    it('reads stored IDs from AsyncStorage and cancels each', async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === 'notif_leftover_left-1') {
          return Promise.resolve(JSON.stringify(['notif-a', 'notif-b']));
        }
        return Promise.resolve(null);
      });

      await cancelLeftoverAlerts('left-1');

      expect(mockCancel).toHaveBeenCalledWith('notif-a');
      expect(mockCancel).toHaveBeenCalledWith('notif-b');
      expect(mockRemoveItem).toHaveBeenCalledWith('notif_leftover_left-1');
    });

    it('does nothing when no stored IDs exist', async () => {
      mockGetItem.mockResolvedValue(null);
      await cancelLeftoverAlerts('left-nonexistent');
      expect(mockCancel).not.toHaveBeenCalled();
    });
  });

  describe('getNotificationSettings', () => {
    it('returns defaults when no settings stored', async () => {
      mockGetItem.mockResolvedValue(null);
      const settings = await getNotificationSettings();
      expect(settings).toEqual({
        cookingReminders: true,
        leftoverAlerts: true,
        budgetWarnings: true,
        householdActivity: true,
      });
    });

    it('returns stored settings', async () => {
      const custom = { cookingReminders: false, leftoverAlerts: true, budgetWarnings: false, householdActivity: true };
      mockGetItem.mockResolvedValue(JSON.stringify(custom));
      const settings = await getNotificationSettings();
      expect(settings).toEqual(custom);
    });
  });
});
