# Feature Landscape

**Domain:** Collaborative dinner planning app - v2.0 AI, Payments & Polish
**Researched:** 2026-03-24

## Table Stakes

Features users expect for a v2.0 upgrade. Missing = the upgrade feels hollow.

| Feature | Why Expected | Complexity | Dependencies on Existing | Notes |
|---------|--------------|------------|--------------------------|-------|
| Stripe subscription checkout | Freemium shell already shows pricing UI ($9.99/mo). Users who tap "Upgrade" expect it to work. | High | `premiumStore.ts` (replace AsyncStorage-based tier with server-verified subscription), `SubscriptionSheet.tsx` (wire real Stripe PaymentSheet) | **Critical legal nuance:** Post-Epic v. Apple (April 2025), US iOS apps CAN link to external payment for digital goods via Stripe. However, this only applies to the US App Store. For a meal planning app (not a "reader" app), safest approach is Stripe via external checkout link, not in-app PaymentSheet for digital subscriptions. Stripe processing fee ~2.9% + $0.30 vs Apple's 15-30%. Must implement server-side webhook handling in Supabase Edge Functions to verify subscription status. |
| Subscription billing portal | Users who pay expect to manage/cancel their subscription without contacting support. | Medium | Stripe Customer Portal (hosted by Stripe, link from profile) | Stripe hosts this entirely -- just generate a portal session URL from Edge Function and open in-app browser. |
| Premium feature gating (real) | Current `canAccess()` checks AsyncStorage -- trivially bypassable and not tied to actual payment. | Medium | `premiumStore.ts` needs full rewrite to check `subscriptions` table in Supabase, `PREMIUM_FEATURES` list already defined | Server-side RLS policies should enforce gating, not just client-side checks. Add `subscriptions` table with `status`, `stripe_customer_id`, `stripe_subscription_id`, `current_period_end`. |
| Push notifications (remote) | Notification settings UI already exists in profile. Users expect actual notifications after toggling settings on. | High | Notification settings UI (already built), Supabase for storing push tokens, Expo Push Service for delivery | Requires EAS Build (not Expo Go). Need `expo-notifications` + `expo-device`. Store Expo push tokens in `push_tokens` table. Send via Supabase Edge Functions calling Expo Push API. |
| Local scheduled notifications (cooking reminders) | Standard for any meal planning app -- remind me to start cooking at 5pm. | Medium | `meal_plans` table (has `plan_date` + `meal_type`), `expo-notifications` scheduleNotificationAsync | Schedule locally on device when meal plan is created/updated. Cancel when meal plan is removed. No server round-trip needed. |
| AI recipe extraction (working) | **BROKEN: gpt-4o-mini deprecated Feb 2026.** Existing Edge Function returns errors. Must swap to gpt-5-mini immediately. | Low | `parse-recipe-url` Edge Function, `src/lib/ai.ts` | Drop-in model swap: `gpt-4o-mini` -> `gpt-5-mini`. Also upgrade to structured outputs (`json_schema` response format) for guaranteed valid JSON. gpt-5-mini has 400K context window -- increase HTML truncation limit from 15K. |
| E2E test coverage | App has zero E2E tests. For a v2.0 shipping with payments, this is non-negotiable. | High | All existing screens + new features | Maestro is the standard for Expo E2E testing (YAML-based, no build config changes, official EAS Workflows support). Requires dev build on simulator. |

## Differentiators

Features that set Mise apart from generic meal planners. Not expected, but create the "wow" factor.

