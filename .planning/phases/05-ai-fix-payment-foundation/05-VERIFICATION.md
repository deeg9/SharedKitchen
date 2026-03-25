---
phase: 05-ai-fix-payment-foundation
verified: 2026-03-25T00:30:00Z
status: gaps_found
score: 12/15 must-haves verified
gaps:
  - truth: "All premium components use subscriptionStore instead of premiumStore"
    status: failed
    reason: "Three tab screens (profile.tsx, plan.tsx, budget.tsx) still import and use usePremiumStore from premiumStore.ts. The AsyncStorage-backed premiumStore.ts still exists and is actively used. The Plan 03 commit only rewired the src/components/premium/ folder, not the tab screens."
    artifacts:
      - path: "app/(app)/(tabs)/profile.tsx"
        issue: "Imports usePremiumStore, calls premiumStore.initialize(), premiumStore.isPremium() used to render subscription badge"
      - path: "app/(app)/(tabs)/plan.tsx"
        issue: "Imports usePremiumStore, calls premiumStore.canAccess('advanced_suggestions') to gate Surprise Me feature"
      - path: "app/(app)/(tabs)/budget.tsx"
        issue: "Imports usePremiumStore, calls premiumStore.canAccess('analytics_dashboard') to gate analytics navigation"
      - path: "src/stores/premiumStore.ts"
        issue: "Still exists and is still referenced; should be deprecated/removed once all consumers are migrated"
    missing:
      - "Migrate app/(app)/(tabs)/profile.tsx from usePremiumStore to useSubscriptionStore"
      - "Migrate app/(app)/(tabs)/plan.tsx from usePremiumStore to useSubscriptionStore"
      - "Migrate app/(app)/(tabs)/budget.tsx from usePremiumStore to useSubscriptionStore"
      - "Delete or deprecate src/stores/premiumStore.ts once all references are removed"
human_verification:
  - test: "Complete Stripe PaymentSheet checkout flow"
    expected: "User taps Upgrade to Premium, PaymentSheet opens with $9.99/month price, payment succeeds, and the UI updates to show Premium status within 10 seconds"
    why_human: "Requires live Stripe test mode API keys configured as Supabase secrets and an active dev server"
  - test: "Stripe billing portal navigation"
    expected: "User taps Manage Subscription in SubscriptionSheet, external browser opens with Stripe-hosted billing portal for the user's customer"
    why_human: "Requires Stripe customer to exist (created via checkout), and Linking.openURL cannot be verified without device/simulator"
  - test: "Webhook idempotency under replay"
    expected: "Sending the same Stripe event twice returns the second response with duplicate: true and does not create a second subscription row"
    why_human: "Requires Stripe CLI or webhook replay tooling to send duplicate events against a deployed Edge Function"
---

# Phase 5: AI Fix + Payment Foundation Verification Report

**Phase Goal:** Recipe import works again (gpt-5-mini) and users can purchase and manage real premium subscriptions via Stripe with server-enforced gating
**Verified:** 2026-03-25T00:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | User can import a recipe from a URL and receive correctly parsed recipe data using gpt-5-mini | VERIFIED | `parse-recipe-url/index.ts` uses `modelName = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5-mini'`, json_schema structured outputs, 50K truncation |
| 2  | Free users are blocked after 10 recipe imports per day | VERIFIED | Rate limit logic: `const limit = isPremium ? 50 : 10` with 429 response in `parse-recipe-url/index.ts` lines 109-116 |
| 3  | Premium users are blocked after 50 recipe imports per day | VERIFIED | Same rate limit block — premium path derives from subscriptions table query |
| 4  | Duplicate URL imports within 24 hours return cached results without calling OpenAI | VERIFIED | Cache check at lines 61-86 in `parse-recipe-url/index.ts` — SHA-256 hash, 24h TTL, returns cached_response if found |
| 5  | Subscription state is stored in a server-side Supabase table, not AsyncStorage | VERIFIED | `supabase/migrations/00012_create_subscriptions.sql` creates table; `subscriptionStore.ts` queries Supabase; no AsyncStorage in subscriptionStore |
| 6  | Only Stripe webhooks (via service_role) can write subscription state | VERIFIED | Migration has SELECT-only RLS policy for authenticated role; no INSERT/UPDATE/DELETE policies for clients |
| 7  | Webhook endpoint rejects requests without valid Stripe signature (returns 400) | VERIFIED | `stripe-webhooks/index.ts` lines 24-29 return 400 for missing header; lines 36-49 catch constructEventAsync failure and return 400 |
| 8  | Webhook handles all 4 subscription lifecycle events | VERIFIED | checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed all present in switch block |
| 9  | Webhook processing is idempotent — duplicate events detected and skipped | VERIFIED | processed_webhook_events lookup at lines 60-72, insert after processing at lines 182-187 |
| 10 | Client reads subscription state from Supabase via subscriptionStore with same canAccess() API | VERIFIED | `subscriptionStore.ts` exports useSubscriptionStore with isPremium(), canAccess(), PREMIUM_FEATURES — same API surface as premiumStore |
| 11 | RLS ensures users can only read their own subscription row (PAY-05) | VERIFIED | `subscriptions_select_own` policy: `FOR SELECT USING (auth.uid() = user_id)` — no write policies |
| 12 | User can tap Upgrade to Premium and complete a $9.99/mo subscription via Stripe PaymentSheet | VERIFIED (code) | Edge Function creates subscription + returns clientSecret; stripe.ts calls presentPaymentSheet; SubscriptionSheet wired to openCheckout() |
| 13 | User can tap Manage Subscription and be taken to Stripe billing portal | VERIFIED (code) | create-billing-portal Edge Function creates portal session; stripe.ts calls openBillingPortal via Linking.openURL |
| 14 | All premium components use subscriptionStore instead of premiumStore | FAILED | profile.tsx, plan.tsx, and budget.tsx still import usePremiumStore — premiumStore.ts still exists |
| 15 | PremiumBadge shows distinct states for active, past_due, canceled, trialing | VERIFIED | badgeConfig in PremiumBadge.tsx has 4 states with distinct colors |

