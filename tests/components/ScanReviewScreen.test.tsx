import React from 'react';

// Mock stores
jest.mock('../../src/stores/pantryStore', () => ({
  usePantryStore: jest.fn((selector: any) => {
    const state = { items: [], bulkAddPantryItems: jest.fn() };
    return selector(state);
  }),
}));

jest.mock('../../src/stores/householdStore', () => ({
  useHouseholdStore: jest.fn((selector: any) => {
    const state = { activeHouseholdId: 'h1' };
    return selector(state);
  }),
}));

// Mock hooks
jest.mock('../../src/hooks/useCameraPermission', () => ({
  useCameraPermission: () => ({
    showPrePrompt: false,
    checkAndPrompt: jest.fn(),
    requestAfterPrePrompt: jest.fn(),
    dismissPrePrompt: jest.fn(),
  }),
}));

// Mock child components that are hard to render
jest.mock('../../src/components/camera/CameraSheet', () => ({
  CameraSheet: () => null,
}));
jest.mock('../../src/components/camera/CameraPermissionPrompt', () => ({
  CameraPermissionPrompt: () => null,
}));
jest.mock('../../src/components/camera/VisionLoadingOverlay', () => ({
  VisionLoadingOverlay: () => null,
}));

// Mock libs
const mockFindDuplicates = jest.fn((items: any[]) => items);
jest.mock('../../src/lib/dedup', () => ({
  findDuplicates: (...args: any[]) => mockFindDuplicates(...args),
}));

jest.mock('../../src/lib/vision', () => ({
  analyzePhoto: jest.fn(),
  VisionRateLimitError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'VisionRateLimitError';
    }
  },
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScanReviewScreen } from '../../src/components/scan/ScanReviewScreen';

const defaultProps = {
  initialItems: [
    { name: 'Milk', category: 'Dairy & Eggs', quantity: '1' },
    { name: 'Eggs', quantity: '12' },
  ],
  onClose: jest.fn(),
  onSaved: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFindDuplicates.mockImplementation((items: any[]) => items);
});

describe('ScanReviewScreen', () => {
  it('renders "Review Items" header', () => {
    render(<ScanReviewScreen {...defaultProps} />);
    expect(screen.getByText('Review Items')).toBeTruthy();
  });

  it('renders each initial item name', () => {
    render(<ScanReviewScreen {...defaultProps} />);
    expect(screen.getByText('Milk')).toBeTruthy();
    expect(screen.getByText('Eggs')).toBeTruthy();
  });

  it('shows item count badge', () => {
    render(<ScanReviewScreen {...defaultProps} />);
    expect(screen.getByText('2 items')).toBeTruthy();
  });

  it('shows save button with item count', () => {
    render(<ScanReviewScreen {...defaultProps} />);
    expect(screen.getByText('Save 2 items')).toBeTruthy();
  });

  it('calls onClose when close button pressed', () => {
    render(<ScanReviewScreen {...defaultProps} />);
    // The close button renders the "close" icon via MaterialCommunityIcons mock
    const closeIcon = screen.getByTestId('icon-close');
    fireEvent.press(closeIcon);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows duplicate badge for items matching pantry', () => {
    mockFindDuplicates.mockImplementation((items: any[]) =>
      items.map((item: any) =>
        item.name === 'Milk'
          ? { ...item, duplicateOfId: 'p1', duplicateOfName: 'milk' }
          : item
      )
    );

    render(<ScanReviewScreen {...defaultProps} />);
    expect(screen.getByText(/Already in pantry/)).toBeTruthy();
  });
});
