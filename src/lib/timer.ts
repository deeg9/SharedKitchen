/**
 * Countdown timer utilities for cooking mode.
 * useCountdown hook uses wall clock for accuracy across app backgrounding.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Format seconds into M:SS or H:MM:SS string.
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Countdown timer hook with wall-clock accuracy and AppState awareness.
 * Survives app backgrounding by computing remaining time from Date.now().
 */
export function useCountdown(durationSeconds: number) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedRemainingRef.current = remaining;
    setIsRunning(true);
  }, [remaining]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    // remaining is already up to date from the interval
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(durationSeconds);
    pausedRemainingRef.current = durationSeconds;
    startTimeRef.current = null;
    setIsRunning(false);
  }, [durationSeconds, clearTimer]);

  // Main countdown effect
  useEffect(() => {
    if (!isRunning || !startTimeRef.current) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      const left = Math.max(0, pausedRemainingRef.current - elapsed);
      setRemaining(left);

      if (left === 0) {
        clearTimer();
        setIsRunning(false);
        // Triple haptic pulse for timer completion
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 400);
      }
    }, 250);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // AppState handler: recalculate remaining from wall clock on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && isRunning && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const left = Math.max(0, pausedRemainingRef.current - elapsed);
        setRemaining(left);
        if (left === 0) {
          clearTimer();
          setIsRunning(false);
        }
      }
    });
    return () => sub.remove();
  }, [isRunning, clearTimer]);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  return {
    remaining,
    isRunning,
    isComplete: remaining === 0,
    start,
    pause,
    reset,
    formattedTime: formatTime(remaining),
  };
}
