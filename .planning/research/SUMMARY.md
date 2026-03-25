# Project Research Summary

**Project:** Mise v2.0 — AI, Payments, Push Notifications, Presence & E2E Testing
**Domain:** Collaborative dinner planning mobile app (React Native / Expo / Supabase)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Mise v2.0 is an upgrade to an existing, functioning React Native/Expo app built on Supabase. The v1.0 foundation (Expo SDK 55, Zustand stores, FlashList, Supabase Realtime) is solid and unchanged — the upgrade layers on four major capabilities: real payment processing via Stripe, push notifications via Expo's notification system, real-time presence indicators via Supabase Realtime Presence, and enhanced AI via OpenAI gpt-5-mini. One critical issue exists right now before any v2.0 work begins: the `parse-recipe-url` Edge Function calls `gpt-4o-mini`, which was deprecated by OpenAI in February 2026 — recipe import is completely broken in production and must be fixed as the first act of v2.0 work.

The recommended approach follows the dependency graph: fix the broken AI model immediately, then build payment and subscription infrastructure (the primary business goal), then add push notifications (notification settings UI already exists and currently does nothing), then add presence and activity features (real-time infrastructure already exists via grocery sync), then enhance AI features (meal generator, improved extraction), and finally add comprehensive E2E test coverage with Maestro. This ordering respects technical dependencies and delivers revenue capability before delight features. The total estimated scope is 10–14 weeks. Notably, three of the five capability areas require zero new npm packages — Supabase Presence is already in the installed client, enhanced AI is Edge Function changes only, and Maestro is a standalone CLI that never touches the project.

The primary risks are: (1) Apple App Store rejection if the Stripe payment flow does not use the External Purchase Entitlement introduced post-Epic v. Apple ruling — architecture must be decided before implementation begins; (2) Stripe webhook security — the webhook Edge Function must disable JWT verification but replace it with Stripe signature verification, not leave the endpoint unprotected; and (3) push notification credentials — these require EAS development builds and physical iOS devices to test, and are frequently misconfigured silently. All three risks are well-documented and avoidable with the correct architecture.

## Key Findings

### Recommended Stack

The existing stack is stable and receives no changes. New additions are minimal and purposeful. `@stripe/stripe-react-native@^0.60.0` provides PaymentSheet UI with Expo config plugin support. `expo-notifications@~55.0.13` and `expo-device@~55.0.10` handle push notification registration and delivery; both require EAS builds, not Expo Go. Supabase Realtime Presence requires zero new dependencies — it is built into the existing `@supabase/supabase-js` client already in the project. The AI model changes from deprecated `gpt-4o-mini` to `gpt-5-mini` (drop-in API replacement with 400K context, structured outputs, and comparable pricing at $0.25/1M input). Maestro CLI is used for E2E testing as an external tool with no project dependencies or build config changes required.

**Core technologies:**
- `@stripe/stripe-react-native@^0.60.0`: Client-side payment UI — only viable official Stripe SDK for Expo; config plugin handles PCI compliance, 3D Secure, Apple Pay
- `expo-notifications@~55.0.13` + `expo-device@~55.0.10`: Push token registration and notification scheduling — first-party Expo SDK aligned with SDK 55, both required together
- `Supabase Realtime Presence` (zero new dependency): Live user tracking per screen — already in `@supabase/supabase-js`, same system as grocery sync
- `gpt-5-mini` (OpenAI API, server-side only): Recipe extraction + meal generation — confirmed drop-in replacement for deprecated gpt-4o-mini, 400K context, structured outputs
- `Maestro CLI` (external, not a project dependency): E2E testing — official Expo/EAS recommendation, YAML-based, no native module installation
- `stripe` (Deno via `esm.sh`): Server-side Stripe operations in Supabase Edge Functions — webhook verification, session creation, billing portal

**Critical version and compatibility notes:** `gpt-4o-mini` is deprecated as of February 2026 and returns API errors. All Stripe secret key operations must remain server-side in Supabase Edge Functions (Deno). Push notifications require EAS development builds — Expo Go has not supported push since SDK 53. Both Stripe and push notification native modules require the Expo config plugin entries in `app.json`.

### Expected Features

