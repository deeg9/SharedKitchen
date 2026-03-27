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

// Mock supabase (needed since profile.tsx imports it directly)
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock SearchableSelect
jest.mock('../../src/components/ui/SearchableSelect', () => {
  const { View } = require('react-native');
  return {
    SearchableSelect: (props: any) => <View testID="dietary-search-mock" />,
    DIETARY_OPTIONS: ['Vegetarian', 'Gluten-Free', 'Dairy-Free'],
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

// Mock household store - default: no household
const mockHouseholdStore = {
  households: [] as any[],
  activeHouseholdId: null as string | null,
  members: [] as any[],
  loading: false,
  activeHousehold: () => null as any,
  setActiveHousehold: jest.fn(),
  initialize: jest.fn(),
};

jest.mock('../../src/stores/householdStore', () => ({
  useHouseholdStore: () => mockHouseholdStore,
}));

import { render, screen } from '@testing-library/react-native';
import ProfileScreen from '../../app/(app)/(tabs)/profile';

describe('ProfileScreen', () => {
  beforeEach(() => {
    // Reset to default no-household state
    mockHouseholdStore.households = [];
    mockHouseholdStore.activeHouseholdId = null;
    mockHouseholdStore.members = [];
    mockHouseholdStore.activeHousehold = () => null;
  });

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
    expect(screen.getByText('Create Kitchen')).toBeTruthy();
  });

  it('does not render App Settings section', () => {
    render(<ProfileScreen />);
    expect(screen.queryByText('App Settings')).toBeNull();
    expect(screen.queryByText('Dark Mode')).toBeNull();
  });

  it('renders dietary search input', () => {
    render(<ProfileScreen />);
    expect(screen.getByTestId('dietary-search-mock')).toBeTruthy();
  });

  it('renders Invite Members row when household exists', () => {
    const household = { id: 'h1', name: 'Test Kitchen', invite_code: 'abc', created_by: 'u1', created_at: '' };
    mockHouseholdStore.households = [household];
    mockHouseholdStore.activeHouseholdId = 'h1';
    mockHouseholdStore.activeHousehold = () => household;
    mockHouseholdStore.members = [
      {
        id: 'm1',
        household_id: 'h1',
        user_id: 'u1',
        role: 'admin',
        joined_at: '',
        profiles: { id: 'u1', display_name: 'Chef Alice', avatar_url: null },
      },
    ];

    render(<ProfileScreen />);
    expect(screen.getByText('Invite Members')).toBeTruthy();
    // "Test Kitchen" appears in both the kitchen list and active kitchen header
    const kitchenTexts = screen.getAllByText('Test Kitchen');
    expect(kitchenTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Chef Alice')).toBeTruthy();
    expect(screen.getByText('1 member')).toBeTruthy();
  });
});
