import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// This import will be updated when Plan 44-03 modifies root layout
// import RootLayout from '../../src/app/_layout';

describe('Root Layout - Handle Gate', () => {
  it.todo('renders HandleSetupInterstitial when session exists, handleChecked is true, and handle is null');
  it.todo('does not render HandleSetupInterstitial when handle is set');
  it.todo('does not render HandleSetupInterstitial during onboarding');
  it.todo('keeps splash screen visible until handleChecked is true');
});
