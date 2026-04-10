import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface CollapsibleProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  testID?: string;
}

export function Collapsible({
  header,
  children,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onToggle,
  testID,
}: CollapsibleProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isControlled = controlledCollapsed !== undefined;
  const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const contentHeight = useSharedValue(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const animatedMaxHeight = useSharedValue(isCollapsed ? 0 : 10000);

  const handleToggle = () => {
    const next = !isCollapsed;
    if (isControlled) {
      onToggle?.(next);
    } else {
      setInternalCollapsed(next);
      onToggle?.(next);
    }
    animatedMaxHeight.value = withTiming(next ? 0 : measuredHeight || 10000, {
      duration: 250,
    });
  };

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (h > 0 && h !== measuredHeight) {
        setMeasuredHeight(h);
        if (!isCollapsed) {
          animatedMaxHeight.value = h;
        }
      }
    },
    [isCollapsed, measuredHeight]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: animatedMaxHeight.value,
    overflow: 'hidden' as const,
  }));

  return (
    <View testID={testID}>
      <Pressable style={styles.headerRow} onPress={handleToggle}>
        <View style={styles.headerContent}>{header}</View>
        <MaterialCommunityIcons
          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={colors.onSurfaceVariant}
        />
      </Pressable>
      <Animated.View style={animatedStyle}>
        <View onLayout={handleLayout}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
});
