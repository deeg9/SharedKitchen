/**
 * Typography System - Culinary Curator Design System
 *
 * Plus Jakarta Sans for headlines (editorial voice)
 * Inter for body and labels (functional voice)
 */
import { TextStyle } from 'react-native';

export const fontFamily = {
  headline: 'PlusJakartaSans',
  headlineBold: 'PlusJakartaSans_700Bold',
  headlineExtraBold: 'PlusJakartaSans_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  label: 'Inter_500Medium',
} as const;

export const typography: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: fontFamily.headlineExtraBold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  headlineLg: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  headlineMd: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 24,
    lineHeight: 32,
  },
  titleLg: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  titleMd: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
  },
  labelLg: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSm: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
