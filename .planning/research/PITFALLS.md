# Pitfalls Research

**Domain:** Adding Stripe subscriptions, push notifications, real-time presence, enhanced AI, and E2E testing to an existing React Native/Expo + Supabase dinner planning app
**Researched:** 2026-03-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: gpt-4o-mini Is Deprecated -- Existing AI Feature Is Broken

**What goes wrong:**
The `parse-recipe-url` Edge Function at `supabase/functions/parse-recipe-url/index.ts` calls `model: 'gpt-4o-mini'`. OpenAI deprecated gpt-4o-mini in February 2026. API calls to this model now return errors. The recipe import feature -- a core v1.0 capability -- is completely non-functional.

**Why it happens:**
The Edge Function was written when gpt-4o-mini was current. OpenAI deprecated the entire gpt-4o family with relatively short notice. The Edge Function has no model fallback logic.

**How to avoid:**
1. **Immediate fix:** Change `model: 'gpt-4o-mini'` to `model: 'gpt-5-mini'` in `supabase/functions/parse-recipe-url/index.ts`
2. Upgrade from `response_format: { type: 'json_object' }` to `response_format: { type: 'json_schema', json_schema: {...} }` for guaranteed schema compliance
3. Increase HTML truncation limit from 15,000 chars -- gpt-5-mini has a 400K context window
4. Consider abstracting the model name into an environment variable for future-proofing

**Warning signs:**
- Recipe URL import returning errors or "AI service unavailable" messages
- OpenAI API returning 404 or deprecation errors in Edge Function logs

**Phase to address:**
Day 1, before any other work begins. This is a production bug, not a v2.0 feature.

---

### Pitfall 2: Premium State Stored Only in AsyncStorage, Not Server-Authoritative

**What goes wrong:**
The current `premiumStore.ts` stores the premium tier in AsyncStorage on the device. When you add real Stripe payments, if you keep this client-side source of truth, users can manipulate their premium status (clear storage, reinstall app, use on another device) and premium gating becomes trivially bypassable. Worse, subscription cancellations, expirations, and failed renewals from Stripe webhooks have no way to revoke access.

**Why it happens:**
The freemium shell was intentionally built as UI-only gating (PROJECT.md confirms this). Developers often bolt Stripe on top of the existing store rather than rebuilding the entitlement flow server-side first.

**How to avoid:**
1. Create a `subscriptions` table in Supabase with `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`, and `tier` columns
2. Stripe webhooks update this table (the server is the source of truth)
3. `premiumStore` reads from Supabase on app launch and caches locally for offline use only
4. `canAccess()` checks server state, falling back to cached state with a staleness threshold
5. RLS policies gate premium data at the database level (double enforcement)

**Warning signs:**
- `canAccess()` still reads from AsyncStorage after Stripe integration
- No webhook handler for `customer.subscription.updated` / `customer.subscription.deleted`
- Premium features work when device is offline with stale data indefinitely

**Phase to address:**
Stripe/Payments phase -- must be the first thing built before any checkout UI

---

### Pitfall 3: Apple App Store Rejection for Using Stripe for Digital Goods

**What goes wrong:**
Apple historically required apps selling digital goods/services (subscriptions, premium content) to use Apple In-App Purchases (IAP). Using Stripe directly for in-app digital purchases could get the app rejected during App Store review.

**Why it happens:**
The April 2025 Epic v. Apple ruling now allows external payment links in the US App Store, but the situation is nuanced. Most apps are still expected to also offer IAP. The ruling is US-only. Developers read headlines about "Stripe now allowed on iOS" without understanding the full compliance picture.

**How to avoid:**
1. For the US market: You CAN use Stripe Checkout via an external link from within the app (per the April 2025 ruling). Stripe has published specific documentation for this flow.
2. Must request Apple's External Purchase Entitlement before submitting for review
3. Current US commission on external payments is 0% (Apple is appealing -- this may change)
4. Structure payment flows so the backend is payment-provider-agnostic -- if you need to add IAP later, you only change the client payment trigger, not the entitlement system

**Warning signs:**
- App Store review rejection citing Guideline 3.1
- No External Purchase Entitlement requested before submission
- Payment flow tightly coupled to Stripe SDK rather than abstracted

