# Phase 5: AI Fix & Payment Foundation - Research

**Researched:** 2026-03-25
**Domain:** OpenAI model upgrade (gpt-4o-mini to gpt-5-mini), Stripe subscription payments with Supabase Edge Functions, server-authoritative premium gating via RLS
**Confidence:** HIGH

## Summary

Phase 5 addresses two critical needs: fixing a production regression (recipe import broken due to gpt-4o-mini deprecation) and building the revenue foundation (Stripe subscription checkout, webhook-driven subscription state, server-enforced premium gating). The AI fix is a targeted 30-minute change to one Edge Function. The payment foundation is a multi-component integration spanning 3 new Edge Functions, 1 new database table with RLS, a new Zustand store replacing the AsyncStorage-based premiumStore, and client-side integration with the existing subscription UI.

The existing codebase provides strong foundations: `premiumStore.ts` already defines `canAccess()` and `PREMIUM_FEATURES` -- the API surface stays identical, only the data source changes from AsyncStorage to Supabase. The `SubscriptionSheet.tsx` and `UpgradePrompt.tsx` components already render the $9.99/mo price and feature comparison -- they need wiring to real Stripe checkout instead of calling `upgradeToPremium()` directly. The `parse-recipe-url` Edge Function is a self-contained file where `model: 'gpt-4o-mini'` must become `model: 'gpt-5-mini'` and `response_format` upgraded to structured outputs.

**Primary recommendation:** Fix the AI model first (immediate production fix), then build the subscription table and webhook handler (security foundation), then wire the checkout flow and billing portal (user-facing payment), then add rate limiting and caching to AI features (cost control).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-03 | Recipe import uses gpt-5-mini with structured outputs replacing deprecated gpt-4o-mini | Direct model swap in `parse-recipe-url/index.ts`; upgrade `response_format` to `json_schema` type; increase HTML truncation limit from 15K to 50K+ chars |
| AI-07 | AI features include per-user rate limiting and response caching to control costs | Rate limit table or in-memory check in Edge Function; cache layer keyed by URL hash for recipe parsing; `max_tokens` tuning |
| PAY-01 | User can purchase premium subscription ($9.99/mo) via Stripe checkout | `create-checkout-session` Edge Function + `@stripe/stripe-react-native` StripeProvider + PaymentSheet; wire existing SubscriptionSheet upgrade button |
| PAY-02 | Subscription state is server-authoritative (Supabase `subscriptions` table updated by Stripe webhooks) | New `subscriptions` table with RLS; `subscriptionStore.ts` replaces `premiumStore.ts`; reads from DB not AsyncStorage |
| PAY-03 | Stripe webhook Edge Function handles subscription lifecycle events with idempotent processing | `stripe-webhooks` Edge Function with `verify_jwt = false` + Stripe signature verification; handles created/updated/canceled/payment_failed events; idempotent via event ID dedup |
| PAY-04 | User can manage subscription via Stripe-hosted billing portal | `create-billing-portal` Edge Function returns portal URL; wire existing "Manage Subscription" button in SubscriptionSheet |
| PAY-05 | Premium features enforced server-side via RLS policies | RLS on `subscriptions` table (users read own only, service_role writes); premium-gated data queries join against active subscription status |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @stripe/stripe-react-native | 0.60.0 | Client-side PaymentSheet UI for subscription checkout | Official Stripe SDK with Expo config plugin; handles PCI compliance, 3D Secure. Only viable Stripe SDK for React Native. |
| stripe (Deno via esm.sh) | ^17.x (import from esm.sh) | Server-side Stripe API in Edge Functions | Webhook signature verification, customer creation, checkout session creation, billing portal. Import as `https://esm.sh/stripe@17?target=denonext` |
| gpt-5-mini (OpenAI API) | API model string | Recipe extraction replacing deprecated gpt-4o-mini | Drop-in replacement; $0.25/1M input tokens; 400K context window; structured outputs support |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Stripe CLI | latest | Local webhook testing during development | `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhooks` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe external payment | Apple IAP via RevenueCat | Only if Apple reverses 0% commission ruling; adds 15-30% commission + SDK complexity |
| Stripe PaymentSheet | Stripe Checkout (web redirect) | PaymentSheet is native and faster; Checkout requires opening a browser but is simpler for subscription-only flows |

