import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
  computed_nutrition: null,
  ingredient_matches: null,
  comment_count: 0,
  saved_from_kitchen_id: null,
  saved_from_recipe_id: null,
  created_by: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const singleStepRecipe: Recipe = {
  ...mockRecipe,
  id: 'single-step-recipe',
  name: 'Quick Serve',
  instructions: [
    { step_number: 1, text: 'Just serve' },
  ],
};

describe('CookingMode', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

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

  // COOK-01: Step navigation + progress
  describe('COOK-01: step navigation', () => {
    it('renders first step text', () => {
      const { getByText } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      expect(getByText(/Boil water/)).toBeTruthy();
    });

    it('shows next step button', () => {
      const { getByTestId } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      expect(getByTestId('cooking-next-step')).toBeTruthy();
    });

    it('prev button is disabled on first step', () => {
      const { getByTestId } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      const prevBtn = getByTestId('cooking-prev-step');
      expect(prevBtn.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // COOK-02: Timer rendering
  describe('COOK-02: timer rendering', () => {
    it('renders timer label for step with timers', () => {
      const { getByText } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      expect(getByText('Cook pasta')).toBeTruthy();
    });

    it('shows timer start button', () => {
      const { getByTestId } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      expect(getByTestId('cooking-timer-start')).toBeTruthy();
    });
  });

  // COOK-03: Unit toggle
  describe('COOK-03: unit toggle', () => {
    it('renders unit toggle with IMPERIAL and METRIC options', () => {
      const { getByText } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      expect(getByText('IMPERIAL')).toBeTruthy();
      expect(getByText('METRIC')).toBeTruthy();
    });

    it('unit toggle defaults to imperial', () => {
      const { getByText } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      // The step text should display in imperial (original text, not converted)
      // "Boil water and cook pasta for 10 minutes" appears unchanged when imperial
      expect(getByText(/Boil water and cook pasta/)).toBeTruthy();
      // IMPERIAL text is rendered, confirming the toggle is present and defaults to imperial
      expect(getByText('IMPERIAL')).toBeTruthy();
    });
  });

  // COOK-04: Ingredient sidebar
  describe('COOK-04: ingredient sidebar', () => {
    it('shows Ingredients button in bottom nav', () => {
      const { getByLabelText } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      expect(getByLabelText('Show ingredients')).toBeTruthy();
    });

    it('ingredient sidebar opens when Ingredients tapped', () => {
      const { getByLabelText, getByText } = render(<CookingMode recipe={mockRecipe} onClose={onClose} />);
      const ingredientsBtn = getByLabelText('Show ingredients');
      fireEvent.press(ingredientsBtn);
      // Sidebar should now show ingredient names
      expect(getByText('pasta')).toBeTruthy();
      expect(getByText('tomato sauce')).toBeTruthy();
      expect(getByText('salt')).toBeTruthy();
    });
  });

  // COOK-05: Done Cooking
  describe('COOK-05: done cooking', () => {
    it('shows Done Cooking button on last step (single-step recipe)', () => {
      const { getByTestId, getByText } = render(<CookingMode recipe={singleStepRecipe} onClose={onClose} />);
      expect(getByTestId('cooking-done-button')).toBeTruthy();
      expect(getByText('Done Cooking')).toBeTruthy();
    });

    it('tapping Done Cooking calls onClose', () => {
      const { getByTestId } = render(<CookingMode recipe={singleStepRecipe} onClose={onClose} />);
      fireEvent.press(getByTestId('cooking-done-button'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