**Phase to address:**
Stripe/Payments phase -- architecture decision needed before implementation

---

### Pitfall 4: Push Notifications "Work in Dev, Fail in Production" Due to Credential Mismanagement

**What goes wrong:**
Push notifications require a complex credential chain: APNs keys (iOS), Expo push token registration, and correct environment matching (development vs production). A common failure is notifications working in development builds but silently failing in production because of APNs environment mismatches, expired push keys, or missing the `expo-notifications` config plugin.

**Why it happens:**
Expo abstracts away much of the complexity, but the abstraction hides critical configuration steps. The app currently has no push notification infrastructure at all (notification settings UI exists but is non-functional). Going from zero to working push notifications requires: development build (Expo Go does not support push notifications since SDK 53+), EAS credentials setup, physical device testing, and proper entitlements.

**How to avoid:**
1. Add `expo-notifications` to the `plugins` array in `app.json` -- this is REQUIRED; without it iOS cannot sync tokens to EAS and push registration silently fails
2. Register physical iOS test devices BEFORE the first `eas build` command
3. Test on physical devices only -- push notifications do not work on simulators/emulators
4. Use development builds (not Expo Go) for all push notification testing
5. Verify APNs key in EAS credentials dashboard before deploying to TestFlight/production
6. Test the full lifecycle: token registration -> server-side send -> device receipt -> tap-to-open

**Warning signs:**
- Testing push notifications in Expo Go or simulator
- No `expo-notifications` in app.json plugins array
- Push tokens registering as `null` on iOS
- "no valid aps-environment entitlement" errors in build logs

**Phase to address:**
Push Notifications phase -- requires EAS build infrastructure set up first

---

### Pitfall 5: Supabase Realtime Presence Sync Events Misinterpreted as User Activity

**What goes wrong:**
When adding real-time presence (showing who is viewing/editing recipes or checking off grocery items), developers treat every `join` and `leave` event from Supabase Presence as actual user actions. In reality, during a `sync` event, Presence reconciles local state with server state and emits `join`/`leave` events even though no users actually joined or left. This causes phantom "user is typing" indicators, false activity badges, and confusing UI flicker.

**Why it happens:**
The Supabase Presence API documentation notes this behavior but it is easy to miss. The existing grocery list sync uses Postgres Changes (database-level realtime), not Presence. Presence is a fundamentally different mechanism with different semantics.

**How to avoid:**
1. Use the `sync` event callback to get the full current state, rather than reacting to individual `join`/`leave` events for UI updates
2. Debounce presence state changes (200-500ms) before updating UI to avoid flicker
3. Track presence with a `last_active` timestamp and consider users "present" only if their timestamp is within a threshold (e.g., 30 seconds)
4. Keep the existing Postgres Changes approach for grocery list sync -- do not migrate it to Presence
5. Use Presence only for ephemeral "who's here now" indicators, not for durable state

**Warning signs:**
- Avatars appearing and disappearing rapidly
- "Someone is viewing this" indicators showing stale/phantom users
- Presence updates causing excessive re-renders

**Phase to address:**
Real-time Presence phase

---

### Pitfall 6: AI Costs Spiraling from Unthrottled Recipe Extraction and Meal Generation

**What goes wrong:**
The current recipe parser sends full HTML (truncated to 15K chars) to gpt-5-mini on every URL submission. Adding an AI meal generator that queries user history, preferences, and dietary needs will multiply API calls. Without rate limiting, a single user could trigger dozens of expensive API calls. At scale, costs become unpredictable and can spike dramatically from abuse or bugs (e.g., retry loops).

**Why it happens:**
The existing Edge Function has no rate limiting, no per-user throttling, no cost tracking, and no circuit breaker. It works fine at low volume but has no guardrails for production scale.

**How to avoid:**
1. Add per-user rate limits in the Edge Function (e.g., 10 recipe extractions/day for free, 50 for premium)
2. Cache AI responses -- if the same URL is submitted twice, return the cached result
3. Set `max_tokens` appropriately (current 2000 is reasonable for recipes, but meal suggestions need less)
4. Add a monthly budget cap with alerting via OpenAI dashboard
5. For the meal generator, batch context (preferences + history) into a single prompt rather than multiple calls
6. Extract JSON-LD/schema.org structured data from recipe URLs first -- this is free and handles ~80% of recipe sites without any LLM call
7. Track per-user AI usage in a Supabase table for analytics and abuse detection