**Must have (table stakes):**
- AI model fix (gpt-4o-mini → gpt-5-mini) — existing recipe import is broken in production right now; 30-minute fix
- Stripe subscription checkout — freemium pricing UI already ships; users who tap "Upgrade" expect it to work
- Subscription billing portal — users who pay must be able to manage/cancel without contacting support; Stripe hosts this entirely
- Real premium feature gating — current `canAccess()` reads AsyncStorage and is trivially bypassable; must be server-authoritative before any real payments
- Push notifications (remote + local) — notification settings UI exists and promises functionality; cooking reminders are the highest-value first delivery
- E2E test coverage — non-negotiable for a v2.0 that introduces payments; Maestro flows for all major user journeys including failed payment paths

**Should have (differentiators):**
- AI-powered meal generator — context-aware suggestions using dietary prefs, recent history, leftovers, and budget; the real "Surprise Me" upgrade
- Enhanced AI recipe extraction — JSON-LD/schema.org first pass before LLM (handles ~80% of recipe sites for free), plus nutrition and image extraction
- Real-time presence indicators — avatar stacks on grocery list and recipe detail; creates the "cooking together" feeling that is Mise's core value
- Real-time activity feed — toast notifications for household member actions; extends existing Realtime subscriptions with low additional complexity
- Leftover expiry push alerts — high perceived value, low effort; local scheduling on leftover creation
- Budget warning push notifications — alert at 80%/100% of monthly target; client-side threshold check triggers push
- Premium analytics dashboard — cooking distribution, spending trends, top-rated meals; gates aggregate data behind premium tier

**Defer to post-v2.0:**
- Household activity remote push (server-triggered to other members) — higher infrastructure complexity than local notifications; validate demand via presence first
- Android support — Expo foundation supports it later, but splitting focus now delays iOS quality
- Multi-tier premium (Basic/Pro) — over-segmentation for a household app; keep binary free/premium
- In-app purchase (Apple IAP) — unnecessary 15–30% commission; Stripe external purchase is the right approach for US market
- Real-time chat — massive scope creep; activity feed provides collaborative awareness without chat infrastructure
- AI-generated recipe images — uncanny-valley food images reduce trust; extract images from source URLs instead

### Architecture Approach

The architecture is additive rather than structural: new Zustand stores layer alongside existing ones, new Supabase Edge Functions extend the existing function directory, and new database tables join the existing schema. The most significant structural change is replacing `premiumStore.ts` with a new `subscriptionStore.ts` that reads from a Supabase `subscriptions` table instead of AsyncStorage — this is the security foundation that makes payments trustworthy. Four new Edge Functions handle Stripe (webhook handler, checkout session, billing portal) and one handles push delivery and one handles AI meal generation. The existing `parse-recipe-url` function is upgraded in place. Supabase Database Webhooks on `meal_plans`, `leftovers`, and `grocery_items` trigger the push notification Edge Function, decoupling notification delivery from the client.

**Major components:**
1. `subscriptionStore.ts` (replaces `premiumStore.ts`) — server-authoritative subscription state; reads `subscriptions` Postgres table, preserves existing `canAccess()` API surface
2. `stripe-webhooks` Edge Function — receives and verifies Stripe events, writes subscription state; requires `verify_jwt = false` in config.toml AND Stripe signature verification (both must appear together)
3. `notificationStore.ts` + `useNotifications.ts` — push token registration, permission request with contextual explanation, in-app notification display
4. `presenceStore.ts` + `usePresence.ts` — Supabase Realtime Presence channels per screen; kept separate from existing Postgres Changes channels (never multiplexed)
5. `generate-meal` Edge Function — OpenAI gpt-5-mini with structured outputs; takes household context (prefs, history, leftovers, budget), returns recipe suggestions
6. `.maestro/` directory — YAML E2E flows covering auth, recipes, grocery, meal plan, and premium subscription flows

**New database tables:** `subscriptions`, `push_tokens`, `notifications`, `meal_generation_history`

**Key patterns enforced by research:**
- Never write subscription state from the client — only Stripe webhooks via Edge Functions can write `subscriptions` table
- Separate Presence channels from Postgres Changes channels — these are different Supabase Realtime primitives that cannot be multiplexed
- Never send push notifications from the app — use Database Webhook → Edge Function → Expo Push API chain
- Extract JSON-LD/schema.org structured data from recipe URLs before falling back to LLM (~80% of recipe sites support this for free)

### Critical Pitfalls

