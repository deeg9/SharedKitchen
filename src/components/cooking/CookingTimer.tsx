import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
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

  // Schedule / cancel notification on start/pause/reset
  useEffect(() => {
    if (isRunning && remaining > 0) {
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

  const buttonLabel = isComplete
    ? 'RESET'
    : isRunning
      ? 'PAUSE'
      : 'START';
  const accessLabel = isComplete
    ? 'Reset timer'
    : isRunning
      ? 'Pause timer'
      : `Start timer, ${label}`;

  return (
    <View style={s.container}>
      {/* Timer icon circle */}
      <View style={s.iconCircle}>
        <MaterialCommunityIcons name="timer-outline" size={20} color={colors.onSecondary} />
      </View>

      {/* Middle section: label + digits */}
      <View style={s.middle}>
        <Text style={s.label}>{label.toUpperCase()}</Text>
        <Text style={s.digits}>{formattedTime}</Text>
      </View>

      {/* Action button */}
      <Pressable
        onPress={handleStartPause}
        style={[
          s.actionBtn,
          isRunning && s.actionBtnRunning,
          isComplete && s.actionBtnComplete,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessLabel}
        testID={isRunning ? 'cooking-timer-pause' : 'cooking-timer-start'}
      >
        <Text style={[
          s.actionBtnText,
          isRunning && s.actionBtnTextRunning,
          isComplete && s.actionBtnTextComplete,
        ]}>
          {buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 2,
  },
  digits: {
    fontFamily: fontFamily.headlineExtraBold,
    fontSize: 40,
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionBtnRunning: {
    backgroundColor: colors.surfaceContainer,
  },
  actionBtnComplete: {
    backgroundColor: colors.errorContainer,
  },
  actionBtnText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  actionBtnTextRunning: {
    color: colors.onSurface,
  },
  actionBtnTextComplete: {
    color: colors.onErrorContainer,
  },
});
