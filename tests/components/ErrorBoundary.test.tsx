import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { Text } from 'react-native';

// Suppress console.error during error boundary tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>Child content</Text>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Safe content</Text>
      </ErrorBoundary>
    );
    expect(getByText('Safe content')).toBeTruthy();
  });

  it('renders fallback UI with "Something went wrong" when child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders a "Try Again" button in the fallback', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('clears error and re-renders children when "Try Again" is pressed', () => {
    // First render the boundary with a throwing child to trigger error state
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    // Re-render with a non-throwing child, then press Try Again
    // The ErrorBoundary will clear hasError and render the new children
    rerender(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.press(getByText('Try Again'));
    expect(getByText('Child content')).toBeTruthy();
  });
});