1. **gpt-4o-mini deprecated (active production bug)** — Change model string to `gpt-5-mini` in `supabase/functions/parse-recipe-url/index.ts` as the first action of v2.0; upgrade to `response_format: { type: 'json_schema' }` at the same time; abstract model name to an environment variable to prevent recurrence

2. **Client-side premium state is trivially bypassable** — Build `subscriptionStore` reading from `subscriptions` Supabase table before implementing any checkout UI; add RLS so only the service role (webhook Edge Function) can write subscription state; never call any premium upgrade function from the client

3. **Stripe webhook endpoint without signature verification** — Set `verify_jwt = false` in `supabase/config.toml` for the webhook function AND immediately add `stripe.webhooks.constructEvent()` with the signing secret; these two steps must always appear together; make event handling idempotent (same event delivered twice must not cause issues)

4. **Apple App Store rejection for using Stripe for digital goods** — Request Apple's External Purchase Entitlement before submitting for App Store review; structure payment flows so the backend is payment-provider-agnostic; use Stripe Checkout via external link per Stripe's iOS digital goods documentation; keep StoreKit/IAP as an architecture-level fallback option

5. **Push notification credentials silently broken** — Add `expo-notifications` to the `plugins` array in `app.json` (required for APNs entitlement; without it, iOS push registration silently fails); test only on physical devices with EAS development builds; test the full lifecycle (token registration → server send → device receipt → tap-to-open) before declaring complete

6. **Supabase Presence sync events cause phantom avatar flicker** — Use the `sync` event callback for UI updates rather than individual `join`/`leave` events; debounce presence state changes 200–500ms; use separate channels for Presence and Postgres Changes

7. **AI costs spiral from unthrottled recipe extraction and meal generation** — Add per-user rate limits in Edge Functions before shipping any new AI features; implement response caching for duplicate URL submissions; extract JSON-LD/schema.org data before falling back to LLM (free for ~80% of sites)

## Implications for Roadmap

Based on combined research, the dependency graph and business priorities suggest a 5-phase structure totaling 10–14 weeks:

### Phase 1: Critical Fixes and Payment Foundation
**Rationale:** The AI model deprecation is an active production regression that must be resolved before anything else — it breaks a core v1.0 feature today. Stripe subscriptions are the primary business goal of v2.0, and the server-authoritative subscription architecture must be laid before any other premium feature can be safely built. The subscription store and webhook handler are the foundation everything else depends on.
**Delivers:** Working recipe import, functioning premium checkout flow, real server-enforced subscription state, billing portal access, all Stripe webhook event handling
**Addresses:** AI model fix, Stripe subscription checkout, billing portal, real premium feature gating
**Avoids:** Shipping with broken recipe import, client-side premium bypass, Stripe webhook security hole, Apple App Store rejection
**Stack elements:** `@stripe/stripe-react-native`, `stripe` (Deno/esm.sh), `gpt-5-mini`
**Estimated effort:** 3–4 weeks (AI fix: 1 day; Stripe integration: 2–3 weeks)
**Research flag:** Apple External Purchase Entitlement application process is MEDIUM-confidence — verify current process against Apple Developer docs before implementation begins

### Phase 2: Push Notifications
**Rationale:** The notification settings UI already exists and promises functionality to users — delivering on this promise is the next highest user-facing gap. Local scheduled notifications (cooking reminders) are the highest-value, lowest-risk notification type and can ship before the full remote push infrastructure is proven. Building push infrastructure here also enables leftover alerts and budget warnings without additional phases.
**Delivers:** Push token registration and management, cooking reminders (local scheduled), leftover expiry alerts, budget threshold warnings, notification permission UX with contextual explanation
**Addresses:** Push notifications (remote + local), leftover expiry alerts, budget warning notifications
**Avoids:** APNs credential mismanagement, notification permission requested too early before user sees value, push tokens not updating on token rotation
**Stack elements:** `expo-notifications@~55.0.13`, `expo-device@~55.0.10`, Expo Push Service HTTP API, `push-notification` Edge Function
**Estimated effort:** 2–3 weeks
**Research flag:** EAS credential setup and APNs key registration have known sharp edges — plan explicit time for hands-on credential verification and full-lifecycle testing on a physical device before writing notification logic

