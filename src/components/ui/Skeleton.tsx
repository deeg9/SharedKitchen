import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { borderRadius as br } from '../../theme/spacing';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBase({
  width = '100%',
  height = 20,
  borderRadius = br.sm,
  style,
}: SkeletonProps) {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + shimmerPosition.value * 0.6,
  }));

  return (
    <View
      style={[
        {
          width: width as DimensionValue,
          height,
          borderRadius,
          backgroundColor: colors.surfaceContainerHigh,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.surfaceContainerLowest },
          animatedStyle,
        ]}
      />
    </View>
  );
}

function SkeletonText({ style, ...props }: Omit<SkeletonProps, 'height'>) {
  return <SkeletonBase height={14} {...props} style={style} />;
}

function SkeletonCircle({
  size = 44,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonBase
      width={size}
      height={size}
      borderRadius={br.full}
      style={style}
    />
  );
}

function SkeletonCard({ style, ...props }: Omit<SkeletonProps, 'height'>) {
  return <SkeletonBase height={120} borderRadius={br.lg} {...props} style={style} />;
}

export const Skeleton = Object.assign(SkeletonBase, {
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Card: SkeletonCard,
});
