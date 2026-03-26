import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../src/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders icon and title (required props only)', () => {
    const { getByText, getByTestId } = render(
      <EmptyState icon="cart-outline" title="No items" />
    );
    expect(getByText('No items')).toBeTruthy();
    expect(getByTestId('icon-cart-outline')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <EmptyState icon="cart-outline" title="No items" subtitle="Add some items" />
    );
    expect(getByText('Add some items')).toBeTruthy();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        icon="cart-outline"
        title="No items"
        actionLabel="Add Item"
        onAction={onAction}
      />
    );
    expect(getByText('Add Item')).toBeTruthy();
  });

  it('does not render action button when only actionLabel provided (no onAction)', () => {
    const { queryByText } = render(
      <EmptyState icon="cart-outline" title="No items" actionLabel="Add Item" />
    );
    expect(queryByText('Add Item')).toBeNull();
  });

  it('calls onAction when action button is pressed', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        icon="cart-outline"
        title="No items"
        actionLabel="Add Item"
        onAction={onAction}
      />
    );
    fireEvent.press(getByText('Add Item'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