**Installation:**
```bash
npx expo install @stripe/stripe-react-native
# Dev tool (not project dependency)
brew install stripe/stripe-cli/stripe
```

**Version verification:** `@stripe/stripe-react-native@0.60.0` confirmed current via npm registry (2026-03-25). `stripe@20.4.1` is latest server-side SDK -- for Deno Edge Functions, import via esm.sh at version 17+ for Deno compatibility.

## Architecture Patterns

### Recommended Project Structure (additions only)
```
supabase/
  functions/
    parse-recipe-url/       # EXISTING -- modify model + response_format
      index.ts
    stripe-webhooks/         # NEW
      index.ts
    create-checkout-session/ # NEW
      index.ts
    create-billing-portal/   # NEW
      index.ts
  migrations/
    00011_create_subscriptions.sql  # NEW
  config.toml                       # MODIFIED (verify_jwt = false for stripe-webhooks)

src/
  stores/
    subscriptionStore.ts    # NEW (replaces premiumStore.ts)
  lib/
    stripe.ts               # NEW -- Stripe helpers (open checkout, billing portal)
  components/
    premium/
      SubscriptionSheet.tsx  # MODIFIED -- wire to real Stripe checkout
      UpgradePrompt.tsx      # MODIFIED -- wire to real Stripe checkout

app/
  _layout.tsx               # MODIFIED -- wrap with StripeProvider
  (app)/subscription.tsx    # MODIFIED -- use subscriptionStore instead of premiumStore
```

### Pattern 1: Server-Authoritative Subscription State
**What:** Subscription status lives in `subscriptions` Postgres table. Only Stripe webhooks (via Edge Function with service_role key) can write. Client reads on launch, caches in Zustand.
**When to use:** Always for paid features.
**Example:**
```typescript
// subscriptionStore.ts -- replaces premiumStore.ts
// Source: Architecture research + existing premiumStore.ts pattern
interface SubscriptionState {
  tier: 'free' | 'premium';
  status: 'free' | 'active' | 'past_due' | 'canceled' | 'trialing';
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  loading: boolean;

  isPremium: () => boolean;
  canAccess: (feature: string) => boolean;  // Same API as premiumStore
  initialize: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openBillingPortal: () => Promise<void>;
}

// initialize() queries supabase.from('subscriptions').select('*').eq('user_id', userId).single()
// canAccess() logic unchanged -- checks tier against PREMIUM_FEATURES constant
// openCheckout() calls create-checkout-session Edge Function, then presentPaymentSheet()
// openBillingPortal() calls create-billing-portal Edge Function, opens URL in browser
```

### Pattern 2: Stripe Webhook with Signature Verification
**What:** Edge Function disables JWT verification but verifies Stripe webhook signature. Handles subscription lifecycle events idempotently.
**When to use:** The `stripe-webhooks` Edge Function.
**Example:**
```typescript
// Source: Supabase Stripe webhooks example (GitHub)
import Stripe from 'https://esm.sh/stripe@17?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20',
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined, cryptoProvider
    )
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }

  // Use service_role key to bypass RLS for writes
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  switch (event.type) {
    case 'checkout.session.completed':
      // Create/activate subscription record
      break
    case 'customer.subscription.updated':
      // Handle plan changes, renewals
      break
    case 'customer.subscription.deleted':
      // Mark subscription as canceled
      break
    case 'invoice.payment_failed':
      // Set status to past_due
      break
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
```

### Pattern 3: Checkout Session Flow
**What:** App calls Edge Function to create Stripe Checkout Session, receives clientSecret, presents PaymentSheet.
**When to use:** When user taps "Upgrade to Premium".
**Example:**
```typescript
// Client-side flow (src/lib/stripe.ts)
// 1. Call Edge Function to create checkout session
const { data } = await supabase.functions.invoke('create-checkout-session', {
  body: { priceId: 'price_xxx' }
})
// 2. Initialize and present PaymentSheet
const { error } = await initPaymentSheet({
  paymentIntentClientSecret: data.clientSecret,
  merchantDisplayName: 'Mise'
})
await presentPaymentSheet()
// 3. Stripe webhook fires -> updates subscriptions table
// 4. Client refreshes subscription state from DB
```