### Phase 3: Real-Time Presence and Activity Feed
**Rationale:** Presence and activity feed both build on the existing Supabase Realtime infrastructure already used by grocery sync. They share a channel strategy, require zero new dependencies, and can be built together efficiently. These are delight features that reinforce Mise's "cooking together" value proposition — lower complexity than Phase 1–2 but high user-facing impact.
**Delivers:** Live avatar stacks on grocery list and recipe detail screens, activity feed toast notifications for household member actions
**Addresses:** Real-time presence indicators, real-time activity feed
**Avoids:** Presence sync event misinterpretation causing phantom avatar flicker, channel multiplexing between data sync and presence, excessive Realtime connection count
**Stack elements:** Supabase Realtime Presence (already in `@supabase/supabase-js`)
**Estimated effort:** 1–2 weeks
**Research flag:** None — Supabase Presence is fully documented; the existing `useGrocerySync.ts` hook provides the exact integration pattern to follow

### Phase 4: Enhanced AI Features and Premium Analytics
**Rationale:** With payments working and push infrastructure in place, enhanced AI becomes the signature differentiator. The meal generator is the highest-complexity feature and benefits from having the full household context system (subscriptions, preferences, history) established in prior phases. Schema.org extraction improvement should be built into the recipe parser before adding more AI surface area to keep costs predictable.
**Delivers:** AI-powered meal generator (context-aware suggestions, not random picks), improved recipe extraction (JSON-LD first, LLM fallback), meal generation history, premium analytics dashboard
**Addresses:** AI meal generator, enhanced AI recipe extraction, premium analytics dashboard
**Avoids:** AI cost spiral (rate limits and schema.org extraction built in from the start), prompt injection via malicious recipe URLs
**Stack elements:** `gpt-5-mini` structured outputs, `generate-meal` Edge Function, `meal_generation_history` table
**Estimated effort:** 2–4 weeks
**Research flag:** Prompt engineering for meal generation quality is empirical — plan for at least one quality iteration cycle (generate → test with real household data → refine) before calling the feature production-ready

### Phase 5: E2E Testing and Quality Hardening
**Rationale:** E2E tests are non-negotiable for a v2.0 that introduces payments. Maestro flows should cover the complete happy path for auth, recipe import, grocery management, meal planning, and premium checkout. Equally important: negative paths (failed payment, denied notification permissions, AI timeout, expired subscription) must be covered before production launch. Basic Maestro flows for auth and core navigation should begin as early as Phase 1 completes — Phase 5 is gap-fill and hardening, not the start.
**Delivers:** Maestro YAML flow coverage for all major user journeys and negative paths, `testID` props on all interactive components, CI integration via EAS Workflows
**Addresses:** E2E test coverage for all v2.0 features including payment failures and edge cases
**Avoids:** E2E test gaps on negative paths (payment failure, permissions denial, AI timeouts, expired subscription grace period)
**Stack elements:** Maestro CLI (external), EAS Workflows
**Estimated effort:** 2–3 weeks (spread; basic flows begin in Phase 1)
**Research flag:** None — Expo's official Maestro EAS Workflows integration is well-documented; the learning curve is YAML syntax, not architecture

### Phase Ordering Rationale

- **Phase 1 must come first** because the AI bug is a live production regression, and subscription architecture is the security foundation all other premium features depend on — building checkout UI before the server-authoritative store is dangerous
- **Phase 2 before Phase 3** because push infrastructure is independent and has higher user-facing impact (promises already made by the existing notification settings UI); presence is a delight feature that can wait
- **Phase 3 before Phase 4** because presence and activity feed are low-complexity additions that validate the collaborative UX before investing in the higher-complexity AI features; their Realtime patterns also inform the activity event shapes the AI generator might need
- **Phase 4 before Phase 5 (hardening)** because E2E tests need stable features to test; however basic Maestro flows for auth and core navigation should be written incrementally starting in Phase 1
- **Analytics in Phase 4 (not Phase 1)** because the premium subscription gating from Phase 1 must exist before analytics can be properly gated, and aggregate data quality improves as more household data accumulates

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Stripe/Apple):** Apple External Purchase Entitlement compliance details and current App Store review expectations — MEDIUM confidence due to ongoing Apple appeal of Epic v. Apple ruling; verify current entitlement request process against Apple Developer docs before writing Stripe code
- **Phase 2 (Push/EAS):** APNs key rotation and EAS credential management specifics — the theory is well-documented but the hands-on flow (device registration, provisioning profiles, EAS credentials dashboard) has known sharp edges worth researching before the phase begins