**Warning signs:**
- No `rate_limit` check in Edge Functions
- OpenAI dashboard showing unexpected cost spikes
- Same recipe URL being parsed multiple times
- Retry logic without exponential backoff

**Phase to address:**
Enhanced AI phase -- rate limiting and caching should be built before any new AI features

---

### Pitfall 7: Stripe Webhook Edge Function Missing Signature Verification or JWT Bypass

**What goes wrong:**
Stripe sends webhook events to your Edge Function endpoint. By default, Supabase Edge Functions require a valid JWT in the authorization header. Stripe cannot send JWTs. If you simply disable JWT verification (`verify_jwt = false` in config.toml) without adding Stripe signature verification, anyone can send fake webhook events to your endpoint, granting themselves premium access or manipulating subscription state.

**Why it happens:**
The Supabase docs clearly state you need to disable JWT for webhook endpoints. Developers do that and forget to add the replacement security: Stripe signature verification using the webhook signing secret.

**How to avoid:**
1. Set `verify_jwt = false` for the webhook Edge Function in `supabase/config.toml`
2. Immediately implement Stripe signature verification using `stripe.webhooks.constructEvent()` with the webhook signing secret
3. Store the webhook signing secret in Supabase Edge Function secrets (not in code)
4. Handle these webhook events at minimum: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Make webhook handling idempotent (same event delivered twice should not cause issues)

**Warning signs:**
- Webhook Edge Function has `verify_jwt = false` but no `stripe.webhooks.constructEvent()` call
- Subscription status changes not reflected in database
- No idempotency check on webhook event IDs

