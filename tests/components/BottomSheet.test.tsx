import React from 'react';
import { Text } from 'react-native';

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockBottomSheet = React.forwardRef(
    ({ children, index, handleIndicatorStyle, ...props }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        expand: jest.fn(),
        close: jest.fn(),
        snapToIndex: jest.fn(),
      }));

      if (index === -1) return null;

      return (
        <View testID="bottom-sheet" {...props}>
          <View testID="drag-handle" style={handleIndicatorStyle} />
          {children}
        </View>
      );
    }
  );

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetBackdrop: ({ children, ...props }: any) => (
      <View testID="backdrop" {...props}>
        {children}
      </View>
    ),
    BottomSheetView: ({ children, ...props }: any) => (
      <View testID="bottom-sheet-view" {...props}>
        {children}
      </View>
    ),
  };
});

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
import { BottomSheet } from '../../src/components/ui/BottomSheet';

describe('BottomSheet', () => {
  it('renders children when isOpen is true', () => {
    render(
      <BottomSheet isOpen={true} onClose={jest.fn()}>
        <Text>Sheet Content</Text>
      </BottomSheet>
    );

    expect(screen.getByText('Sheet Content')).toBeTruthy();
  });

  it('renders drag handle indicator', () => {
    render(
      <BottomSheet isOpen={true} onClose={jest.fn()}>
        <Text>Content</Text>
      </BottomSheet>
    );

    expect(screen.getByTestId('drag-handle')).toBeTruthy();
  });

  it('does not render when isOpen is false', () => {
    render(
      <BottomSheet isOpen={false} onClose={jest.fn()}>
        <Text>Hidden Content</Text>
      </BottomSheet>
    );

    expect(screen.queryByText('Hidden Content')).toBeNull();
  });
});
