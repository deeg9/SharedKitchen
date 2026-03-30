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

// Mock dates lib
const mockToday = new Date('2026-03-30T12:00:00.000Z');
const mockDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(mockToday);
  d.setDate(d.getDate() + i);
  return d;
});

jest.mock('../../src/lib/dates', () => ({
  getWeekDays: jest.fn(() => mockDays),
  toDateString: jest.fn((d: Date) => d.toISOString().slice(0, 10)),
  formatDayLabel: jest.fn((d: Date) => ({
    weekday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d.getDay() === 0 ? 6 : d.getDay() - 1],
    day: String(d.getDate()),
    month: 'Mar',
  })),
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealSlotPickerSheet } from '../../src/components/meal-logging/MealSlotPickerSheet';

const defaultProps = {
  isOpen: true,
  dishName: 'Pad Thai',
  onClose: jest.fn(),
  onSelect: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Mock Date to return our fixed date for isToday checks
  jest.useFakeTimers();
  jest.setSystemTime(mockToday);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('MealSlotPickerSheet', () => {
  it('renders "Log {dishName}" title', () => {
    render(<MealSlotPickerSheet {...defaultProps} />);
    expect(screen.getByText('Log Pad Thai')).toBeTruthy();
  });

  it('renders "Today" label for current day chip', () => {
    render(<MealSlotPickerSheet {...defaultProps} />);
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('renders meal type buttons (Breakfast, Lunch, Dinner)', () => {
    render(<MealSlotPickerSheet {...defaultProps} />);
    expect(screen.getByText('Breakfast')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
    expect(screen.getByText('Dinner')).toBeTruthy();
  });

  it('calls onSelect with date string and meal type when meal button pressed', () => {
    render(<MealSlotPickerSheet {...defaultProps} />);
    fireEvent.press(screen.getByText('Dinner'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      'dinner'
    );
  });
});
