/**
 * MD3 Color Tokens - Culinary Curator Design System
 *
 * Single source of truth for all colors in the app.
 * Extracted from Stitch UI mockup Tailwind config.
 * NO hex values should appear anywhere else in the codebase.
 */
export const colors = {
  primary: '#334537',
  primaryContainer: '#4a5d4e',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#c0d5c2',
  primaryFixed: '#d3e8d5',
  primaryFixedDim: '#b7ccb9',

  secondary: '#904d00',
  secondaryContainer: '#fe932c',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#663500',
  secondaryFixed: '#ffdcc3',
  secondaryFixedDim: '#ffb77d',

  tertiary: '#3b4436',
  tertiaryContainer: '#535b4c',
  tertiaryFixed: '#dde6d2',
  tertiaryFixedDim: '#c0c9b7',

  surface: '#fbf9f5',
  surfaceDim: '#dbdad6',
  surfaceBright: '#fbf9f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3ef',
  surfaceContainer: '#efeeea',
  surfaceContainerHigh: '#eae8e4',
  surfaceContainerHighest: '#e4e2de',
  surfaceVariant: '#e4e2de',

  onSurface: '#1b1c1a',
  onSurfaceVariant: '#434843',
  onBackground: '#1b1c1a',
  background: '#fbf9f5',

  outline: '#737872',
  outlineVariant: '#c3c8c1',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  inverseSurface: '#30312e',
  inverseOnSurface: '#f2f0ed',
  inversePrimary: '#b7ccb9',

  surfaceTint: '#506354',
} as const;