**Score:** 12/15 truths verified (14 verified with caveat, 1 failed)

---

## Required Artifacts

### Plan 01 Artifacts (AI-03, AI-07)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/parse-recipe-url/index.ts` | gpt-5-mini, structured outputs, rate limiting, caching | VERIFIED | Contains gpt-5-mini, json_schema, ai_usage_log queries, 50K truncation, 429 rate limit response |
| `supabase/migrations/00011_create_ai_usage_log.sql` | AI usage tracking table | VERIFIED | CREATE TABLE ai_usage_log with idx_ai_usage_hash, RLS enabled |
| `src/lib/ai.ts` | Client-side 429 error handling | VERIFIED | RateLimitError class exported, 429 detection logic present |

### Plan 02 Artifacts (PAY-02, PAY-03, PAY-05)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00012_create_subscriptions.sql` | Subscriptions table with RLS and dedup table | VERIFIED | CREATE TABLE subscriptions with SELECT-only RLS, processed_webhook_events table |
| `supabase/functions/stripe-webhooks/index.ts` | Webhook handler with signature verification and idempotency | VERIFIED | constructEventAsync, 4 event handlers, processed_webhook_events dedup |
| `supabase/config.toml` | verify_jwt = false for stripe-webhooks | VERIFIED | [functions.stripe-webhooks] section with verify_jwt = false confirmed |
| `src/stores/subscriptionStore.ts` | Zustand store with server-authoritative state | VERIFIED | useSubscriptionStore with isPremium(), canAccess(), initialize(), refreshSubscription(), from('subscriptions') query |

