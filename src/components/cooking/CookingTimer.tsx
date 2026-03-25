import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { useCountdown } from '../../lib/timer';

interface CookingTimerProps {
  durationSeconds: number;
  label: string;
  onComplete?: () => void;
}

export function CookingTimer({ durationSeconds, label, onComplete }: CookingTimerProps) {
  const { remaining, isRunning, isComplete, start, pause, reset, formattedTime } =
    useCountdown(durationSeconds);
  const notifIdRef = useRef<string | null>(null);

  // Determine color based on state
  const timerColor = isComplete
    ? colors.error
    : isRunning
      ? colors.secondaryContainer
      : colors.secondaryFixedDim;

  // Schedule / cancel notification on start/pause/reset
  useEffect(() => {
    if (isRunning && remaining > 0) {
      // Schedule notification for when timer would expire
      Notifications.scheduleNotificationAsync({
        content: { title: 'Timer done!', body: `${label} is ready` },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + remaining * 1000),
        },
      }).then((id) => {
        notifIdRef.current = id;
      }).catch(() => {});
    } else if (!isRunning && notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
  }, [isRunning]);

  // Call onComplete when timer finishes
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete]);

  const handleStartPause = () => {
    if (isComplete) {
      reset();
    } else if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const progress = durationSeconds > 0
    ? (durationSeconds - remaining) / durationSeconds
    : 0;

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.digits, { color: timerColor }]}>{formattedTime}</Text>
      <View style={[s.progressTrack]}>
        <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: timerColor }]} />
      </View>
      <View style={s.controls}>
        <Pressable
          onPress={handleStartPause}
          style={s.controlBtn}
          accessibilityRole="button"
          accessibilityLabel={
            isComplete ? 'Reset timer' : isRunning ? 'Pause timer' : `Start timer, ${label}`
          }
        >
          <MaterialCommunityIcons
            name={isComplete ? 'refresh' : isRunning ? 'pause' : 'play'}
            size={28}
            color={colors.inverseOnSurface}
          />
        </Pressable>
        {!isComplete && (
          <Pressable
            onPress={reset}
            style={s.controlBtn}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
          >
            <MaterialCommunityIcons name="refresh" size={24} color={colors.outlineVariant} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.outlineVariant,
    marginBottom: spacing.xs,
  },
  digits: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: fontFamily.headlineBold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  progressTrack: {
    width: '80%',
    height: 4,
    backgroundColor: colors.onSurfaceVariant,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