| Feature | Value Proposition | Complexity | Dependencies on Existing | Notes |
|---------|-------------------|------------|--------------------------|-------|
| AI-powered meal generator | Goes beyond the existing "Surprise Me" (random pick from library). Uses dietary prefs, cooking history, household size, leftovers, and budget to generate NEW recipe suggestions the household hasn't tried. | High | `suggestions.ts` (current logic is pure heuristic -- rated 4+ stars, not cooked in 3 weeks), dietary prefs in profile, `leftovers` table, `budget_settings` table, `meal_plans` history | Implement as Supabase Edge Function calling OpenAI gpt-5-mini with structured outputs (JSON schema). Feed context: dietary restrictions, recent meal history (last 2-3 weeks), current leftovers, budget remaining, household size. Return structured recipe data matching `RecipeInsert` schema. Differentiation: context-aware suggestions, not just random picks. |
| Enhanced AI recipe extraction | Current `parse-recipe-url` Edge Function works but is basic -- single LLM call on raw URL. Enhanced version handles recipe sites with heavy JS rendering, paywalled content fallbacks, and extracts nutrition data + images. | Medium | `ai.ts` (`parseRecipeUrl`), `parse-recipe-url` Edge Function | Improve extraction pipeline: 1) Fetch URL with proper User-Agent, 2) Look for JSON-LD structured data (`schema.org/Recipe`) first (free, no LLM cost), 3) Fall back to LLM extraction only when structured data is missing, 4) Add image URL extraction, 5) Add nutrition_info field to recipe schema. Schema.org/Recipe is used by ~80% of major recipe sites -- extracting it is near-free and more reliable than LLM parsing. |
| Real-time presence indicators | When household members are viewing the grocery list or a recipe, show live avatar bubbles indicating who is active. Creates the "cooking together" feeling even when apart. | Medium | `useGrocerySync.ts` (already uses Supabase Realtime channels), `Avatar.tsx` component, `household_members` data | Use Supabase Realtime Presence (already available via `@supabase/supabase-js`). Track presence per screen: `{ user_id, display_name, avatar_url, screen: "grocery_list" | "recipe_detail" | "meal_plan" }`. Subscribe to presence `sync`/`join`/`leave` events. Render as stacked avatar component (like the Supabase RealtimeAvatarStack pattern). Key: presence data is ephemeral (not stored in DB) -- just tracks who's currently online and where. |
| Real-time activity feed | Show live "Sarah just checked off Chicken Breast" or "Alex added Street Tacos to Wednesday" toast notifications within the app. | Low | `useGrocerySync.ts` already receives INSERT/UPDATE/DELETE events with full payload including `checked_by` | Extend existing Realtime subscriptions to include `profiles` join for display names. Show transient toast/snackbar for activity from OTHER household members. Low complexity because the Realtime infrastructure already exists -- just need UI layer. |
| Premium analytics dashboard | Cooking distribution charts, spending trends over time, top-rated meals, most-cooked recipes. | Medium | `expenses` table, `meal_plans` table, `recipe_ratings` table, `budget_settings` table | Aggregate queries in Supabase (could be Postgres views or RPC functions). Charts via `react-native-svg` or similar. Gate behind premium tier. |
| Leftover expiry push alerts | Proactive notification when a leftover is approaching its use-by date (1 day before, day of). | Low | `leftovers` table (`use_by_date` field), push notification infrastructure | Schedule local notification when leftover is added. Simple date math. High perceived value for low effort. |
| Budget warning notifications | Alert when household spending exceeds 80% or 100% of monthly budget target. | Low | `budget_settings.monthly_target`, `expenses` table, push notification infrastructure | Check on each expense addition. If threshold crossed, send push to all household members. Edge Function trigger or client-side check + Expo Push. |

## Anti-Features

Features to explicitly NOT build for v2.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| In-App Purchase (Apple IAP) for subscriptions | Unnecessary complexity and 15-30% commission. Post-Epic v. Apple ruling (April 2025), US apps can use external payment links. Mise is iOS-only in US market. RevenueCat/StoreKit integration adds significant native complexity. | Use Stripe with external checkout link (web-based Stripe Checkout opened in Safari/in-app browser). ~3% fees vs 15-30%. Simpler implementation via Supabase Edge Functions. |
| Real-time chat between household members | Out of scope per PROJECT.md. Would require message storage, read receipts, typing indicators, notification routing -- massive scope creep for marginal value in a meal planning app. | Activity feed (toast notifications of actions) provides lightweight awareness without chat infrastructure. |
| AI-generated recipe images | Tempting to generate food photos with DALL-E/Midjourney, but uncanny-valley food images reduce trust. Expensive per-image. | Extract images from source URLs during AI recipe import. Use placeholder illustrations for manual recipes. |
| Meal prep / batch cooking workflows | Out of scope per PROJECT.md. Different UX paradigm (multi-day planning, portioning, storage tracking). | Keep per-day meal planning simple. Leftover tracker already handles "what to use up." |
| Multi-tier premium (Basic/Pro/Enterprise) | Over-segmentation for a household app. One premium tier is enough. Simplifies Stripe integration, feature gating logic, and user decision. | Single premium tier at $9.99/mo. Binary free/premium. Keep `PremiumTier = 'free' | 'premium'` as-is. |
| Offline-first sync engine | Massive complexity (conflict resolution, queue management). Supabase Realtime already handles connectivity. The app is inherently collaborative -- offline edits without sync defeat the purpose. | Optimistic UI updates (already in place) + graceful error handling when offline. Show "offline" banner, retry on reconnection. |
| Android support in v2.0 | Out of scope per PROJECT.md. Expo foundation supports it later, but splitting focus now delays iOS quality. | Keep cross-platform-compatible code (React Native + Expo), but only test/build for iOS. Android is a future milestone. |

## Feature Dependencies

```
AI Model Fix (gpt-4o-mini -> gpt-5-mini)
  --> Enhanced AI Recipe Extraction (structured outputs, schema.org)
  --> AI Meal Generator (uses same model + structured outputs)

Stripe Subscription Checkout
  --> Premium Feature Gating (real)
        --> Premium Analytics Dashboard

Push Notification Infrastructure (expo-notifications + push tokens)
  --> Cooking Reminder Notifications (local scheduled)
  --> Leftover Expiry Alerts (local scheduled)
  --> Budget Warning Notifications (remote push)
  --> Household Activity Push Notifications (remote push)

Real-time Presence Indicators
  --> (builds on existing Supabase Realtime channels in useGrocerySync)

Real-time Activity Feed
  --> (builds on existing Supabase Realtime channels in useGrocerySync)
  --> Real-time Presence Indicators (share presence channel)

E2E Testing (Maestro)
  --> All features above (tests should cover new + existing features)
  --> Requires EAS dev build (not Expo Go)
```

