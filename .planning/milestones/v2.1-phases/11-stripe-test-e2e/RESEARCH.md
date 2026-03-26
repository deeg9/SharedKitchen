# Phase 11: Stripe Test Mode E2E - Research

**Researched:** 2026-03-25
**Domain:** Stripe payment integration testing, Supabase Edge Functions, React Native
**Confidence:** HIGH

## Summary

The Mise app has a complete Stripe integration built in Phase 5 (v2.0): three Edge Functions (`create-checkout-session`, `create-billing-portal`, `stripe-webhooks`), a client-side `src/lib/stripe.ts` helper with `openCheckout()` and `openBillingPortal()`, a `subscriptionStore` backed by a `subscriptions` table, and a `StripeProvider` wrapper in `_layout.tsx`. All code paths are wired and structurally sound.

However, the integration has never been tested end-to-end in Stripe test mode because **critical environment variables are missing from documentation and configuration**. The `.env.example` file has zero Stripe variables. The `.env` file has zero Stripe variables. The `@stripe/stripe-react-native` package is referenced in `app.json` plugins and imported in code but is **missing from `package.json` dependencies** -- meaning a fresh `npm install` will not install it.

This phase is primarily a documentation, configuration, and manual verification phase -- no new features need to be built. The code is done; the plumbing and testing are not.

**Primary recommendation:** Add missing env var documentation, install the missing Stripe package, configure Stripe test keys, deploy Edge Functions with secrets, and manually verify the full checkout-to-webhook-to-subscription flow.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Stripe test env vars documented in .env.example (publishable key, price ID) | `.env.example` currently has 0 Stripe vars. Need `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `EXPO_PUBLIC_STRIPE_PRICE_ID` |
| PAY-02 | Supabase Edge Function secrets documented for Stripe (secret key, webhook signing secret, price ID) | Edge Functions read `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `STRIPE_PRICE_ID` from `Deno.env`. Need documentation of how to set these via `supabase secrets set` |
| PAY-03 | Full checkout flow works in test mode | `openCheckout()` in `src/lib/stripe.ts` drives the flow. Requires valid test keys, deployed Edge Functions, and webhook endpoint configured in Stripe Dashboard |
| PAY-04 | Subscription status reflects correctly after checkout | `subscriptionStore.ts` polls via `refreshSubscription()` after payment. Webhook handler upserts to `subscriptions` table. Verify the full loop |
| PAY-05 | Billing portal opens and allows subscription management | `openBillingPortal()` calls `create-billing-portal` Edge Function which creates a Stripe Customer Portal session |
</phase_requirements>

## Codebase Inventory

### Client-Side Stripe Code

| File | Purpose | Key Details |
|------|---------|-------------|
| `app/_layout.tsx` (L128) | `StripeProvider` wrapper | Reads `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` from env |
| `src/lib/stripe.ts` | `openCheckout()`, `openBillingPortal()` | Reads `EXPO_PUBLIC_STRIPE_PRICE_ID` from env. Uses `@stripe/stripe-react-native` PaymentSheet |
| `src/stores/subscriptionStore.ts` | Zustand store for subscription state | Queries `subscriptions` table. Types: `free`, `active`, `past_due`, `canceled`, `trialing` |
| `src/components/premium/SubscriptionSheet.tsx` | Subscription management UI | Shows Free Plan vs Premium Plan. `testID="subscription-upgrade-button"`, `testID="subscription-manage-button"` |
| `src/components/premium/UpgradePrompt.tsx` | Upgrade bottom sheet | `testID="upgrade-prompt-button"`, `testID="upgrade-prompt-later"` |

### Edge Functions

| Function | Secrets Required | Purpose |
|----------|-----------------|---------|
| `create-checkout-session` | `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_PRICE_ID` | Creates Stripe subscription + ephemeral key + returns client secret for PaymentSheet |
| `stripe-webhooks` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` |
| `create-billing-portal` | `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Creates Stripe Customer Portal session, returns URL |

### Config

| File | Stripe-Relevant Config |
|------|----------------------|
| `supabase/config.toml` (L75-76) | `[functions.stripe-webhooks] verify_jwt = false` -- correct, webhooks use Stripe signature verification |
| `app.json` (L35-38) | `@stripe/stripe-react-native` plugin with `merchantIdentifier: "merchant.com.mise.app"`, `enableApplePay: true` |
| `supabase/migrations/00012_create_subscriptions.sql` | `subscriptions` table with RLS (SELECT-only for users), `processed_webhook_events` table for idempotency |

