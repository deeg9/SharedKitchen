import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { TAB_BAR_HEIGHT } from '../../lib/constants';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAB_CONFIG: Record<string, { icon: IconName; label: string }> = {
  plan: { icon: 'calendar-week', label: 'Plan' },
  recipes: { icon: 'book-open-variant', label: 'Recipes' },
  grocery: { icon: 'fridge-outline', label: 'Kitchen' },
  budget: { icon: 'chart-pie', label: 'Budget' },
  profile: { icon: 'account', label: 'Profile' },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={90}
      tint="systemChromeMaterialLight"
      style={[
        styles.container,
        shadows.tabBar,
        { paddingBottom: insets.bottom || 16 },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name] ?? {
          icon: 'circle' as IconName,
          label: route.name,
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={config.label}
            testID={options.tabBarTestID ?? `${route.name}-tab`}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && styles.activeIconContainer,
              ]}
            >
              <MaterialCommunityIcons
                name={config.icon}
                size={24}
                color={
                  isFocused ? colors.primary : colors.onSurfaceVariant
                }
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isFocused ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

/** Total height including safe area - use for scroll padding */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + (insets.bottom || 16);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: colors.primaryFixed,
  },
  label: {
    ...typography.labelSm,
    marginTop: 2,
  },
});
