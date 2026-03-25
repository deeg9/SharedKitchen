# Stack Research: Mise v2.0 New Capabilities

**Domain:** Collaborative dinner planning app -- payments, push notifications, real-time presence, enhanced AI, E2E testing
**Researched:** 2026-03-24
**Confidence:** HIGH

## Context

This covers ONLY new stack additions for v2.0. The existing stack (Expo SDK 55, React Native 0.83, Supabase, Zustand, FlashList, Reanimated, Jest) is validated and unchanged.

---

## Recommended Stack Additions

### Payments: Stripe

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @stripe/stripe-react-native | ^0.60.0 | Client-side payment UI (PaymentSheet, card collection) | Official Stripe SDK with first-class Expo support via config plugin. Provides pre-built PaymentSheet UI that handles PCI compliance, 3D Secure, and Apple Pay. No other viable option for direct Stripe integration in RN. |
| stripe (Node/Deno) | ^17.x | Server-side Stripe API in Supabase Edge Functions | Needed for creating customers, subscriptions, checkout sessions, and verifying webhooks. Runs in Deno-based Edge Functions. |

**Architecture:** All Stripe secret-key operations run in Supabase Edge Functions (Deno). The client only uses the publishable key via `@stripe/stripe-react-native`. Webhook events from Stripe hit a dedicated Edge Function that updates subscription status in Postgres.

**Apple App Store Compliance (CRITICAL):** As of the Epic v. Apple ruling (2025), US iOS apps CAN use Stripe for digital subscriptions via external payment links. Mise qualifies because meal planning is a service, not a pure digital good. However, you MUST request Apple's External Purchase Entitlement before submitting to App Review. Current US commission on external payments is 0% (Apple is appealing). Plan for this potentially changing -- keep StoreKit/IAP as a fallback consideration.

**Expo Config Plugin:**
```json
{
  "plugins": [
    [
      "@stripe/stripe-react-native",
      {
        "merchantIdentifier": "merchant.com.mise.app",
        "enableGooglePay": false
      }
    ]
  ]
}
```

### Push Notifications: Expo Notifications

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-notifications | ~55.0.13 | Push notification handling (tokens, display, scheduling) | First-party Expo package, aligned with SDK 55. Handles both local scheduling (cooking reminders) and remote push (household activity). Uses Expo Push Service as broker to APNs -- no need to manage APNs certificates manually in app code. |
| expo-device | ~55.0.10 | Device type detection (physical device required for push) | Required to gate push token registration -- push tokens only work on physical devices, not simulators. |
| expo-constants | ~55.0.9 | Access projectId for Expo Push Token registration | Already in the project but may need explicit import for push token flow. |

**Architecture:** Client registers for push token on app launch (physical device only). Token stored in Supabase `push_tokens` table keyed to user_id. Supabase Edge Functions (or Database Webhooks + Edge Functions) send push notifications via Expo Push Service HTTP API when events occur (leftover expiring, budget threshold, household member activity).

**Expo Config Plugin (REQUIRED for iOS APNs entitlement):**
```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png",
        "color": "#334537"
      }
    ]
  ]
}
```

**Server-side sending (Edge Function):**
```typescript
// Use expo-server-sdk in Supabase Edge Function (or direct HTTP POST)
// POST https://exp.host/--/api/v2/push/send
```

### Real-Time Presence: Supabase Realtime Presence

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @supabase/supabase-js | ^2.100.0 (already installed) | Presence channels for live user tracking | No new dependency needed. Supabase Presence is built into the existing supabase-js client. Uses `channel.track()` to publish user state and `presenceState()` to read who is online. Already using Supabase Realtime for grocery sync -- Presence is the same system, different mode. |

**Architecture:** Each screen that needs presence (grocery list, recipe detail, meal plan) joins a Presence channel scoped to the household. Users track their state (`{ user_id, screen, action }`). UI renders live avatar stacks or "typing" indicators based on presence payloads. Join/leave/sync events drive the UI.

**No new packages required.** This is purely a feature of the existing `@supabase/supabase-js` client.

### Enhanced AI: OpenAI Model Upgrade

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| OpenAI API (gpt-5-mini) | API model: `gpt-5-mini` | Recipe extraction + meal generation | **CRITICAL: gpt-4o-mini was deprecated Feb 2026.** The existing `parse-recipe-url` Edge Function currently calls `gpt-4o-mini` which will return errors. gpt-5-mini is the direct replacement at $0.25/1M input, $2/1M output tokens (comparable to old gpt-4o-mini pricing). Supports structured outputs (json_schema response_format) for reliable recipe extraction. 400K context window (up from 128K) means no need to truncate HTML as aggressively. |

