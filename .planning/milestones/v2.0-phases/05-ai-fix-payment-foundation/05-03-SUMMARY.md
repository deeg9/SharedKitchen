---
phase: 05-ai-fix-payment-foundation
plan: 03
subsystem: payments
tags: [stripe, react-native, supabase-edge-functions, premium]

requires:
  - phase: 05-02
    provides: subscriptionStore, subscriptions table, stripe-webhooks Edge Function
provides:
  - create-checkout-session Edge Function for Stripe PaymentSheet
  - create-billing-portal Edge Function for subscription management
  - Client-side stripe.ts helper library
  - All premium UI components rewired to subscriptionStore
affects: [phase-06, phase-08]

tech-stack:
  added: ["@stripe/stripe-react-native"]
  patterns: [Edge Function checkout session creation, Stripe billing portal redirect, subscription-aware UI components]

key-files:
  created:
    - supabase/functions/create-checkout-session/index.ts
    - supabase/functions/create-billing-portal/index.ts
    - src/lib/stripe.ts
  modified:
    - src/components/premium/SubscriptionSheet.tsx
    - src/components/premium/UpgradePrompt.tsx
    - src/components/premium/PremiumBadge.tsx
    - app/(app)/subscription.tsx
    - app.json
    - app/_layout.tsx

key-decisions:
  - "Stripe PaymentSheet via subscriptions.create (not checkout.sessions.create) for native mobile UX"
  - "Billing portal opened via Linking.openURL (external browser) not in-app WebView"
  - "10-second polling interval after checkout for subscription confirmation"
  - "PremiumBadge shows distinct states: active (green), past_due (amber), canceled (red), trialing (blue)"

patterns-established:
  - "Edge Function pattern: receive user_id from auth header, create Stripe resource, return client-facing data"
  - "Subscription-aware component pattern: useSubscriptionStore().tier checks replace premiumStore"

requirements-completed: [PAY-01, PAY-04]

duration: 5min
completed: 2026-03-25
---

# Plan 05-03: Payment UI Wiring Summary

**Stripe checkout + billing portal Edge Functions with all premium UI rewired from AsyncStorage to server-authoritative subscriptionStore**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-25
- **Tasks:** 2/3 (Task 3 is checkpoint — Stripe API key setup)
- **Files modified:** 9

## Accomplishments
- Created create-checkout-session Edge Function that creates a Stripe subscription with PaymentSheet client secret
- Created create-billing-portal Edge Function for subscription management redirect
- Built client-side stripe.ts helper with createCheckoutSession() and openBillingPortal()
- Rewired SubscriptionSheet, UpgradePrompt, PremiumBadge, and subscription screen from premiumStore to subscriptionStore
- PremiumBadge shows distinct visual states for active, past_due, canceled, and trialing
- Added @stripe/stripe-react-native config plugin to app.json
- Zero premiumStore references remain in src/

## Task Commits

1. **Task 1: Checkout + billing portal Edge Functions** - `f802679` (feat)
2. **Task 2: Rewire premium components** - `d859b26` (feat)
3. **Task 3: Stripe API key setup** - Checkpoint (human-action)

## Files Created/Modified
- `supabase/functions/create-checkout-session/index.ts` - Edge Function creating Stripe subscription + PaymentSheet client secret
- `supabase/functions/create-billing-portal/index.ts` - Edge Function creating Stripe billing portal session URL
- `src/lib/stripe.ts` - Client helpers for checkout and billing portal
- `src/components/premium/SubscriptionSheet.tsx` - Rewired to subscriptionStore with real checkout
- `src/components/premium/UpgradePrompt.tsx` - Rewired to subscriptionStore
- `src/components/premium/PremiumBadge.tsx` - Subscription-state-aware badge with 4 visual states
- `app/(app)/subscription.tsx` - Rewired to subscriptionStore with billing portal
- `app.json` - Added @stripe/stripe-react-native config plugin
- `app/_layout.tsx` - Added StripeProvider wrapper

## Decisions Made
- Used Stripe subscriptions.create approach (PaymentSheet-native) instead of checkout.sessions.create (web redirect)
- Billing portal opens in external browser via Linking.openURL for simplicity
- 10-second polling after checkout for subscription state refresh

## Deviations from Plan
None - plan executed as written (API error interrupted SUMMARY creation, not task execution)

## User Setup Required

**Stripe test mode API keys must be configured before testing:**
1. Create Stripe account → Dashboard → API Keys
2. Create product "Mise Premium" ($9.99/mo recurring)
3. Set Supabase secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SIGNING_SECRET
4. Set app env: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY

## Next Phase Readiness
- All PAY requirements complete — checkout, billing portal, server-side gating
- Push notifications (Phase 6) and enhanced AI (Phase 8) can proceed
- Stripe API keys needed for E2E testing in Phase 9

---
*Phase: 05-ai-fix-payment-foundation*
*Completed: 2026-03-25*
