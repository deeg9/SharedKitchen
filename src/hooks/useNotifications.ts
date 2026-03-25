import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken, requestPermission } from '../lib/notifications';
import { useAuthStore } from '../stores/authStore';

// Configure foreground notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotificationSetup() {
  const router = useRouter();
  const { session } = useAuthStore();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Register push token on every app launch (token can rotate)
    try {
      registerPushToken(session.user.id);
    } catch {
      // Silently handle simulator/permission errors
    }

    // Handle notification tap -> navigate to relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        switch (data.type) {
          case 'cooking_reminder':
            router.push('/(app)/(tabs)/plan');
            break;
          case 'leftover_alert':
            router.push('/(app)/leftovers');
            break;
          case 'budget_warning':
            router.push('/(app)/(tabs)/budget');
            break;
        }
      }
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [session?.user?.id]);
}

export function usePermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);

        if (status === 'undetermined') {
          const dismissed = await AsyncStorage.getItem('notif_prompt_dismissed');
          if (!dismissed) {
            setShowPrompt(true);
          }
        }
      } catch {
        // Silently handle errors (e.g., simulator)
      }
    };

    checkPermission();
  }, []);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem('notif_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  return { showPrompt, handleEnable, handleDismiss, permissionStatus };
}
