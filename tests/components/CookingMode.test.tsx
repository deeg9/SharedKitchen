import React from 'react';
import { render } from '@testing-library/react-native';
import { CookingMode } from '../../src/components/cooking/CookingMode';
import { Recipe } from '../../src/types/database';

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (c: any) => c,
    },
    useAnimatedStyle: () => ({}),
    useSharedValue: (v: any) => ({ value: v }),
    withTiming: (v: any) => v,
    Easing: { out: jest.fn(() => jest.fn()), inOut: jest.fn(() => jest.fn()) },
    FadeIn: { duration: jest.fn().mockReturnThis() },
  };
});

const mockRecipe: Recipe = {
  id: 'test-recipe-1',
  household_id: 'test-household',
  name: 'Test Pasta',
  category: 'Italian',
  image_url: null,
  prep_time_minutes: 10,
  cook_time_minutes: 20,
  servings: 4,
  estimated_cost: 15,
  ingredients: [
    { amount: 1, unit: 'lb', name: 'pasta' },
    { amount: 2, unit: 'cups', name: 'tomato sauce' },
    { amount: 1, unit: 'tsp', name: 'salt' },
  ],
  instructions: [
    { step_number: 1, text: 'Boil water and cook pasta for 10 minutes', timers: [{ duration_seconds: 600, label: 'Cook pasta' }] },
    { step_number: 2, text: 'Heat tomato sauce in a pan' },
    { step_number: 3, text: 'Combine pasta and sauce, serve hot' },
  ],
  tags: ['easy', 'italian'],
  source_url: null,
  nutrition_info: null,
  source_image_url: null,
  created_by: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('CookingMode', () => {
  const onClose = jest.fn();

  it('renders without crashing', () => {
    const { toJSON } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows correct step count', () => {
    const { getByText } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
    expect(getByText(/Step 1 of 3/i)).toBeTruthy();
  });

  it('renders CookingProgress', () => {
    const { getByTestId } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
    expect(getByTestId('cooking-progress')).toBeTruthy();
  });
});
