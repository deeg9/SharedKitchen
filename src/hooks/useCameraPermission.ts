import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREPROMPT_KEY = 'camera_preprompt_shown';

export function useCameraPermission() {
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const checkAndPrompt = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status === 'granted') {
      setPermissionDenied(false);
      return true;
    }
    if (status === 'undetermined') {
      const dismissed = await AsyncStorage.getItem(PREPROMPT_KEY);
      if (!dismissed) {
        setShowPrePrompt(true);
        return false;
      }
      const result = await ImagePicker.requestCameraPermissionsAsync();
      setPermissionDenied(!result.granted);
      return result.granted;
    }
    // denied
    setPermissionDenied(true);
    return false;
  }, []);

  const requestAfterPrePrompt = useCallback(async (): Promise<boolean> => {
    await AsyncStorage.setItem(PREPROMPT_KEY, 'true');
    setShowPrePrompt(false);
    const result = await ImagePicker.requestCameraPermissionsAsync();
    setPermissionDenied(!result.granted);
    return result.granted;
  }, []);

  const dismissPrePrompt = useCallback(() => {
    setShowPrePrompt(false);
    AsyncStorage.setItem(PREPROMPT_KEY, 'true');
  }, []);

  return { showPrePrompt, permissionDenied, checkAndPrompt, requestAfterPrePrompt, dismissPrePrompt };
}