### Existing Maestro Tests

| File | What It Tests | Limitation |
|------|---------------|------------|
| `.maestro/premium-checkout.yaml` | Navigation to subscription screen, tapping upgrade, verifying loading state | Cannot complete Stripe PaymentSheet in Maestro -- stops at "Preparing secure checkout..." |
| `.maestro/negative-failed-payment.yaml` | Canceled payment flow, verifying user stays on free tier | Uses `back` to dismiss checkout, verifies free tier preserved |

## Critical Finding: Missing Package Dependency

**`@stripe/stripe-react-native` is NOT in `package.json`** despite being:
- Imported in `src/lib/stripe.ts` (line 3)
- Imported in `app/_layout.tsx` (line 21)
- Listed in `app.json` plugins (line 35)

This means a fresh `npm install` from the repo will fail to resolve the Stripe package. This must be fixed as the first task.

## Environment Variables -- Complete Inventory

### Client-Side (`.env` / `.env.example`)

| Variable | Currently in `.env.example` | Currently in `.env` | Required By |
|----------|---------------------------|--------------------|----|
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | NO | NO | `app/_layout.tsx` StripeProvider, must be `pk_test_...` |
| `EXPO_PUBLIC_STRIPE_PRICE_ID` | NO | NO | `src/lib/stripe.ts` openCheckout, must be `price_...` from Stripe Dashboard |

### Server-Side (Supabase Edge Function Secrets)

| Secret | Where Used | How to Set |
|--------|-----------|------------|
| `STRIPE_SECRET_KEY` | All 3 Edge Functions | `supabase secrets set STRIPE_SECRET_KEY=sk_test_...` |
| `STRIPE_WEBHOOK_SIGNING_SECRET` | `stripe-webhooks` | `supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...` |
| `STRIPE_PRICE_ID` | `create-checkout-session` (fallback) | `supabase secrets set STRIPE_PRICE_ID=price_...` |
| `SUPABASE_URL` | All 3 Edge Functions | Auto-provided by Supabase platform |
| `SUPABASE_ANON_KEY` | `create-checkout-session`, `create-billing-portal` | Auto-provided by Supabase platform |
| `SUPABASE_SERVICE_ROLE_KEY` | All 3 Edge Functions | Auto-provided by Supabase platform |

Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected by the Supabase platform for deployed Edge Functions. Only the 3 STRIPE_* secrets need manual configuration.

## Architecture Patterns

### Checkout Flow (PAY-03)

```
User taps "Upgrade to Premium"
  -> SubscriptionSheet.handleUpgrade()
    -> openCheckout() [src/lib/stripe.ts]
      -> supabase.functions.invoke('create-checkout-session', { body: { priceId } })
        -> Edge Function creates Stripe customer (if needed)
        -> Edge Function creates subscription with payment_behavior: 'default_incomplete'
        -> Returns clientSecret, ephemeralKey, customer
      -> initPaymentSheet({ paymentIntentClientSecret, customerEphemeralKeySecret, customerId })
      -> presentPaymentSheet()
      -> [User completes payment in native Stripe UI]
      -> Poll subscriptionStore.refreshSubscription() x5 at 2s intervals
      -> Return true when isPremium() or after 10s
```

### Webhook Flow (PAY-04)

```
Stripe fires webhook event
  -> POST /functions/v1/stripe-webhooks
    -> Verify Stripe-Signature header (constructEventAsync with SubtleCryptoProvider)
    -> Check processed_webhook_events for idempotency
    -> Switch on event.type:
      - checkout.session.completed: upsert subscription as 'active'
      - customer.subscription.updated: map Stripe status to app status
      - customer.subscription.deleted: set status='canceled'
      - invoice.payment_failed: set status='past_due'
    -> Insert event_id into processed_webhook_events
```

### Billing Portal Flow (PAY-05)

