import React from 'react';

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockBottomSheet = React.forwardRef(
    ({ children, index, ...props }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        expand: jest.fn(),
        close: jest.fn(),
        snapToIndex: jest.fn(),
      }));
      if (index === -1) return null;
      return <View {...props}>{children}</View>;
    }
  );

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetBackdrop: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
    BottomSheetView: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
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

// Mock auth store
const mockSignOut = jest.fn();
jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: null,
      },
    },
    signOut: mockSignOut,
    loading: false,
  }),
}));

// Mock household store
jest.mock('../../src/stores/householdStore', () => ({
  useHouseholdStore: () => ({
    households: [],
    activeHouseholdId: null,
    members: [],
    loading: false,
    activeHousehold: () => null,
    setActiveHousehold: jest.fn(),
    initialize: jest.fn(),
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../../app/(app)/(tabs)/profile';

describe('ProfileScreen', () => {
  it('renders user display name', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Test User')).toBeTruthy();
  });

  it('renders user email', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('renders sign out button', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('renders edit profile button', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Edit Profile')).toBeTruthy();
  });

  it('shows create household CTA when no household', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Create a Household')).toBeTruthy();
  });
});