### Pattern 4: Rate Limiting in Edge Functions
**What:** Per-user rate checks before expensive AI operations.
**When to use:** `parse-recipe-url` and any future AI Edge Functions.
**Example:**
```typescript
// In Edge Function: check rate limit before calling OpenAI
const { count } = await supabaseAdmin
  .from('ai_usage_log')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

const limit = isPremium ? 50 : 10
if (count >= limit) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
}
```

### Anti-Patterns to Avoid
- **Client-side subscription writes:** Never call `upgradeToPremium()` or set subscription state from the client. Only webhooks write subscription data.
- **Missing Stripe signature verification:** `verify_jwt = false` without `constructEventAsync()` leaves endpoint open to anyone.
- **Hardcoded model names:** Use environment variable `OPENAI_MODEL` to prevent future deprecation breakage.
- **No idempotency on webhooks:** Stripe can send the same event multiple times. Use event ID dedup.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment UI/PCI compliance | Custom card form | Stripe PaymentSheet | PCI compliance is impossible to hand-roll; PaymentSheet handles 3D Secure, Apple Pay, validation |
| Subscription billing portal | Custom cancellation/management UI | Stripe Customer Portal (hosted) | Stripe handles dunning, payment method updates, proration, invoices |
| Webhook signature verification | Custom HMAC verification | `stripe.webhooks.constructEventAsync()` | Stripe's library handles timing-safe comparison, payload reconstruction, clock skew |
| Structured JSON from LLM | Custom JSON parsing/validation | OpenAI `response_format: { type: 'json_schema' }` | Structured outputs guarantee valid JSON matching your schema; no parsing errors |

**Key insight:** Stripe's hosted components (PaymentSheet, Customer Portal) handle enormous complexity (PCI compliance, SCA/3D Secure, dunning, proration) that would take months to build and maintain. The Edge Function layer is thin glue code.

## Common Pitfalls

### Pitfall 1: gpt-4o-mini Deprecated -- Recipe Import Broken in Production
**What goes wrong:** The `parse-recipe-url` Edge Function calls `model: 'gpt-4o-mini'` which was deprecated February 2026. API calls return errors. Recipe import is completely non-functional.
**Why it happens:** No model name abstraction; no fallback logic.
**How to avoid:** Change to `gpt-5-mini`, upgrade to structured outputs, abstract model name to `OPENAI_MODEL` env var.
**Warning signs:** Recipe URL import returning "AI service unavailable" errors in production.

### Pitfall 2: Premium State in AsyncStorage Is Trivially Bypassable
**What goes wrong:** Current `premiumStore.ts` reads/writes premium tier to AsyncStorage. Users can manipulate it. Stripe webhook cancellations have no way to revoke access.
**Why it happens:** v1.0 was intentionally UI-only gating (simulated purchase).
**How to avoid:** Build `subscriptions` table and `subscriptionStore` BEFORE any checkout UI. Only service_role (webhook Edge Function) can write subscription state.
**Warning signs:** `canAccess()` still reads from AsyncStorage after Stripe integration.

### Pitfall 3: Webhook Endpoint Without Signature Verification
**What goes wrong:** Setting `verify_jwt = false` in config.toml without adding Stripe signature verification means anyone can POST fake events granting free premium access.
**Why it happens:** Developers disable JWT and forget to add the replacement security.
**How to avoid:** `verify_jwt = false` and `stripe.webhooks.constructEventAsync()` must always appear together. Test by sending unsigned POST -- should return 400.
**Warning signs:** Webhook function has no `constructEventAsync()` call.