```
User taps "Manage Subscription"
  -> SubscriptionSheet.handleManageSubscription()
    -> openBillingPortal() [src/lib/stripe.ts]
      -> supabase.functions.invoke('create-billing-portal')
        -> Edge Function looks up stripe_customer_id from subscriptions table
        -> Creates billingPortal.sessions.create with return_url: 'sharedkitchen://subscription'
        -> Returns portal URL
      -> Linking.openURL(data.url)  [opens in device browser]
```

## Stripe Test Mode Setup Checklist

These are the manual steps required in the Stripe Dashboard (test mode) before the flow can work:

1. **Get API keys:** Dashboard > Developers > API Keys > copy `pk_test_...` and `sk_test_...`
2. **Create a Product + Price:** Dashboard > Products > Add product > $9.99/month recurring > copy `price_...` ID
3. **Configure webhook endpoint:** Dashboard > Developers > Webhooks > Add endpoint
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhooks`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the signing secret `whsec_...`
4. **Configure Customer Portal:** Dashboard > Settings > Billing > Customer portal > Enable and save
5. **Test card numbers:** `4242424242424242` (success), `4000000000000002` (decline)

## Common Pitfalls

### Pitfall 1: Webhook URL Must Match Deployed Function URL Exactly
**What goes wrong:** Webhook events silently fail if the URL doesn't match the deployed Supabase function URL.
**Why it happens:** The Supabase project ref must be correct, and the path must be exactly `/functions/v1/stripe-webhooks`.
**How to avoid:** Verify the webhook endpoint URL using `supabase functions list` to see deployed function URLs.
**Warning signs:** Checkout appears to succeed (payment intent is confirmed) but subscription row never updates from 'free' to 'active'.

### Pitfall 2: SubtleCrypto Provider Required for Deno Webhook Verification
**What goes wrong:** `stripe.webhooks.constructEvent()` (sync) fails in Deno runtime.
**Why it happens:** Deno doesn't have Node.js crypto APIs. Must use `constructEventAsync()` with `Stripe.createSubtleCryptoProvider()`.
**How to avoid:** Already handled correctly in the codebase (line 12, 36 of stripe-webhooks/index.ts). Do not "simplify" to sync version.

### Pitfall 3: Missing @stripe/stripe-react-native Package
**What goes wrong:** Build fails with module resolution error.
**Why it happens:** Package is in app.json plugins and imported in code but missing from package.json.
**How to avoid:** Run `npx expo install @stripe/stripe-react-native` (not `npm install` -- expo install ensures compatible version).
**Warning signs:** TypeScript errors on import, metro bundler failure.

### Pitfall 4: checkout.session.completed vs invoice.paid for Subscription Activation
**What goes wrong:** The webhook handler listens for `checkout.session.completed` to activate subscriptions. This only fires for the FIRST payment via Stripe Checkout. But the Edge Function uses `stripe.subscriptions.create()` (not Checkout Sessions), so the event that actually fires is `invoice.paid` or `customer.subscription.updated`.
**Why it happens:** The code creates subscriptions via the API (PaymentSheet approach), not via Stripe Checkout Sessions. The `checkout.session.completed` event path may never fire.
**How to avoid:** During testing, verify which events actually fire. The `customer.subscription.updated` handler (line 110) should catch the status change to 'active'. If `checkout.session.completed` doesn't fire, the subscription may still activate via the `updated` event -- but the `updated` handler uses `stripe_subscription_id` match (not `user_id`), so the subscription row must already have `stripe_subscription_id` populated.
**Warning signs:** Payment succeeds in PaymentSheet but subscription stays 'free' and `checkout.session.completed` never appears in Stripe webhook logs.

### Pitfall 5: Subscription Row Missing stripe_subscription_id Before Webhook
**What goes wrong:** `customer.subscription.updated` handler updates by matching `stripe_subscription_id`, but `create-checkout-session` only stores `stripe_customer_id` (not subscription ID) when creating the initial row.
**Why it happens:** `create-checkout-session` upserts with `{ user_id, stripe_customer_id, status: 'free' }` but does not store the `stripe_subscription_id` from the created subscription.
**How to avoid:** Either (a) update `create-checkout-session` to also store `stripe_subscription_id` in the upsert, or (b) ensure `checkout.session.completed` fires and handles the initial activation (it does store the subscription ID). Testing will reveal which path actually fires.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stripe webhook testing | Custom HTTP scripts to simulate webhooks | `stripe listen --forward-to` CLI | Handles signature generation, event formatting, retries |
| Payment UI | Custom card input form | Stripe PaymentSheet (already used) | PCI compliance, 3D Secure handling |
| Subscription state polling | Custom WebSocket or realtime channel | Current polling approach (5x at 2s) is fine for this | Webhook latency is typically <2s; polling is simpler and already implemented |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI | Edge Function deployment, secrets management | Yes | 2.39.2 | -- |
| Stripe CLI | Webhook forwarding for local testing | Yes | 1.34.0 | -- |
| Maestro | E2E tests (pre-existing) | Unknown | -- | Manual testing |
| `@stripe/stripe-react-native` | Client-side PaymentSheet | NOT INSTALLED | -- | Must install before any testing |

**Missing dependencies with no fallback:**
- `@stripe/stripe-react-native` must be installed via `npx expo install @stripe/stripe-react-native`

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Maestro (E2E) + manual verification (webhook flow) |
| Config file | `.maestro/config.yaml` |
| Quick run command | `maestro test .maestro/premium-checkout.yaml` |
| Full suite command | `maestro test .maestro/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-01 | Env vars documented in .env.example | manual inspection | `grep STRIPE .env.example` | N/A (documentation task) |
| PAY-02 | Edge Function secrets documented | manual inspection | `grep -r STRIPE_ supabase/functions/` | N/A (documentation task) |
| PAY-03 | Full checkout flow in test mode | manual E2E | Cannot fully automate (requires Stripe PaymentSheet interaction) | Partial: `.maestro/premium-checkout.yaml` |
| PAY-04 | Subscription status reflects after checkout | manual E2E | `supabase db query "SELECT status FROM subscriptions WHERE user_id='...'"` after checkout | No |
| PAY-05 | Billing portal opens | manual E2E | Cannot automate (opens browser) | No |