### Plan 03 Artifacts (PAY-01, PAY-04)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/create-checkout-session/index.ts` | Edge Function creating Stripe subscription | VERIFIED | stripe.subscriptions.create present at line 86 |
| `supabase/functions/create-billing-portal/index.ts` | Edge Function creating billing portal session | VERIFIED | billingPortal.sessions.create at line 57 |
| `src/lib/stripe.ts` | Client-side Stripe helpers | VERIFIED | openCheckout() with presentPaymentSheet, openBillingPortal() with Linking.openURL |
| `app/_layout.tsx` | StripeProvider wrapper | VERIFIED | StripeProvider imported from @stripe/stripe-react-native, wraps app at line 121 |
| `src/components/premium/SubscriptionSheet.tsx` | Updated with real Stripe checkout | VERIFIED | useSubscriptionStore, openCheckout(), openBillingPortal() wired |
| `src/components/premium/UpgradePrompt.tsx` | Updated upgrade prompt | VERIFIED | openCheckout() from stripe.ts wired; note: does NOT import useSubscriptionStore directly (uses stripe helper only — acceptable) |
| `app.json` | @stripe/stripe-react-native config plugin | VERIFIED | Plugin present with merchantIdentifier and enableApplePay |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `parse-recipe-url/index.ts` | ai_usage_log table | supabaseAdmin insert and count queries | WIRED | Lines 61-86 (cache check), lines 89-94 (rate count), lines 244-250 (usage insert) |
| `parse-recipe-url/index.ts` | OpenAI API | fetch with gpt-5-mini and json_schema response_format | WIRED | Lines 149-220, json_schema present at line 158 |
| `stripe-webhooks/index.ts` | subscriptions table | supabaseAdmin upsert | WIRED | Lines 92-104 (upsert on checkout), lines 125-135 (update), lines 145-152 (delete), lines 165-171 (past_due) |
| `stripe-webhooks/index.ts` | processed_webhook_events | supabaseAdmin insert for idempotency | WIRED | Lines 60-72 (lookup before processing), lines 182-187 (insert after processing) |
| `subscriptionStore.ts` | subscriptions table | supabase.from('subscriptions').select | WIRED | Line 52 in subscriptionStore.ts |
| `stripe-webhooks/index.ts` | Stripe API | constructEventAsync | WIRED | Lines 36-43 |
| `stripe.ts` | create-checkout-session Edge Function | supabase.functions.invoke | WIRED | Line 15 in stripe.ts |
| `stripe.ts` | create-billing-portal Edge Function | supabase.functions.invoke | WIRED | Line 64 in stripe.ts |
| `SubscriptionSheet.tsx` | subscriptionStore.ts | useSubscriptionStore import | WIRED | Line 7 in SubscriptionSheet.tsx |
| `app/_layout.tsx` | @stripe/stripe-react-native | StripeProvider wrapper | WIRED | Lines 21, 121-125 in _layout.tsx |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `SubscriptionSheet.tsx` | status, currentPeriodEnd, cancelAtPeriodEnd | useSubscriptionStore() → supabase.from('subscriptions').select | Yes — live Supabase query with maybeSingle() | FLOWING |
| `PremiumBadge.tsx` | storeStatus | useSubscriptionStore(s => s.status) → same Supabase query | Yes | FLOWING |
| `app/(app)/(tabs)/profile.tsx` | premiumStore.isPremium() | usePremiumStore → AsyncStorage | No — reads from AsyncStorage, not server-authoritative subscriptions table | HOLLOW (wrong source) |
| `app/(app)/(tabs)/plan.tsx` | premiumStore.canAccess() | usePremiumStore → AsyncStorage | No — same issue | HOLLOW (wrong source) |
| `app/(app)/(tabs)/budget.tsx` | premiumStore.canAccess() | usePremiumStore → AsyncStorage | No — same issue | HOLLOW (wrong source) |

---

## Behavioral Spot-Checks

Step 7b: No live server available to test Edge Function endpoints. Static code checks performed instead.

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| gpt-4o-mini fully removed from parse-recipe-url | `grep -c 'gpt-4o-mini' parse-recipe-url/index.ts` returns 0 | 0 matches confirmed | PASS |
| gpt-5-mini present in parse-recipe-url | `grep -c 'gpt-5-mini'` | Present at line 147 | PASS |
| json_schema format present | `grep -c 'json_schema'` | Present at line 158 | PASS |
| All 7 documented commits exist in git log | git log --oneline verification | All 7 hashes found (4b617a1, eae79bf, b22f1f5, 95f3dc9, 3f58330, f802679, d859b26) | PASS |
| Zero premiumStore refs in premium component folder | grep in src/components/premium/ | No matches | PASS |
| premiumStore still referenced in tab screens | grep in app/(app)/(tabs)/ | 11 references in 3 files | FAIL |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AI-03 | 05-01 | Recipe import uses gpt-5-mini with structured outputs | SATISFIED | parse-recipe-url uses gpt-5-mini with json_schema response_format; gpt-4o-mini removed |
| AI-07 | 05-01 | Per-user rate limiting and response caching | SATISFIED | ai_usage_log table, 10/50 per day limits, 24h URL cache in parse-recipe-url |
| PAY-01 | 05-03 | User can purchase $9.99/mo subscription via Stripe checkout | SATISFIED (code) | create-checkout-session Edge Function + stripe.ts + SubscriptionSheet wired; needs Stripe API keys for live test |
| PAY-02 | 05-02 | Subscription state server-authoritative via Stripe webhooks | SATISFIED | subscriptions table + stripe-webhooks Edge Function + subscriptionStore (for premium components); PARTIAL for tab screens still on premiumStore |
| PAY-03 | 05-02 | Stripe webhook handles lifecycle events with idempotent processing | SATISFIED | 4 event types handled, processed_webhook_events dedup table checked before/after processing |
| PAY-04 | 05-03 | User can manage subscription via Stripe billing portal | SATISFIED (code) | create-billing-portal Edge Function + stripe.ts openBillingPortal + SubscriptionSheet Manage button wired |
| PAY-05 | 05-02 | Premium features enforced server-side via RLS | PARTIALLY SATISFIED | subscriptions table has correct RLS (SELECT-only for auth, no write policies). However, profile/plan/budget screens still read from premiumStore (AsyncStorage) not subscriptionStore — these feature gates are bypassable client-side |

**Orphaned requirements check:** Traceability table in REQUIREMENTS.md maps PAY-01 through PAY-05 and AI-03, AI-07 to Phase 5. All are claimed in plan frontmatter. No orphans.

