import React from 'react';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    default: { createAnimatedComponent: (c: any) => c },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withRepeat: jest.fn((v: any) => v),
    withTiming: jest.fn((v: any) => v),
    Easing: { inOut: jest.fn(() => jest.fn()), ease: {} },
    View,
  };
});

import { render, screen } from '@testing-library/react-native';
import { Skeleton } from '../../src/components/ui/Skeleton';

// Helper to flatten style arrays into a single object
function flattenStyle(style: any): Record<string, any> {
  if (Array.isArray(style)) {
    return style.reduce((acc: any, s: any) => ({ ...acc, ...(s || {}) }), {});
  }
  return style || {};
}

describe('Skeleton', () => {
  it('renders with given dimensions', () => {
    const { toJSON } = render(<Skeleton width={200} height={40} />);
    const tree = toJSON() as any;
    expect(tree).toBeTruthy();
    const style = flattenStyle(tree.props.style);
    expect(style.width).toBe(200);
    expect(style.height).toBe(40);
  });

  it('renders Skeleton.Text variant', () => {
    const { toJSON } = render(<Skeleton.Text />);
    const tree = toJSON() as any;
    expect(tree).toBeTruthy();
    const style = flattenStyle(tree.props.style);
    expect(style.height).toBe(14);
  });

  it('renders Skeleton.Circle variant', () => {
    const { toJSON } = render(<Skeleton.Circle size={48} />);
    const tree = toJSON() as any;
    expect(tree).toBeTruthy();
    const style = flattenStyle(tree.props.style);
    expect(style.width).toBe(48);
    expect(style.height).toBe(48);
    expect(style.borderRadius).toBe(9999);
  });

  it('renders Skeleton.Card variant', () => {
    const { toJSON } = render(<Skeleton.Card />);
    const tree = toJSON() as any;
    expect(tree).toBeTruthy();
    const style = flattenStyle(tree.props.style);
    expect(style.height).toBe(120);
  });
});