**Changes needed in existing code:**
1. Update `supabase/functions/parse-recipe-url/index.ts`: Change `model: 'gpt-4o-mini'` to `model: 'gpt-5-mini'`
2. Upgrade from `response_format: { type: 'json_object' }` to proper `response_format: { type: 'json_schema', json_schema: {...} }` for guaranteed schema compliance (structured outputs)
3. Increase HTML truncation limit from 15000 chars -- gpt-5-mini's 400K context can handle much more

**New Edge Function for meal generation:** `generate-meal-suggestions` -- takes user preferences, dietary restrictions, recent meal history, and returns personalized dinner suggestions. Same model, different prompt.

### E2E Testing: Maestro

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Maestro CLI | latest (install via curl) | End-to-end mobile UI testing | Industry standard for React Native E2E in 2026. YAML-based test flows (no code). Zero project dependencies -- standalone CLI that interacts with the running app via the device. Works with Expo development builds. Official Expo integration for EAS Workflows CI/CD. No native module installation, no pod installs, no build config changes. |

**Why Maestro over Detox:** Detox requires native module integration, complex build configurations, and has historically fragile setup with Expo. Maestro is completely external to the project -- install the CLI, write YAML flows, run against a dev build. Expo officially recommends and integrates Maestro.

**Installation (dev machine only, not a project dependency):**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Requires:** Java 17+, iOS Simulator or physical device with dev build.

**Test file location:** `.maestro/` directory at project root (convention).

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-server-sdk | ^3.x | Send push notifications from Edge Functions via Expo Push Service | In Supabase Edge Functions that trigger push notifications. Alternative: direct HTTP POST to Expo Push API (no dependency needed). Recommend direct HTTP to avoid Deno compatibility issues. |
| stripe (Deno) | Import from esm.sh or npm: in Deno | Stripe API client for Edge Functions | Webhook verification, customer/subscription management in Edge Functions. Import as `import Stripe from 'https://esm.sh/stripe@17'` in Deno. |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Stripe CLI | Local webhook testing | `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook` forwards webhook events to local Supabase Edge Functions during development. Install via `brew install stripe/stripe-cli/stripe`. |
| Maestro Studio | Visual test authoring | `maestro studio` launches interactive UI for building test flows. Useful for discovering testIDs and building initial flows. |
| Supabase CLI | Edge Function development | Already in use. `supabase functions serve` for local development of new Edge Functions. |
| EAS Build | Development builds for push/Stripe testing | Push notifications and Stripe require native modules not available in Expo Go. Must use `eas build --profile development` for testing. |

---

## Installation

