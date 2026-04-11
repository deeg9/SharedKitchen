import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// This import will fail until Plan 44-03 creates the component
// import { HandleSetupInterstitial } from '../../src/components/handle/HandleSetupInterstitial';

describe('HandleSetupInterstitial', () => {
  it.todo('renders "Choose your handle" heading');
  it.todo('renders as full-screen overlay with accessibilityViewIsModal');
  it.todo('disables CTA when handle is empty or invalid');
  it.todo('calls updateHandle on CTA press and onComplete on success');
  it.todo('shows "This handle was just taken" on 23505 race condition');
  it.todo('generates suggestions from display name on mount');
});