### Sampling Rate
- **Per task commit:** `grep STRIPE .env.example` for PAY-01/02; visual verification for PAY-03/04/05
- **Per wave merge:** Full manual checkout test with test card
- **Phase gate:** All 5 requirements manually verified with test Stripe keys

### Wave 0 Gaps
- None -- this phase is primarily documentation + manual verification, not code changes that benefit from automated tests

## Open Questions

1. **Which webhook event actually fires for PaymentSheet-based subscriptions?**
   - What we know: Code handles `checkout.session.completed` and `customer.subscription.updated`. The Edge Function uses `stripe.subscriptions.create()` (not Checkout Sessions API).
   - What's unclear: Whether `checkout.session.completed` fires at all, or only `customer.subscription.updated` fires.
   - Recommendation: Test with `stripe listen --forward-to` and observe which events arrive. Fix webhook handler if needed.

2. **Is `stripe_subscription_id` populated before the `updated` webhook fires?**
   - What we know: `create-checkout-session` does NOT store `stripe_subscription_id`. The `checkout.session.completed` handler stores it. The `customer.subscription.updated` handler matches on it.
   - What's unclear: If `checkout.session.completed` doesn't fire, the `updated` handler won't find the row.
   - Recommendation: Likely need to update `create-checkout-session` to store the subscription ID in the row before returning.

3. **Apple Pay configuration -- is merchant ID registered?**
   - What we know: `app.json` has `merchantIdentifier: "merchant.com.mise.app"` and `enableApplePay: true`.
   - What's unclear: Whether this merchant ID is actually registered with Apple. Not needed for test mode card payments.
   - Recommendation: Ignore for this phase. Card-based test mode works without Apple Pay configuration.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all Stripe-related files (listed above)
- Stripe API version `2024-11-20` used in Edge Functions (confirmed in code)
- Supabase Edge Function documentation for `verify_jwt = false` configuration

### Secondary (MEDIUM confidence)
- Stripe documentation on PaymentSheet vs Checkout Sessions event differences (training data, not freshly verified)

### Tertiary (LOW confidence)
- The exact webhook events fired by `stripe.subscriptions.create()` with `payment_behavior: 'default_incomplete'` -- needs live testing to confirm

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all code exists and was inspected directly
- Architecture: HIGH - full flow traced through codebase
- Pitfalls: HIGH for items 1-3, MEDIUM for items 4-5 (need live testing to confirm event flow)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- Stripe APIs versioned, code is frozen)
