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

// Mock supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'mock-path' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://mock-url.com/avatar.jpg' } })),
      })),
    },
  },
}));

// Mock auth store
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
    loading: false,
  }),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock base64-arraybuffer
jest.mock('base64-arraybuffer', () => ({
  decode: jest.fn(() => new ArrayBuffer(8)),
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import EditProfileScreen from '../../app/(app)/edit-profile';

describe('EditProfileScreen', () => {
  it('renders edit profile title', () => {
    render(<EditProfileScreen />);
    expect(screen.getByText('Edit Profile')).toBeTruthy();
  });

  it('renders display name input with current value', () => {
    render(<EditProfileScreen />);
    expect(screen.getByText('Display Name')).toBeTruthy();
    expect(screen.getByDisplayValue('Test User')).toBeTruthy();
  });

  it('renders Change Photo button', () => {
    render(<EditProfileScreen />);
    expect(screen.getByText('Change Photo')).toBeTruthy();
  });

  it('renders Save button', () => {
    render(<EditProfileScreen />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('renders Cancel button', () => {
    render(<EditProfileScreen />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('Save button disabled when name is empty', () => {
    render(<EditProfileScreen />);
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.changeText(nameInput, '');

    // The Save button's parent Pressable should be disabled
    const saveText = screen.getByText('Save');
    // Walk up to find the Pressable with accessibilityState
    const pressable = saveText.parent?.parent;
    expect(pressable?.props.accessibilityState?.disabled).toBe(true);
  });
});
