---
phase: 05-ai-fix-payment-foundation
plan: 02
subsystem: payments
tags: [stripe, webhooks, supabase, rls, zustand, subscriptions]

# Dependency graph
requires:
  - phase: 04-onboarding-and-freemium
    provides: premiumStore with canAccess/isPremium API surface
provides:
  - subscriptions table with RLS (SELECT-only for authenticated, service_role writes)
  - processed_webhook_events dedup table for idempotent webhook processing
  - stripe-webhooks Edge Function with signature verification
  - subscriptionStore Zustand store with server-authoritative state
affects: [05-ai-fix-payment-foundation]

# Tech tracking
tech-stack:
  added: [stripe@17 (esm.sh for Deno)]
  patterns: [server-authoritative subscription state, webhook idempotency via dedup table, service_role bypass for RLS writes]

key-files:
  created:
    - supabase/migrations/00012_create_subscriptions.sql
    - supabase/functions/stripe-webhooks/index.ts
    - src/stores/subscriptionStore.ts
  modified:
    - supabase/config.toml

key-decisions:
  - "SubtleCryptoProvider for Deno-compatible Stripe signature verification"
  - "maybeSingle() for graceful free-tier handling (no subscription row)"
  - "No client-side write methods -- server-authoritative only via service_role"
  - "Upsert on user_id for checkout.session.completed handles re-subscribe"

patterns-established:
  - "Webhook idempotency: check processed_webhook_events before processing, record after"
  - "RLS write restriction: enable RLS with SELECT-only policy, service_role bypasses for writes"
  - "Subscription status mapping: Stripe statuses mapped to app enum (free/active/past_due/canceled/trialing)"

requirements-completed: [PAY-02, PAY-03, PAY-05]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 05 Plan 02: Subscription Foundation Summary

**Server-authoritative subscription system with Stripe webhook handler, RLS-enforced subscriptions table, and Zustand store replacing AsyncStorage-based premiumStore**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T05:32:34Z
- **Completed:** 2026-03-25T05:34:26Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Subscriptions table with SELECT-only RLS policy enforcing PAY-05 (no client writes)
- Stripe webhook Edge Function with signature verification, idempotent processing (PAY-03), and 4 event handlers
- subscriptionStore Zustand store with same canAccess()/isPremium() API as premiumStore but backed by Supabase

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscriptions table migration with RLS and event dedup table** - `b22f1f5` (feat)
2. **Task 2: Create stripe-webhooks Edge Function with signature verification** - `95f3dc9` (feat)
3. **Task 3: Create subscriptionStore replacing premiumStore** - `3f58330` (feat)

## Files Created/Modified
- `supabase/migrations/00012_create_subscriptions.sql` - Subscriptions table with RLS, processed_webhook_events dedup table
- `supabase/functions/stripe-webhooks/index.ts` - Stripe webhook handler with signature verification and idempotent processing
- `src/stores/subscriptionStore.ts` - Zustand store reading server-authoritative subscription state
- `supabase/config.toml` - Added verify_jwt=false for stripe-webhooks endpoint

## Decisions Made
- SubtleCryptoProvider for Deno-compatible Stripe signature verification in Edge Functions
- maybeSingle() instead of single() so free-tier users with no subscription row get graceful null handling
- No upgradeToPremium/downgradeToFree methods -- subscription state is server-authoritative only
- Upsert on user_id conflict for checkout.session.completed handles both first-time and re-subscribe scenarios

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**External services require manual configuration.** Stripe keys needed:
- `STRIPE_SECRET_KEY` - Stripe Dashboard -> Developers -> API keys -> Secret key (test mode)
- `STRIPE_WEBHOOK_SIGNING_SECRET` - Stripe Dashboard -> Developers -> Webhooks -> Signing secret
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe Dashboard -> Developers -> API keys -> Publishable key
- Create "Mise Premium" product with $9.99/month recurring price in Stripe Dashboard

## Next Phase Readiness
- Subscription foundation ready for checkout session creation (Plan 03)
- subscriptionStore ready to replace premiumStore imports across the app
- Webhook endpoint ready for Stripe event delivery once deployed

---
*Phase: 05-ai-fix-payment-foundation*
*Completed: 2026-03-25*
