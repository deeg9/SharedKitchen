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
    // Use a wrapper that controls whether the child throws
    function Wrapper() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <ThrowingChild shouldThrow />
          ) : (
            <Text>Recovered</Text>
          )}
        </ErrorBoundary>
      );
    }

    // Since ErrorBoundary resets state, the child won't throw on re-render
    // We need a different approach: the ThrowingChild only throws once
    let throwCount = 0;
    function ThrowOnce() {
      throwCount++;
      if (throwCount === 1) {
        throw new Error('One-time error');
      }
      return <Text>Recovered content</Text>;
    }

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowOnce />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    fireEvent.press(getByText('Try Again'));
    expect(getByText('Recovered content')).toBeTruthy();
  });
});