## MVP Recommendation

Prioritize for v2.0 in this order:

1. **Fix gpt-4o-mini deprecation** -- The existing recipe extraction feature is BROKEN right now. Swap to gpt-5-mini in the Edge Function. This is a 30-minute fix that unblocks everything else.

2. **Stripe subscriptions + real premium gating** -- Monetization is the primary business goal. Replace the AsyncStorage shell with server-verified subscriptions. The freemium shell UI is already built, so this is "completing" an existing feature, not building from scratch.

3. **Push notification infrastructure + cooking reminders** -- Notification settings UI already exists and promises functionality. Local scheduled notifications (cooking reminders) are the highest-value, lowest-risk notification type. Build the infrastructure, ship cooking reminders first, then layer on leftover/budget alerts.

4. **Enhanced AI recipe extraction** -- Quick win. Adding JSON-LD/schema.org parsing to the existing Edge Function dramatically improves reliability with minimal effort. LLM fallback already works. This is an incremental improvement to an existing feature.

5. **Real-time presence indicators** -- Medium effort, high delight. Supabase Presence API is straightforward given the existing Realtime channel usage. Stacked avatar bubbles on grocery list and recipe detail screens create the collaborative feeling that is Mise's core value prop.

6. **AI meal generator** -- The signature differentiator. Build as a Supabase Edge Function with OpenAI gpt-5-mini structured outputs. Feed household context (dietary prefs, recent history, leftovers, budget). Return structured recipe suggestions. Higher complexity but highest differentiation.

7. **Premium analytics dashboard** -- Gate behind premium. Aggregate existing data (expenses, meal plans, ratings) into charts. Motivates upgrades.

8. **E2E testing (Maestro)** -- Should be built incrementally alongside each feature above, not as a separate "testing phase." Write Maestro flows for each feature as it ships. Final phase is gap-fill testing for existing v1.0 features.

**Defer to post-v2.0:**
- Household activity push notifications (remote push to other members): Requires server-side trigger infrastructure in Supabase (database webhooks or pg_notify). Higher complexity than local notifications. Ship presence indicators first to validate demand for collaboration awareness.

## Complexity Budget

| Feature | Estimated Effort | Risk Level | Notes |
|---------|-----------------|------------|-------|
| AI model fix (gpt-5-mini swap) | 1-2 hours | LOW | Change model string + upgrade response_format in Edge Function |
| Stripe subscriptions + billing | 2-3 weeks | HIGH | Webhook handling, Edge Functions, RLS policies, testing payment flows. Apple review risk if external payment link implementation is not compliant. |
| Premium gating (real) | 1 week | LOW | Rewrite premiumStore to check Supabase `subscriptions` table. Add RLS. |
| Push notification infra | 1-2 weeks | MEDIUM | EAS Build required. APNs credential setup. Token management. Permission flows. |
| Cooking reminders (local) | 3-5 days | LOW | Local scheduling with expo-notifications. Straightforward. |
| Leftover/budget alerts | 3-5 days | LOW | Built on push infra. Simple date/threshold logic. |
| Enhanced AI extraction | 1 week | LOW | Add JSON-LD parsing layer + structured outputs to existing Edge Function. Incremental. |
| AI meal generator | 1-2 weeks | MEDIUM | New Edge Function. Prompt engineering for quality suggestions. Structured output schema design. |
| Real-time presence | 1 week | LOW | Supabase Presence is well-documented. Avatar stack UI component. |
| Activity feed | 3-5 days | LOW | Extend existing Realtime subscriptions. Toast UI. |
| Premium analytics | 1-2 weeks | MEDIUM | Chart library selection. Postgres aggregate queries. |
| E2E testing (Maestro) | 2-3 weeks (spread) | MEDIUM | Learning curve for Maestro YAML. Need dev builds. CI integration with EAS Workflows. |

**Total estimated: 10-14 weeks** for full v2.0 scope.

## Sources

- [Stripe Subscriptions - React Native](https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=react-native) - HIGH confidence
- [Expo Stripe SDK docs](https://docs.expo.dev/versions/latest/sdk/stripe/) - HIGH confidence
- [Can you use Stripe for in-app purchases after Epic v. Apple](https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/) - MEDIUM confidence (legal landscape still evolving)
- [Stripe iOS digital goods docs](https://docs.stripe.com/mobile/digital-goods) - HIGH confidence
- [Expo Notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/) - HIGH confidence
- [Expo Push Notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) - HIGH confidence
- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence) - HIGH confidence
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) - HIGH confidence
- [OpenAI Model Deprecations](https://developers.openai.com/api/docs/deprecations) - HIGH confidence (gpt-4o-mini deprecated Feb 2026)
- [GPT-5 mini Model](https://platform.openai.com/docs/models/gpt-5-mini) - HIGH confidence (replacement at $0.25/1M input)
- [Maestro E2E with Expo](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) - HIGH confidence
- [Maestro React Native docs](https://docs.maestro.dev/get-started/supported-platform/react-native) - HIGH confidence
