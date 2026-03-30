import React from 'react';

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
          {children}
        </View>
      );
    }
  );

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetBackdrop: ({ children, ...props }: any) => (
      <View testID="backdrop" {...props}>{children}</View>
    ),
    BottomSheetView: ({ children, ...props }: any) => (
      <View testID="bottom-sheet-view" {...props}>{children}</View>
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

// Mock recipeSearch to prevent auto-search side effects
jest.mock('../../src/lib/recipeSearch', () => ({
  searchRecipes: jest.fn(() => Promise.resolve([])),
}));

import { render, screen } from '@testing-library/react-native';
import { DishIdentifiedSheet } from '../../src/components/recipe-discovery/DishIdentifiedSheet';

const defaultProps = {
  isOpen: true,
  dish: { name: 'Pad Thai', confidence: 0.9, description: 'Thai noodle dish' },
  onClose: jest.fn(),
  onSearchResults: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DishIdentifiedSheet', () => {
  it('renders "Dish Identified" title when open with a dish', () => {
    render(<DishIdentifiedSheet {...defaultProps} />);
    expect(screen.getByText('Dish Identified')).toBeTruthy();
  });

  it('shows "High confidence" badge for confidence >= 0.8', () => {
    render(<DishIdentifiedSheet {...defaultProps} />);
    expect(screen.getByText('High confidence')).toBeTruthy();
  });

  it('shows dish name in text input', () => {
    render(<DishIdentifiedSheet {...defaultProps} />);
    expect(screen.getByDisplayValue('Pad Thai')).toBeTruthy();
  });

  it('shows dish description', () => {
    render(<DishIdentifiedSheet {...defaultProps} />);
    expect(screen.getByText('Thai noodle dish')).toBeTruthy();
  });

  it('shows "Find Recipes" button', () => {
    render(<DishIdentifiedSheet {...defaultProps} />);
    expect(screen.getByText('Find Recipes')).toBeTruthy();
  });

  it('shows "Medium confidence" and subtitle for confidence 0.6', () => {
    render(
      <DishIdentifiedSheet
        {...defaultProps}
        dish={{ name: 'Something', confidence: 0.6 }}
      />
    );
    expect(screen.getByText('Medium confidence')).toBeTruthy();
    expect(screen.getByText('Is this right?')).toBeTruthy();
  });

  it('shows "Low confidence" for confidence 0.3', () => {
    render(
      <DishIdentifiedSheet
        {...defaultProps}
        dish={{ name: 'Unknown', confidence: 0.3 }}
      />
    );
    expect(screen.getByText('Low confidence')).toBeTruthy();
  });

  it('shows "Log as Meal" button when onLogMeal provided', () => {
    render(
      <DishIdentifiedSheet {...defaultProps} onLogMeal={jest.fn()} />
    );
    expect(screen.getByText('Log as Meal')).toBeTruthy();
  });

  it('does NOT show "Log as Meal" when onLogMeal omitted', () => {
    render(<DishIdentifiedSheet {...defaultProps} />);
    expect(screen.queryByText('Log as Meal')).toBeNull();
  });

  it('returns null when dish is null', () => {
    const { toJSON } = render(
      <DishIdentifiedSheet {...defaultProps} dish={null} />
    );
    expect(toJSON()).toBeNull();
  });
});
