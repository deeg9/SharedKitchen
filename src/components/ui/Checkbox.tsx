import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type CheckboxSize = 'sm' | 'md';

interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  size?: CheckboxSize;
  disabled?: boolean;
  testID?: string;
}

const SIZE_MAP: Record<CheckboxSize, number> = {
  sm: 20,
  md: 24,
};

const ICON_SIZE_MAP: Record<CheckboxSize, number> = {
  sm: 14,
  md: 16,
};

export function Checkbox({
  checked,
  onToggle,
  size = 'md',
  disabled = false,
  testID,
}: CheckboxProps) {
  const dimension = SIZE_MAP[size];
  const iconSize = ICON_SIZE_MAP[size];
  const scale = useSharedValue(checked ? 1 : 1);

  useEffect(() => {
    if (checked) {
      scale.value = 0.8;
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [checked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onToggle(!checked)}
      hitSlop={8}
      disabled={disabled}
      testID={testID}
      style={disabled ? styles.disabled : undefined}
    >
      <Animated.View
        style={[
          styles.box,
          {
            width: dimension,
            height: dimension,
          },
          checked && styles.boxChecked,
          animatedStyle,
        ]}
      >
        {checked && (
          <MaterialCommunityIcons
            name="check"
            size={iconSize}
            color={colors.onPrimary}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