**Phase to address:**
Stripe/Payments phase -- webhook handler is the foundation of the entire payment system

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep premium state in AsyncStorage alongside server state | Faster migration, offline support | Two sources of truth, sync bugs, security bypass | Only as a read-through cache with staleness TTL |
| Skip Apple IAP, use only Stripe external links | Simpler implementation, lower commission | Potential App Store rejection outside US, limits international expansion | Acceptable for US-only iOS launch |
| Hardcode AI prompts in Edge Functions | Quick iteration | Can't A/B test prompts, no prompt versioning, redeployment needed for prompt changes | Only in early phases; move to configurable prompts before production |
| Hardcode model name in Edge Functions | Quick to implement | Next model deprecation breaks features again | Use environment variable for model name |
| Test push notifications manually only | Faster initial development | Regressions go unnoticed, no CI validation | Never -- at minimum have a smoke test for token registration |
| Use Supabase Postgres Changes for presence instead of Presence API | Reuse existing realtime infrastructure | Database writes for ephemeral state, unnecessary storage, slower than Presence | Never -- Presence is purpose-built for this |
| Skip E2E tests for payment flows | Faster shipping | Payment bugs reach production, refund handling untested | Never -- payment flows must have E2E coverage |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI model selection | Using `gpt-4o-mini` which is deprecated since Feb 2026 | Use `gpt-5-mini` ($0.25/1M input, $2/1M output, 400K context, structured outputs) |
| Stripe + Supabase | Storing Stripe customer ID only in Stripe; no local mapping | Create `subscriptions` table linking Supabase `auth.users.id` to `stripe_customer_id`; populate on first checkout |
| Stripe webhooks + Edge Functions | Not handling out-of-order webhook delivery | Process webhooks idempotently using event IDs; check subscription status rather than assuming event order |
| Expo Notifications + EAS | Using Expo Go for push notification testing | Must use development builds; add `expo-notifications` to plugins array in app.json |
| Expo Notifications + Supabase | Storing push tokens in device-only storage | Store push tokens in a Supabase `push_tokens` table linked to user ID; update on every app launch (tokens can rotate) |
| OpenAI + Supabase Edge Functions | Calling OpenAI without timeout handling | Set a timeout on the fetch call to OpenAI (30s max); Edge Functions have a 150s wall-clock limit but users will not wait that long |
| Supabase Presence + existing Realtime | Mixing Presence channels with Postgres Changes channels | Keep them on separate channels; Postgres Changes channel for grocery sync, Presence channel for user activity indicators |
| Stripe + Premium Store (Zustand) | Calling `upgradeToPremium()` from client after Stripe Checkout success | Only update premium status via webhook -> database -> client subscription; client never directly sets premium state |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Subscribing to Presence on every screen mount | Excessive WebSocket connections, battery drain, hitting Supabase connection limits | Subscribe once at app level, share presence state via Zustand store | >10 concurrent household members or rapid screen navigation |
| Fetching subscription status from Supabase on every `canAccess()` call | Slow UI, excessive database reads, laggy premium feature gates | Cache subscription status in Zustand with 5-minute TTL; refresh on app foreground | Immediately noticeable with any latency |
| Sending full HTML to OpenAI for every recipe URL | High token usage, slow responses, unnecessary cost | Extract JSON-LD / schema.org structured data first; fall back to HTML only if structured data unavailable | >100 recipe imports/day cost adds up |
| Registering push token on every app launch without deduplication | Duplicate tokens in database, users receiving multiple copies of each notification | Upsert token by device ID; remove old tokens on logout | >1000 users with multiple devices |
| Presence heartbeat interval too aggressive | Battery drain on mobile, excessive WebSocket traffic | Use 15-30 second heartbeat intervals for mobile; 5 seconds is too aggressive | Noticeable on older devices immediately |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Stripe secret key in React Native bundle | Full Stripe account compromise; anyone decompiling the app gets the key | All Stripe API calls (customer creation, subscription management, webhook handling) happen in Supabase Edge Functions only; client only receives publishable key |
| No RLS on `subscriptions` table | Users could read/modify other users' subscription status | Add RLS: users can only SELECT their own subscription; only the service role (used by webhook Edge Function) can INSERT/UPDATE |
| Push token stored without user association | Cannot target notifications; tokens could be associated with wrong user | Always store push token with authenticated user ID; clear token on logout; re-register on login |
| Webhook endpoint without signature verification | Attackers can fake subscription events, granting free premium access | Verify Stripe webhook signature on every request using the signing secret |
| AI prompts injectable via user-controlled URL content | Prompt injection via malicious recipe pages could extract system prompts or produce harmful content | Sanitize HTML before sending to LLM; use structured output mode; validate AI response schema before returning to client |
| Premium features gated only in UI, not at data layer | Users can bypass client gating via API calls directly to Supabase | Enforce premium gating in RLS policies (e.g., premium analytics data only accessible if user's subscription is active) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing payment UI before loading subscription status | User sees "Upgrade" button then it disappears when status loads; feels broken | Show skeleton/loading state for premium UI until subscription status is fetched |
| Push notification permission requested on first app launch | Users reflexively deny; cannot easily re-enable later | Explain value first ("Get dinner reminders and leftover alerts"); request permission contextually, not during onboarding |
| Presence indicators with no timeout | Shows household member as "active" even after they locked their phone hours ago | Add 30-60 second inactivity timeout; show "last seen X min ago" for stale presence |
| AI meal suggestions without loading feedback | User taps "Surprise Me" and sees nothing for 3-5 seconds while AI generates | Show engaging loading animation with "Thinking..." text; stream partial results if possible |
| Subscription cancellation buried or confusing | Users get frustrated, leave bad reviews, file chargebacks | Use Stripe Customer Portal for subscription management (cancel, update payment); link to it clearly from settings |
| Premium gate with no preview of what's behind it | Users don't know what they're paying for | Show blurred/teaser previews of premium features (analytics charts, advanced suggestions) with clear upgrade CTA |

## "Looks Done But Isn't" Checklist

- [ ] **AI Model:** Verify `parse-recipe-url` Edge Function uses `gpt-5-mini`, NOT deprecated `gpt-4o-mini`
- [ ] **Stripe Subscriptions:** Verify `invoice.payment_failed` webhook updates user status to `past_due` and shows in-app messaging
- [ ] **Stripe Subscriptions:** Verify `cancel_at_period_end` is handled (user keeps access until current period expires)
- [ ] **Push Notifications:** Verify app re-registers push token on every launch (tokens can silently rotate)
- [ ] **Push Notifications:** Verify tapping a "dinner reminder" notification deep-links to the correct meal plan day
- [ ] **Push Notifications:** Verify notifications received when app is fully terminated
- [ ] **Real-time Presence:** Verify presence state is removed when user backgrounds the app, not just on explicit logout
- [ ] **AI Recipe Extraction:** Verify user sees actionable error message when URL parsing fails (not just a generic error)
- [ ] **AI Meal Generator:** Verify generated meals actually respect the user's stated restrictions
- [ ] **E2E Tests:** Verify tests cover failed payments, expired subscriptions, denied notification permissions, AI timeouts
- [ ] **Premium Tier:** Verify what happens when a subscription payment fails but Stripe is retrying (grace period)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| gpt-4o-mini deprecated (feature broken) | LOW | Change model string to `gpt-5-mini` in Edge Function, upgrade response_format, redeploy. 30-minute fix. |
| Premium state in AsyncStorage only (no server truth) | HIGH | Create subscriptions table, backfill from Stripe API, migrate premiumStore to read from server, add webhook handlers |
| App Store rejection for Stripe usage | MEDIUM | Request External Purchase Entitlement, add Apple IAP as alternative payment method if needed, resubmit for review |
| Push notification credentials expired/misconfigured | LOW | Run `eas credentials`, regenerate APNs key, redeploy; users will get new token on next app launch |
| Presence sync flooding causing UI flicker | LOW | Add debounce (200-500ms) to presence state updates, switch to `sync` event instead of `join`/`leave` |
| AI costs out of control | MEDIUM | Add rate limiting to Edge Functions, implement response caching, reduce max_tokens, add per-user usage tracking |
| Webhook endpoint exploited (no signature verification) | HIGH | Add signature verification, audit all subscription records against Stripe API, revoke fraudulent premium access |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| gpt-4o-mini deprecated | Phase 1 Day 1 (immediate fix) | Recipe URL import returns valid data |
| AsyncStorage-only premium state | Stripe/Payments (first) | `canAccess()` reads from Supabase table, not AsyncStorage directly |
| App Store rejection for Stripe | Stripe/Payments (architecture) | External Purchase Entitlement requested; payment flow matches Stripe iOS docs |
| Push notification credential issues | Push Notifications (setup) | Notifications received on physical TestFlight build |
| Presence sync misinterpretation | Real-time Presence | No phantom avatar flicker during 30-second observation |
| AI cost spiral | Enhanced AI (before new features) | Per-user rate limits enforced; monthly cost tracked in dashboard |
| Webhook signature missing | Stripe/Payments (webhook handler) | Unsigned POST to webhook endpoint returns 400, not 200 |
| E2E test gaps on negative paths | E2E Testing | Test suite includes failed payment, denied permissions, AI timeout scenarios |
| Premium gating only in UI | Stripe/Payments + RLS | Direct Supabase API call without premium subscription returns 403 for premium data |

## Sources

- [OpenAI Model Deprecations](https://developers.openai.com/api/docs/deprecations) -- gpt-4o-mini deprecated Feb 2026
- [GPT-5 mini Model](https://platform.openai.com/docs/models/gpt-5-mini) -- replacement model details
- [Stripe React Native SDK - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/stripe/)
- [Build a subscriptions integration - Stripe Documentation](https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=react-native)
- [Handling Stripe Webhooks - Supabase Docs](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [Can You Use Stripe for In-App Purchases in 2026? - Adapty](https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/)
- [Stripe iOS digital goods docs](https://docs.stripe.com/mobile/digital-goods)
- [Run E2E tests on EAS Workflows with Maestro - Expo Documentation](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
- [Our Experience Adding E2E Testing to React Native with Maestro](https://addjam.com/blog/2026-02-18/our-experience-adding-e2e-testing-react-native-maestro/)
- Existing codebase analysis: `premiumStore.ts`, `useGrocerySync.ts`, `parse-recipe-url/index.ts`

---
*Pitfalls research for: Mise v2.0 -- Adding Stripe, push notifications, real-time presence, enhanced AI, and E2E testing to existing React Native/Expo + Supabase app*
*Researched: 2026-03-24*
