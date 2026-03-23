import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

const STORAGE_KEY = 'color_scheme';

/** Dark theme colors -- simple inversion of surface/onSurface families */
const darkColors = {
  ...colors,
  surface: '#1b1c1a',
  surfaceDim: '#1b1c1a',
  surfaceBright: '#30312e',
  surfaceContainerLowest: '#0e0f0d',
  surfaceContainerLow: '#1b1c1a',
  surfaceContainer: '#1f201e',
  surfaceContainerHigh: '#292a28',
  surfaceContainerHighest: '#343532',
  surfaceVariant: '#434843',
  onSurface: '#e4e2de',
  onSurfaceVariant: '#c3c8c1',
  onBackground: '#e4e2de',
  background: '#1b1c1a',
  outline: '#8d918b',
  outlineVariant: '#434843',
} as const;

interface ColorSchemeContextValue {
  isDark: boolean;
  toggleColorScheme: () => void;
  colors: typeof colors;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue>({
  isDark: false,
  toggleColorScheme: () => {},
  colors,
});

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'dark') setIsDark(true);
    });
  }, []);

  const toggleColorScheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const resolvedColors = isDark ? darkColors : colors;

  return (
    <ColorSchemeContext.Provider value={{ isDark, toggleColorScheme, colors: resolvedColors }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