### Pitfall 4: Apple App Store Rejection
**What goes wrong:** Apple may reject apps using Stripe for digital subscriptions without the External Purchase Entitlement.
**Why it happens:** Post-Epic v. Apple ruling allows external payments in US, but requires explicit entitlement request.
**How to avoid:** Request Apple's External Purchase Entitlement before submitting for App Store review. Keep payment backend provider-agnostic.
**Warning signs:** No entitlement request filed before App Store submission.

### Pitfall 5: Stale Subscription State After Webhook Updates
**What goes wrong:** User pays, webhook updates DB, but client still shows "free" because subscription state is cached in Zustand without refresh.
**Why it happens:** No mechanism to refresh subscription after checkout completion.
**How to avoid:** After `presentPaymentSheet()` completes, poll `subscriptions` table for up to 10 seconds (webhook delivery typically <2s). Also refresh on app foreground.
**Warning signs:** User completes payment but still sees upgrade prompts.

### Pitfall 6: AI Costs Spiral Without Rate Limiting
**What goes wrong:** No per-user throttling means a single user or retry loop can trigger unlimited OpenAI API calls.
**Why it happens:** Current Edge Function has zero rate limiting or caching.
**How to avoid:** Add per-user rate limits (10/day free, 50/day premium). Cache responses by URL hash. Set appropriate `max_tokens`.
**Warning signs:** OpenAI dashboard showing unexpected cost spikes.

## Code Examples

### Subscriptions Table Migration
```sql
-- Source: Architecture research + existing RLS patterns in project
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'free'
    CHECK (status IN ('free', 'active', 'past_due', 'canceled', 'trialing')),
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies
-- Only service_role (Edge Functions) can write via supabase admin client
```

### AI Usage Rate Limit Table
```sql
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  function_name TEXT NOT NULL,
  input_hash TEXT,  -- For caching duplicate requests
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage_log (user_id, created_at);
CREATE INDEX idx_ai_usage_hash ON ai_usage_log (input_hash) WHERE input_hash IS NOT NULL;

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_select_own" ON ai_usage_log FOR SELECT USING (auth.uid() = user_id);
```

### Updated parse-recipe-url Edge Function (key changes)
```typescript
// Source: Existing parse-recipe-url/index.ts + OpenAI structured outputs docs
const modelName = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5-mini';

// Increase truncation limit (gpt-5-mini has 400K context)
const truncatedHtml = html.slice(0, 50000);

// Use structured outputs for guaranteed schema compliance
const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: modelName,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'recipe',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: ['string', 'null'] },
            prep_time_minutes: { type: ['number', 'null'] },
            cook_time_minutes: { type: ['number', 'null'] },
            servings: { type: 'number' },
            estimated_cost: { type: ['number', 'null'] },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  unit: { type: 'string' },
                  name: { type: 'string' },
                  section: { type: ['string', 'null'] }
                },
                required: ['amount', 'unit', 'name'],
                additionalProperties: false
              }
            },
            instructions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step_number: { type: 'number' },
                  text: { type: 'string' }
                },
                required: ['step_number', 'text'],
                additionalProperties: false
              }
            },
            tags: { type: 'array', items: { type: 'string' } }
          },
          required: ['name', 'category', 'prep_time_minutes', 'cook_time_minutes',
                     'servings', 'estimated_cost', 'ingredients', 'instructions', 'tags'],
          additionalProperties: false
        }
      }
    },
    messages: [/* same system + user messages */],
    temperature: 0.1,
    max_tokens: 2000,
  }),
});
```

### config.toml Addition
```toml
# Add to existing supabase/config.toml
[functions.stripe-webhooks]
verify_jwt = false  # Stripe sends unsigned requests; we verify via Stripe signature
```

### StripeProvider in _layout.tsx
```typescript
// Source: @stripe/stripe-react-native Expo docs
import { StripeProvider } from '@stripe/stripe-react-native';

// Wrap app content:
<StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
  <ColorSchemeProvider>
    <Slot />
  </ColorSchemeProvider>
</StripeProvider>
```