**Requirements marked Complete in REQUIREMENTS.md that have gaps:**
- PAY-02 marked `[x]` complete but 3 tab screens still use AsyncStorage-backed premiumStore
- PAY-05 marked `[x]` complete but plan/budget feature gates still use AsyncStorage-backed premiumStore

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/(app)/(tabs)/profile.tsx` | 9, 53, 70, 279-284 | usePremiumStore (AsyncStorage-backed) still used for subscription display | Blocker | Profile tab shows subscription status from AsyncStorage, not server. A user who cancelled but has AsyncStorage set to premium would see incorrect "Premium" display |
| `app/(app)/(tabs)/plan.tsx` | 13, 38, 144, 151 | usePremiumStore.canAccess('advanced_suggestions') used to gate Surprise Me feature | Blocker | Feature gate is bypassable via AsyncStorage manipulation — contradicts PAY-05 server-side enforcement goal |
| `app/(app)/(tabs)/budget.tsx` | 17, 24, 82 | usePremiumStore.canAccess('analytics_dashboard') used to gate analytics navigation | Blocker | Same issue — analytics gate is client-side AsyncStorage check, not server-authoritative |
| `src/stores/premiumStore.ts` | entire file | File exists and is still active; should have been deprecated | Warning | Leaving premiumStore alive alongside subscriptionStore creates two sources of truth |

---

## Human Verification Required

### 1. Stripe PaymentSheet End-to-End Checkout

**Test:** Configure STRIPE_SECRET_KEY and EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY with Stripe test mode keys, deploy Edge Functions, run app on simulator, navigate to Subscription screen, tap "Upgrade to Premium"
**Expected:** Stripe PaymentSheet appears with "Mise" merchant name, user enters test card 4242-4242-4242-4242, payment succeeds, app polls and shows Premium status within 10 seconds
**Why human:** Requires live Stripe API keys as Supabase secrets, deployed Edge Functions, running Expo dev server, and physical or simulated device

### 2. Stripe Billing Portal Navigation

**Test:** As a user with an active subscription, navigate to Subscription screen, tap "Manage Subscription"
**Expected:** External browser opens Stripe-hosted billing portal showing subscription details with cancel/update options
**Why human:** Requires active Stripe customer ID in subscriptions table (created via checkout), and Linking.openURL behavior cannot be verified statically

### 3. Webhook Idempotency Under Replay

**Test:** Use Stripe CLI to replay the same checkout.session.completed event twice against the stripe-webhooks Edge Function
**Expected:** First delivery: subscription row upserted, event recorded in processed_webhook_events. Second delivery: returns 200 with `duplicate: true`, no second DB write
**Why human:** Requires Stripe CLI, deployed Edge Function, and ability to replay specific event IDs

### 4. Profile Tab Premium Display After Migration

**Test:** After migrating profile.tsx to useSubscriptionStore, verify the subscription display icon and text update correctly when subscription status changes from the server
**Expected:** Profile tab shows "Premium" / crown icon only when Supabase subscriptions table has status = 'active' — not based on AsyncStorage
**Why human:** Currently blocked by the gap; needs the migration fix first

---

## Gaps Summary

The phase goal is substantially achieved — recipe import is restored with gpt-5-mini and the entire server-side payment infrastructure (subscriptions table, webhook handler, checkout/billing portal Edge Functions, subscriptionStore) is correctly built and wired.

One gap blocks full goal achievement:

**Incomplete premiumStore migration (3 screens):** Plan 03 rewired the dedicated premium UI components (SubscriptionSheet, UpgradePrompt, PremiumBadge, subscription.tsx) but left three main tab screens (profile, plan, budget) still importing `usePremiumStore` from the AsyncStorage-backed `premiumStore.ts`. This means:

1. The profile tab shows subscription status from AsyncStorage, not the server-authoritative `subscriptions` table.
2. The Surprise Me feature gate in the plan tab reads from AsyncStorage, making it bypassable client-side.
3. The analytics navigation gate in the budget tab reads from AsyncStorage — same issue.

This directly contradicts the PAY-05 requirement ("Premium features enforced server-side via RLS, not just client-side checks") and the phase goal of "server-enforced gating." The infrastructure for server-authoritative gating exists but is not connected to these three screens.

**Root cause:** The Plan 03 task description said "rewire all premium components" but listed only `src/components/premium/` in `files_modified`. The tab screens are the primary surfaces where premium gating happens but were not included in scope.

**Fix scope:** Migrate `app/(app)/(tabs)/profile.tsx`, `app/(app)/(tabs)/plan.tsx`, and `app/(app)/(tabs)/budget.tsx` from `usePremiumStore` to `useSubscriptionStore`. This is a straightforward import replacement; the API surface is identical (`canAccess()`, `isPremium()`). Then delete `src/stores/premiumStore.ts`.

---

_Verified: 2026-03-25T00:30:00Z_
_Verifier: Claude (gsd-verifier)_
