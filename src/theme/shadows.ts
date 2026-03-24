/**
 * Ambient Shadow Presets - Culinary Curator Design System
 *
 * Shadows are ambient, soft, barely-there per the design philosophy.
 * Tinted with onSurface (#1b1c1a) rather than pure black to maintain warmth.
 *
 * Uses boxShadow for React Native Web compatibility, with native shadow*
 * props as fallback for iOS and elevation for Android.
 */
import { Platform, ViewStyle } from 'react-native';

function createShadow(
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
): ViewStyle {
  if (Platform.OS === 'web') {
    // Convert opacity + color to rgba for boxShadow
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(${r}, ${g}, ${b}, ${opacity})`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export const shadows: Record<string, ViewStyle> = {
  editorial: createShadow('#1b1c1a', 0, 8, 0.04, 32, 2),
  float: createShadow('#1b1c1a', 0, 4, 0.06, 24, 4),
  tabBar: createShadow('#1b1c1a', 0, -8, 0.06, 32, 8),
};
