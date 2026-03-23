/**
 * Ambient Shadow Presets - Culinary Curator Design System
 *
 * Shadows are ambient, soft, barely-there per the design philosophy.
 * Tinted with onSurface (#1b1c1a) rather than pure black to maintain warmth.
 */
import { ViewStyle } from 'react-native';

export const shadows: Record<string, ViewStyle> = {
  editorial: {
    shadowColor: '#1b1c1a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 2,
  },
  float: {
    shadowColor: '#1b1c1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#1b1c1a',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
};
