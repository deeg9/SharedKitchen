import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface NotificationSettings {
  cookingReminders: boolean;
  leftoverAlerts: boolean;
  budgetWarnings: boolean;
  householdActivity: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  cookingReminders: true,
  leftoverAlerts: true,
  budgetWarnings: true,
  householdActivity: true,
};

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token.data,
      device_id: Device.modelId ?? 'unknown',
      platform: Device.osName?.toLowerCase() ?? 'ios',
    },
    { onConflict: 'user_id,expo_push_token' }
  );

  return token.data;
}

export async function scheduleCookingReminder(
  mealPlanId: string,
  recipeName: string,
  planDate: string,
  prepTimeMinutes: number
): Promise<string | null> {
  const settings = await getNotificationSettings();
  if (!settings.cookingReminders) return null;

  // Default meal time: 6:00 PM
  const mealTime = new Date(planDate + 'T18:00:00');
  const reminderTime = new Date(mealTime.getTime() - prepTimeMinutes * 60 * 1000);

  if (reminderTime <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to start cooking!',
      body: `${recipeName} needs ${prepTimeMinutes} min of prep. Start now to be ready by dinner.`,
      data: { type: 'cooking_reminder', mealPlanId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
  });

  return id;
}

export async function scheduleLeftoverAlerts(
  leftoverId: string,
  name: string,
  useByDate: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (!settings.leftoverAlerts) return [];

  const ids: string[] = [];
  const useBy = new Date(useByDate + 'T09:00:00');
  const dayBefore = new Date(useBy.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();

  // Day before alert
  if (dayBefore > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Leftover expiring tomorrow',
        body: `${name} should be used by tomorrow. Plan to use it today!`,
        data: { type: 'leftover_alert', leftoverId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
    });
    ids.push(id);
  }

  // Day-of alert
  if (useBy > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Leftover expires today',
        body: `${name} expires today. Use it or freeze it!`,
        data: { type: 'leftover_alert', leftoverId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: useBy },
    });
    ids.push(id);
  }

  // Store notification IDs for later cancellation
  if (ids.length > 0) {
    await AsyncStorage.setItem(`notif_leftover_${leftoverId}`, JSON.stringify(ids));
  }

  return ids;
}

export async function checkBudgetThreshold(
  monthlyTotal: number,
  budgetTarget: number,
  householdName: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.budgetWarnings) return;

  const percentage = (monthlyTotal / budgetTarget) * 100;
  const now = new Date();
  const monthKey = `budget_alert_${now.getFullYear()}_${now.getMonth()}`;

  if (percentage >= 100) {
    const sent = await AsyncStorage.getItem(`${monthKey}_100`);
    if (!sent) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Budget exceeded!',
          body: `${householdName} has exceeded the monthly budget of $${budgetTarget}.`,
          data: { type: 'budget_warning', threshold: 100 },
        },
        trigger: null,
      });
      await AsyncStorage.setItem(`${monthKey}_100`, 'true');
    }
  } else if (percentage >= 80) {
    const sent = await AsyncStorage.getItem(`${monthKey}_80`);
    if (!sent) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Budget warning',
          body: `${householdName} has used 80% of the monthly budget ($${Math.round(monthlyTotal)} of $${budgetTarget}).`,
          data: { type: 'budget_warning', threshold: 80 },
        },
        trigger: null,
      });
      await AsyncStorage.setItem(`${monthKey}_80`, 'true');
    }
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelLeftoverAlerts(leftoverId: string): Promise<void> {
  const stored = await AsyncStorage.getItem(`notif_leftover_${leftoverId}`);
  if (stored) {
    const ids: string[] = JSON.parse(stored);
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    await AsyncStorage.removeItem(`notif_leftover_${leftoverId}`);
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const val = await AsyncStorage.getItem('notification_settings');
  if (val) return JSON.parse(val);
  return { ...DEFAULT_SETTINGS };
}