Phases with standard patterns (skip additional research):
- **Phase 3 (Presence):** Supabase Realtime Presence is fully documented with working code examples; existing `useGrocerySync.ts` provides the integration pattern; no architectural unknowns
- **Phase 4 (AI):** OpenAI gpt-5-mini structured outputs are well-documented; main challenge is prompt engineering iteration, not API integration
- **Phase 5 (E2E):** Maestro + EAS Workflows has official Expo step-by-step documentation; no architectural unknowns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All new packages verified against Expo SDK 55 compatibility; gpt-5-mini verified as current OpenAI model; Maestro verified as Expo official recommendation; deprecation confirmed from OpenAI docs |
| Features | HIGH | Feature scope derived from existing codebase analysis plus official capability docs; complexity estimates grounded in existing store/hook patterns in the codebase |
| Architecture | HIGH | Architecture derived from existing codebase examination plus official integration patterns; component boundaries match established patterns; anti-patterns verified against official docs |
| Pitfalls | HIGH | Pitfalls verified against official docs and known deprecation timeline; gpt-4o-mini deprecation is confirmed fact; Stripe webhook security pattern is directly from Supabase official docs |

**Overall confidence:** HIGH

### Gaps to Address

- **Apple External Purchase Entitlement process (MEDIUM confidence):** The April 2025 ruling allows external payments, but the exact entitlement request process and current App Store review standards may have evolved. Validate against current Apple Developer documentation before Phase 1 implementation. Keep payment architecture provider-agnostic in case Apple's commission appeal changes the landscape.

- **EAS credential setup for APNs (implementation detail):** Theory is well-documented, but the hands-on flow (registering devices, creating provisioning profiles, EAS credentials dashboard) has known sharp edges. Plan explicit time in Phase 2 for credential setup and full-lifecycle testing on a physical device before writing any notification logic.

- **AI meal generation prompt quality (empirical):** The architecture and API integration are sound, but generating contextually relevant, high-quality meal suggestions that respect dietary restrictions and feel personalized is an empirical problem. Plan for at least one quality iteration cycle before declaring the feature production-ready.

- **Supabase Realtime connection limits at scale (monitor):** Free tier allows 200 concurrent connections. Adding presence channels roughly doubles connection count per active user session. Define the Supabase plan upgrade trigger explicitly (e.g., "upgrade at 75 concurrent active users") before presence ships to production.

## Sources

### Primary (HIGH confidence)
- [Expo Notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/) — SDK 55 config plugin, APNs entitlement setup
- [Expo Push Notifications setup guide](https://docs.expo.dev/push-notifications/push-notifications-setup/) — full token registration flow
- [Stripe React Native SDK — Expo docs](https://docs.expo.dev/versions/latest/sdk/stripe/) — config plugin, Expo compatibility
- [Stripe Subscriptions — React Native](https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=react-native) — subscription flow architecture
- [Stripe iOS digital goods](https://docs.stripe.com/mobile/digital-goods) — External Purchase Entitlement requirements
- [Supabase Stripe webhook Edge Functions example](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) — webhook handling pattern
- [Supabase Expo Stripe payments example repo](https://github.com/supabase-community/expo-stripe-payments-with-supabase-functions) — full working reference
- [Supabase Realtime Presence docs](https://supabase.com/docs/guides/realtime/presence) — Presence API, sync/join/leave event semantics
- [OpenAI Model Deprecations](https://developers.openai.com/api/docs/deprecations) — gpt-4o-mini deprecated February 2026 confirmed
- [GPT-5 mini model page](https://platform.openai.com/docs/models/gpt-5-mini) — pricing, structured outputs support, 400K context window
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — json_schema response_format usage
- [Maestro React Native docs](https://docs.maestro.dev/get-started/supported-platform/react-native) — testID usage, RN support
- [Expo Maestro E2E workflow](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) — EAS Workflows CI integration

### Secondary (MEDIUM confidence)
- [Can you use Stripe for in-app purchases in 2026? — Adapty](https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/) — Apple external payment policy post-Epic ruling; legal landscape still evolving as Apple appeals
- [Our experience adding E2E testing to React Native with Maestro — Addjam](https://addjam.com/blog/2026-02-18/our-experience-adding-e2e-testing-react-native-maestro/) — real-world Maestro implementation notes and sharp edges

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