```bash
# New client dependencies
npx expo install expo-notifications expo-device
npx expo install @stripe/stripe-react-native

# Dev tools (not project dependencies)
brew install stripe/stripe-cli/stripe
curl -Ls "https://get.maestro.mobile.dev" | bash

# Supabase Edge Function dependencies (imported in Deno, not npm installed)
# stripe: import from esm.sh in Edge Functions
# No expo-server-sdk needed if using direct HTTP POST to Expo Push API
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Stripe via External Purchase | RevenueCat + StoreKit | If Apple reverses the 0% commission ruling and mandates IAP. RevenueCat abstracts StoreKit/Play Billing but adds $0+ (free tier) to $599/mo cost. Only consider if Stripe external payments become legally blocked. |
| Expo Notifications | OneSignal | If you need advanced segmentation, A/B testing on notifications, or analytics dashboards. Adds SDK dependency and external service. Expo Notifications is sufficient for Mise's needs (reminders, household events, budget alerts). |
| Maestro | Detox | If you need programmatic test control (conditionals, API mocking within tests). Detox offers more power but at much higher setup/maintenance cost with Expo. Maestro's YAML simplicity wins for Mise's scale. |
| gpt-5-mini | Claude 3.5 Haiku / Gemini 2.0 Flash | If OpenAI pricing increases or reliability degrades. Both are viable alternatives for structured extraction at similar price points. Would require changing the API call format in Edge Functions. |
| Supabase Presence | Custom WebSocket / Ably / Pusher | Never -- Supabase Presence is already included in the existing Supabase plan, requires zero new dependencies, and integrates with existing auth/RLS. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-native-iap / expo-in-app-purchases | Adds Apple's 15-30% commission on top of payment processing. US ruling allows Stripe external payments for meal planning subscriptions. More complex integration than Stripe. | @stripe/stripe-react-native with External Purchase Entitlement |
| Firebase Cloud Messaging (FCM) directly | Unnecessary complexity when Expo Push Service abstracts both APNs and FCM. Would require separate FCM setup and credentials management. | expo-notifications with Expo Push Service |
| Appium / WebdriverIO for E2E | Heavy, slow, flaky with React Native. Requires complex driver setup and is not well-suited to mobile-first testing. | Maestro CLI |
| gpt-4o-mini | Deprecated as of Feb 2026. API calls will fail. | gpt-5-mini (drop-in replacement with better context window) |
| Custom WebSocket server for presence | Would require hosting, scaling, and auth integration that Supabase Presence provides for free as part of the existing Supabase project. | Supabase Realtime Presence (built into @supabase/supabase-js) |
| Cheerio/JSDOM for recipe HTML parsing | Brittle CSS selector-based extraction breaks across recipe sites. LLM-based extraction is more robust and handles varied HTML structures. | gpt-5-mini structured outputs in Edge Function |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo-notifications@~55.0.13 | Expo SDK 55, React Native 0.83 | Must add to plugins array in app.json for iOS APNs entitlement |
| @stripe/stripe-react-native@^0.60.0 | Expo SDK 55, React Native 0.83 | Requires EAS development build (not Expo Go). Config plugin auto-configures native modules. |
| expo-device@~55.0.10 | Expo SDK 55 | Already aligned with SDK 55 versioning scheme |
| Maestro CLI | Any Expo/RN version | External tool, no version coupling. Requires testID props on components for reliable element selection. |
| gpt-5-mini (API) | N/A (server-side only) | Called from Supabase Edge Functions (Deno). No client-side dependency. |

---

## New Supabase Edge Functions Needed

| Function | Purpose | Stripe/AI/Push |
|----------|---------|----------------|
| `parse-recipe-url` | **EXISTS -- needs model upgrade** from gpt-4o-mini to gpt-5-mini | AI |
| `generate-meal-suggestions` | NEW: AI meal generation based on preferences/history | AI |
| `create-checkout-session` | NEW: Create Stripe Checkout session for subscription | Stripe |
| `stripe-webhook` | NEW: Handle Stripe webhook events (subscription changes, payment success/failure) | Stripe |
| `create-billing-portal` | NEW: Generate Stripe Customer Portal URL for subscription management | Stripe |
| `send-push-notification` | NEW: Send push notifications via Expo Push Service API | Push |

---

## New Database Tables Needed

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `push_tokens` | Store Expo Push Tokens per user/device | user_id, token, device_id, created_at |
| `subscriptions` | Track Stripe subscription state | user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end |
| `notification_log` | Audit trail for sent notifications | id, user_id, type, title, sent_at, read_at |

---

## Sources

- [Expo Notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/) -- SDK 55 version, config plugin setup, APNs entitlement -- HIGH confidence
- [Expo Push Notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- Full setup guide with expo-device, expo-constants -- HIGH confidence
- [Stripe React Native SDK (Expo docs)](https://docs.expo.dev/versions/latest/sdk/stripe/) -- Config plugin, Expo compatibility -- HIGH confidence
- [Stripe subscriptions guide (React Native)](https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=react-native) -- Subscription flow architecture -- HIGH confidence
- [Supabase Stripe webhook Edge Functions example](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) -- Webhook handling pattern -- HIGH confidence
- [Supabase Expo Stripe payments example repo](https://github.com/supabase-community/expo-stripe-payments-with-supabase-functions) -- Full working example -- HIGH confidence
- [Supabase Realtime Presence docs](https://supabase.com/docs/guides/realtime/presence) -- Presence API, track/untrack, sync events -- HIGH confidence
- [OpenAI model deprecations](https://developers.openai.com/api/docs/deprecations) -- gpt-4o-mini sunset Feb 2026 -- HIGH confidence
- [GPT-5 mini model page](https://platform.openai.com/docs/models/gpt-5-mini) -- Pricing, structured outputs support, 400K context -- HIGH confidence
- [Maestro React Native docs](https://docs.maestro.dev/get-started/supported-platform/react-native) -- RN support, testID usage -- HIGH confidence
- [Expo Maestro E2E workflow](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) -- EAS Workflows CI integration -- HIGH confidence
- [Adapty: Can you use Stripe for IAP in 2026?](https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/) -- Apple external purchase policy -- MEDIUM confidence (policy may change)
- [Stripe iOS digital goods guide](https://docs.stripe.com/mobile/digital-goods) -- External Purchase Entitlement requirements -- HIGH confidence

---
*Stack research for: Mise v2.0 AI, Payments, Push, Presence, E2E*
*Researched: 2026-03-24*
