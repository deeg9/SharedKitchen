import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface DonutChartProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  badgeLabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  value,
  max,
  label,
  sublabel,
  badgeLabel,
  size = 160,
  strokeWidth = 12,
}: DonutChartProps) {
  const isInitialMount = useRef(true);
  const progress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(value / Math.max(max, 1), 1);

  useEffect(() => {
    const duration = isInitialMount.current ? 800 : 600;
    isInitialMount.current = false;

    progress.value = withTiming(ratio, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, max]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityLabel={`${label} ${sublabel}`}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceContainerHigh}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.centerOverlay}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>
        {badgeLabel != null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  sublabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  badge: {
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeText: {
    ...typography.labelMd,
    color: colors.primary,
  },
});
