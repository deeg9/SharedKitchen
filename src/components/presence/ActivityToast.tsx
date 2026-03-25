import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Avatar } from '../ui/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface ActivityToastProps {
  avatar_url: string | null;
  display_name: string;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

/**
 * Animated toast notification that slides down from the top of the screen.
 * Displays a household member's activity (e.g. "checked off Milk").
 * Auto-dismisses after `duration` ms (default 3000).
 */
export function ActivityToast({
  avatar_url,
  display_name,
  message,
  duration = 3000,
  onDismiss,
}: ActivityToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Slide in
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    // Schedule dismiss
    const timer = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      // Call onDismiss after exit animation
      setTimeout(() => {
        onDismiss();
      }, 350);
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Avatar uri={avatar_url} name={display_name} size="sm" />
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {display_name}
        </Text>
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
    zIndex: 1000,
    ...shadows.float,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
  },
  message: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