### app.json Plugin Configuration
```json
{
  "plugins": [
    "expo-router",
    "expo-sharing",
    ["@stripe/stripe-react-native", {
      "merchantIdentifier": "merchant.com.mise.app",
      "enableApplePay": true
    }]
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gpt-4o-mini` | `gpt-5-mini` | Feb 2026 (deprecation) | Must change; old model returns API errors |
| `response_format: { type: 'json_object' }` | `response_format: { type: 'json_schema', json_schema: {...} }` | 2024-2025 | Guaranteed schema compliance instead of best-effort JSON |
| AsyncStorage premium state | Supabase `subscriptions` table via Stripe webhooks | Phase 5 (this phase) | Server-authoritative; bypassable to enforced |
| `stripe@14` in Deno (esm.sh) | `stripe@17` in Deno (esm.sh) | 2025-2026 | Updated API version support |

**Deprecated/outdated:**
- `gpt-4o-mini`: Deprecated Feb 2026. API calls fail. Must use `gpt-5-mini`.
- `premiumStore.ts` with AsyncStorage: Replaced by `subscriptionStore.ts` with Supabase.
- `response_format: { type: 'json_object' }`: Superseded by structured outputs with `json_schema` type.

## Open Questions

1. **Apple External Purchase Entitlement Timeline**
   - What we know: Post-Epic ruling allows Stripe external payments in US; Apple is appealing
   - What's unclear: Exact current timeline for entitlement approval; whether this affects development or only App Store submission
   - Recommendation: Proceed with Stripe implementation now; file entitlement request in parallel; keep backend payment-provider-agnostic

2. **Stripe Price ID Management**
   - What we know: Need a Stripe Product + Price for the $9.99/mo subscription
   - What's unclear: Whether to create via Stripe Dashboard (manual) or via API (automated setup script)
   - Recommendation: Create via Stripe Dashboard in test mode; store `price_id` as environment variable; document in setup instructions

3. **Subscription Grace Period on Payment Failure**
   - What we know: Stripe retries failed payments per dunning rules; sends `invoice.payment_failed` webhook
   - What's unclear: How long to keep premium access during retry period
   - Recommendation: Set status to `past_due` on first failure; keep access for current_period_end; show in-app warning

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI | Edge Function development | Verified in project | -- | -- |
| OpenAI API Key | AI-03 (recipe parsing) | Exists as Supabase secret | -- | -- |
| Stripe Account | PAY-01 through PAY-05 | TBD (needs setup) | -- | Cannot proceed without |
| Stripe CLI | Local webhook testing | Installable via brew | -- | Use Stripe Dashboard webhook test events |

