import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityToast } from '../../src/components/presence/ActivityToast';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (Component: any) => Component,
      View,
    },
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (fn: Function) => fn(),
    withTiming: (val: any) => val,
    withDelay: (_delay: number, val: any) => val,
    withSequence: (...vals: any[]) => vals[vals.length - 1],
    runOnJS: (fn: Function) => fn,
    Easing: { inOut: () => {}, bezier: () => {} },
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
    SlideInUp: { duration: () => ({}) },
  };
});

describe('ActivityToast', () => {
  it('renders display_name text', () => {
    const { getByText } = render(
      <ActivityToast
        avatar_url={null}
        display_name="Alice"
        message="checked off Milk"
        onDismiss={jest.fn()}
      />
    );
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders message text', () => {
    const { getByText } = render(
      <ActivityToast
        avatar_url={null}
        display_name="Alice"
        message="checked off Milk"
        onDismiss={jest.fn()}
      />
    );
    expect(getByText('checked off Milk')).toBeTruthy();
  });

  it('calls onDismiss after duration expires', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();

    render(
      <ActivityToast
        avatar_url={null}
        display_name="Alice"
        message="checked off Milk"
        duration={3000}
        onDismiss={onDismiss}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3500);
    expect(onDismiss).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
