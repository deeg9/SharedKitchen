import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { supabase } from './supabase';
import { useSubscriptionStore } from '../stores/subscriptionStore';

const STRIPE_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_ID ?? '';

/**
 * Opens Stripe PaymentSheet for premium subscription checkout.
 * Returns true if payment succeeded, false if canceled/failed.
 */
export async function openCheckout(): Promise<boolean> {
  // 1. Create checkout session via Edge Function
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId: STRIPE_PRICE_ID },
  });

  if (error || !data?.clientSecret) {
    throw new Error(data?.error ?? error?.message ?? 'Failed to create checkout session');
  }

  // 2. Initialize PaymentSheet
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: data.clientSecret,
    customerEphemeralKeySecret: data.ephemeralKey,
    customerId: data.customer,
    merchantDisplayName: 'Mise',
    allowsDelayedPaymentMethods: false,
  });

  if (initError) {
    throw new Error(initError.message);
  }

  // 3. Present PaymentSheet
  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    if (presentError.code === 'Canceled') {
      return false; // User canceled -- not an error
    }
    throw new Error(presentError.message);
  }

  // 4. Poll for subscription activation (webhook typically fires within 2s)
  const store = useSubscriptionStore.getState();
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await store.refreshSubscription();
    if (useSubscriptionStore.getState().isPremium()) {
      return true;
    }
  }

  // Payment succeeded but webhook hasn't arrived yet
  return true;
}

/**
 * Opens Stripe-hosted billing portal for subscription management.
 */
export async function openBillingPortal(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-billing-portal');

  if (error || !data?.url) {
    throw new Error(data?.error ?? error?.message ?? 'Failed to open billing portal');
  }

  await Linking.openURL(data.url);
}