**Missing dependencies with no fallback:**
- Stripe account (test mode) must be created before development begins
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` must be configured

**Missing dependencies with fallback:**
- Stripe CLI: Fallback to Stripe Dashboard "Send test webhook" feature (slower iteration but functional)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing in project) + manual E2E via Stripe test mode |
| Config file | Existing Jest config |
| Quick run command | `npx jest --testPathPattern=subscription` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-03 | Recipe import returns valid data with gpt-5-mini | integration (Edge Function) | `curl` against local Edge Function with test URL | No -- Wave 0 |
| AI-07 | Rate limiting blocks excess requests | unit | `npx jest tests/ai-rate-limit.test.ts -x` | No -- Wave 0 |
| PAY-01 | Checkout session created successfully | integration (Edge Function) | `curl` against local create-checkout-session | No -- Wave 0 |
| PAY-02 | Webhook updates subscription table | integration | `stripe trigger checkout.session.completed` | No -- Wave 0 |
| PAY-03 | Webhook verifies signature, rejects unsigned | integration | `curl -X POST` without signature returns 400 | No -- Wave 0 |
| PAY-04 | Billing portal URL returned | integration | `curl` against local create-billing-portal | No -- Wave 0 |
| PAY-05 | RLS blocks premium data without active subscription | integration (SQL) | Test RLS with non-premium user token | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** Verify affected Edge Function responds correctly via `curl`/Stripe CLI
- **Per wave merge:** Full Stripe test flow (checkout -> webhook -> subscription state)
- **Phase gate:** All 7 requirements verified; unsigned webhook rejected; rate limiting enforced

### Wave 0 Gaps
- [ ] Stripe test mode account setup (products, prices, webhook endpoint)
- [ ] Local Edge Function testing scripts for webhook verification
- [ ] SQL test for RLS premium gating

## Existing Code Inventory

Key files that will be modified or replaced:

| File | Current State | Change Needed |
|------|---------------|---------------|
| `supabase/functions/parse-recipe-url/index.ts` | Uses `gpt-4o-mini`, `json_object` response format, 15K char truncation | Change model to `gpt-5-mini`, upgrade to `json_schema` structured outputs, increase truncation to 50K, add rate limiting, add caching |
| `src/stores/premiumStore.ts` | Reads/writes AsyncStorage; `canAccess()` + `PREMIUM_FEATURES` API | Replace with `subscriptionStore.ts` reading from Supabase `subscriptions` table; preserve `canAccess()` API surface |
| `src/components/premium/SubscriptionSheet.tsx` | Calls `upgradeToPremium()` directly (AsyncStorage write); "Manage Subscription" shows Coming Soon alert | Wire upgrade button to Stripe checkout flow; wire manage button to Stripe billing portal |
| `src/components/premium/UpgradePrompt.tsx` | Calls `upgradeToPremium()` directly | Wire to Stripe checkout flow via subscriptionStore |
| `app/(app)/subscription.tsx` | Imports `usePremiumStore` | Switch to `useSubscriptionStore` |
| `app/_layout.tsx` | No StripeProvider | Wrap with StripeProvider |
| `app.json` | plugins: ["expo-router", "expo-sharing"] | Add `@stripe/stripe-react-native` config plugin |
| `supabase/config.toml` | No per-function config | Add `[functions.stripe-webhooks] verify_jwt = false` |
| `src/lib/ai.ts` | Calls `parse-recipe-url` Edge Function | May need minor updates if Edge Function response shape changes |

**Files referencing premiumStore (all need import updates):**
- `src/stores/premiumStore.ts` (replaced)
- `src/components/premium/SubscriptionSheet.tsx`
- `src/components/premium/UpgradePrompt.tsx`
- `src/components/premium/PremiumBadge.tsx`
- `app/(app)/subscription.tsx`

**New environment variables needed:**
```
# Supabase secrets (via supabase secrets set)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...
OPENAI_MODEL=gpt-5-mini  # Abstract model name

# App environment (.env)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Sources

### Primary (HIGH confidence)
- [Supabase Stripe Webhooks Example](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/stripe-webhooks/index.ts) -- Webhook signature verification pattern, Deno import style
- [Supabase Edge Function Configuration](https://supabase.com/docs/guides/functions/function-configuration) -- verify_jwt config.toml syntax
- [@stripe/stripe-react-native Expo Docs](https://docs.expo.dev/versions/latest/sdk/stripe/) -- Config plugin, SDK compatibility
- [Stripe Build Subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=react-native) -- Subscription checkout flow
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) -- json_schema response_format
- [OpenAI Model Deprecations](https://developers.openai.com/api/docs/deprecations) -- gpt-4o-mini deprecated Feb 2026
- Existing codebase: `premiumStore.ts`, `parse-recipe-url/index.ts`, `SubscriptionSheet.tsx`, `UpgradePrompt.tsx`, `supabase/config.toml`, `app.json`

### Secondary (MEDIUM confidence)
- [Stripe iOS Digital Goods](https://docs.stripe.com/mobile/digital-goods) -- Apple External Purchase Entitlement requirements
- [Adapty: Stripe for In-App Purchases 2026](https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/) -- Apple external payment policy analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All packages verified against npm registry; gpt-5-mini confirmed as current OpenAI model; Stripe SDK version confirmed
- Architecture: HIGH -- Patterns derived from official Supabase Stripe example, existing codebase analysis, and Stripe subscription docs
- Pitfalls: HIGH -- gpt-4o-mini deprecation is confirmed fact; AsyncStorage bypass is verified by reading existing code; webhook security pattern from official Supabase docs

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- Stripe and OpenAI APIs change infrequently)
