import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TabBar } from '../../src/components/ui/TabBar';

// Create mock navigation props
function createMockProps(activeIndex = 0) {
  const routes = [
    { key: 'plan-key', name: 'plan', params: undefined },
    { key: 'recipes-key', name: 'recipes', params: undefined },
    { key: 'grocery-key', name: 'grocery', params: undefined },
    { key: 'budget-key', name: 'budget', params: undefined },
    { key: 'profile-key', name: 'profile', params: undefined },
  ];

  return {
    state: {
      index: activeIndex,
      routes,
      key: 'tab-state',
      routeNames: routes.map((r) => r.name),
      type: 'tab',
      stale: false as const,
      history: [],
    },
    descriptors: routes.reduce(
      (acc, route) => ({
        ...acc,
        [route.key]: {
          options: {},
          render: () => null,
          navigation: { emit: jest.fn() },
        },
      }),
      {}
    ),
    navigation: {
      emit: jest.fn(() => ({ defaultPrevented: false })),
      navigate: jest.fn(),
    },
    insets: { top: 0, bottom: 34, left: 0, right: 0 },
  } as any;
}

describe('TabBar', () => {
  it('renders 5 tab items', () => {
    render(<TabBar {...createMockProps()} />);

    expect(screen.getByText('Plan')).toBeTruthy();
    expect(screen.getByText('Recipes')).toBeTruthy();
    expect(screen.getByText('Kitchen')).toBeTruthy();
    expect(screen.getByText('Budget')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('renders correct icons for each tab', () => {
    render(<TabBar {...createMockProps()} />);

    expect(screen.getByTestId('icon-calendar-week')).toBeTruthy();
    expect(screen.getByTestId('icon-book-open-variant')).toBeTruthy();
    expect(screen.getByTestId('icon-fridge-outline')).toBeTruthy();
    expect(screen.getByTestId('icon-chart-pie')).toBeTruthy();
    expect(screen.getByTestId('icon-account')).toBeTruthy();
  });

  it('navigates to tab on press', () => {
    const props = createMockProps(0);
    render(<TabBar {...props} />);

    fireEvent.press(screen.getByText('Recipes'));
    expect(props.navigation.navigate).toHaveBeenCalledWith('recipes');
  });

  it('uses BlurView for glassmorphic background', () => {
    render(<TabBar {...createMockProps()} />);
    expect(screen.getByTestId('blur-view')).toBeTruthy();
  });
});
