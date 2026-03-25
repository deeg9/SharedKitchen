# Architecture Research: Mise v2.0 Integration Points

**Domain:** Collaborative dinner planning mobile app -- new feature integrations
**Researched:** 2026-03-24
**Confidence:** HIGH (existing codebase examined, official docs verified for all integrations)

## System Overview: v2.0 Additions

```
                          EXISTING (unchanged)              NEW COMPONENTS
                    +-------------------------+    +--------------------------+
                    |     Expo Router App      |    |                          |
                    |  +------+  +----------+  |    |  +--------------------+  |
                    |  |Tabs  |  |Screens   |  |    |  |PresenceProvider   |  |
                    |  |(5)   |  |(detail,  |  |    |  |(context + hook)   |  |
                    |  |      |  | add, etc)|  |    |  +--------------------+  |
                    |  +--+---+  +----+-----+  |    |  +--------------------+  |
                    |     |           |        |    |  |NotificationManager|  |
                    |     +-----+-----+        |    |  |(expo-notifications)|  |
                    |           |               |    |  +--------------------+  |
                    +-----------+---------------+    |  +--------------------+  |
                                |                     |  |StripeProvider     |  |
                    +-----------+---------------+    |  |(@stripe/stripe-rn)|  |
                    |    Zustand Stores          |    |  +--------------------+  |
                    |  +--------+ +-----------+ |    +--------------------------+
                    |  |grocery | |recipe     | |
                    |  |plan    | |budget     | |    NEW STORES
                    |  |auth    | |leftover   | |    +--------------------------+
                    |  |household| |onboarding| |    | +--------------------+   |
                    |  +--------+ +-----------+ |    | |subscriptionStore  |   |
   MODIFIED ------->|  +--------------------+   |    | |(replaces premium) |   |
                    |  |premiumStore        |   |    | +--------------------+   |
                    |  |(-> subscriptionStore)|   |    | +--------------------+   |
                    |  +--------------------+   |    | |presenceStore      |   |
                    +-----------+---------------+    | +--------------------+   |
                                |                     | +--------------------+   |
                    +-----------+---------------+    | |notificationStore  |   |
                    |    Supabase Client         |    | +--------------------+   |
                    |  +-----+ +------+ +-----+ |    +--------------------------+
                    |  |Auth | |Real- | |Stor-| |
                    |  |     | |time  | |age  | |
                    |  +-----+ +--+---+ +-----+ |
                    +-------------+-------------+
                                  |
                    +-------------+----------------------------------------+
                    |         Supabase Backend                               |
                    |                                                        |
                    |  EXISTING               NEW EDGE FUNCTIONS             |
                    |  +--------------+      +-------------------------+    |
                    |  |parse-recipe  |      |stripe-webhooks         |    |
                    |  |-url          |      |  (verify + process)    |    |
                    |  +--------------+      +-------------------------+    |
                    |                        |create-checkout-session |    |
   MODIFIED ------->|  (upgrade to gpt-5-    +-------------------------+    |
                    |   mini + structured    |create-billing-portal   |    |
                    |   outputs + schema.org)+-------------------------+    |
                    |                        |push-notification       |    |
                    |  EXISTING DB           |  (send via Expo API)   |    |
                    |  +--------------+      +-------------------------+    |
                    |  |profiles      |      |generate-meal           |    |
                    |  |households    |      |  (AI meal generator)   |    |
                    |  |recipes       |      +-------------------------+    |
                    |  |meal_plans    |                                     |
                    |  |grocery_*    |      NEW TABLES                     |
                    |  |expenses     |      +-------------------------+    |
                    |  |leftovers    |      |subscriptions           |    |
                    |  |budget_*     |      |push_tokens             |    |
                    |  +--------------+      |notifications           |    |
                    |                        |meal_generation_history |    |
                    +------------------------+-------------------------+

                    EXTERNAL SERVICES
                    +------------------------------------------+
                    |  Stripe API        Expo Push Service     |
                    |  (subscriptions,   (FCM/APNs routing)    |
                    |   checkout,                              |
                    |   billing portal)  OpenAI API            |
                    |                    (gpt-5-mini for       |
                    |                     recipe + meal gen)   |
                    +------------------------------------------+

                    E2E TESTING (separate toolchain)
                    +------------------------------------------+
                    |  Maestro CLI + YAML flows                |
                    |  .maestro/ directory at project root     |
                    +------------------------------------------+
```

## Component Responsibilities

### New Components

| Component | Responsibility | Location |
|-----------|----------------|----------|
| `subscriptionStore` | Replaces `premiumStore`. Manages subscription state backed by Supabase `subscriptions` table instead of AsyncStorage. Source of truth is the DB, synced on app launch and after webhook events. | `src/stores/subscriptionStore.ts` |
| `presenceStore` | Tracks which household members are active on a given screen (grocery list, recipe detail). Wraps Supabase Realtime Presence channel. | `src/stores/presenceStore.ts` |
| `notificationStore` | Manages push token registration, notification preferences (persisted in DB), and in-app notification display. | `src/stores/notificationStore.ts` |
| `StripeProvider` wrapper | Wraps the app with `@stripe/stripe-react-native` StripeProvider. Configured with publishable key. | `app/_layout.tsx` (wrapping existing layout) |
| `usePresence` hook | Joins/leaves presence channels per screen. Returns list of active members with their avatars. | `src/hooks/usePresence.ts` |
| `useNotifications` hook | Registers for push notifications on mount, handles incoming notifications, stores token in Supabase. | `src/hooks/useNotifications.ts` |
| `stripe-webhooks` Edge Function | Receives Stripe webhook events, verifies signature, updates `subscriptions` table. | `supabase/functions/stripe-webhooks/index.ts` |
| `create-checkout-session` Edge Function | Creates a Stripe Checkout Session for subscription purchase. Called from app before opening payment sheet. | `supabase/functions/create-checkout-session/index.ts` |
| `create-billing-portal` Edge Function | Creates a Stripe Billing Portal session for managing existing subscriptions. | `supabase/functions/create-billing-portal/index.ts` |
| `push-notification` Edge Function | Sends push notifications via Expo Push API. Triggered by database webhooks on relevant table changes. | `supabase/functions/push-notification/index.ts` |
| `generate-meal` Edge Function | AI-powered meal generation using OpenAI gpt-5-mini. Takes dietary prefs, history, household context. | `supabase/functions/generate-meal/index.ts` |

### Modified Components

| Component | What Changes | Why |
|-----------|-------------|-----|
| `premiumStore.ts` | Replaced by `subscriptionStore.ts`. Current version uses AsyncStorage for tier -- new version reads from `subscriptions` table via Supabase. `canAccess()` and `PREMIUM_FEATURES` pattern preserved. | Real payments require server-authoritative subscription state, not client-side AsyncStorage. |
| `parse-recipe-url` Edge Function | **CRITICAL:** Update model from `gpt-4o-mini` (deprecated Feb 2026) to `gpt-5-mini`. Upgrade to structured outputs (`response_format: { type: 'json_schema' }`). Increase HTML truncation limit (15k -> 50k+ given 400K context window). Add JSON-LD schema.org/Recipe extraction before LLM fallback. | gpt-4o-mini is deprecated and will return errors. Schema.org extraction is faster and cheaper than LLM for sites that include it (~80% of recipe sites). |
| `useGrocerySync.ts` | Add presence tracking alongside existing postgres_changes subscription. When a user checks/unchecks an item, their avatar appears briefly. | Core UX requirement for real-time visibility. |
| `app.json` | Add `expo-notifications` and `@stripe/stripe-react-native` plugins. | Required for native module configuration via Expo config plugins. |
| `subscription.tsx` screen | Replace mock upgrade/downgrade with real Stripe Checkout flow. | Currently calls `upgradeToPremium()` which just writes to AsyncStorage. |
| `src/types/database.ts` | Add types for new tables: `subscriptions`, `push_tokens`, `notifications`, `meal_generation_history`. | Type safety for new data. |

## New Project Structure (additions only)

```
supabase/
+-- functions/
|   +-- parse-recipe-url/       # EXISTING (modified: gpt-5-mini + structured outputs)
|   |   +-- index.ts
|   +-- stripe-webhooks/        # NEW
|   |   +-- index.ts
|   +-- create-checkout-session/ # NEW
|   |   +-- index.ts
|   +-- create-billing-portal/   # NEW
|   |   +-- index.ts
|   +-- push-notification/       # NEW
|   |   +-- index.ts
|   +-- generate-meal/           # NEW
|       +-- index.ts
+-- migrations/
|   +-- 00011_create_subscriptions.sql    # NEW
|   +-- 00012_create_push_tokens.sql      # NEW
|   +-- 00013_create_notifications.sql    # NEW
|   +-- 00014_create_meal_history.sql     # NEW
+-- config.toml                           # MODIFIED (JWT bypass for stripe-webhooks)

src/
+-- stores/
|   +-- subscriptionStore.ts    # NEW (replaces premiumStore.ts)
|   +-- presenceStore.ts        # NEW
|   +-- notificationStore.ts    # NEW
+-- hooks/
|   +-- usePresence.ts          # NEW
|   +-- useNotifications.ts     # NEW
|   +-- useGrocerySync.ts       # MODIFIED (add presence)
+-- components/
|   +-- premium/
|   |   +-- SubscriptionSheet.tsx  # MODIFIED (Stripe Checkout)
|   +-- presence/
|   |   +-- PresenceAvatarStack.tsx # NEW - stacked avatar circles
|   |   +-- ActivityIndicator.tsx   # NEW - "X is checking off items"
|   +-- notifications/
|       +-- NotificationBanner.tsx  # NEW - in-app notification toast
+-- lib/
    +-- stripe.ts               # NEW - Stripe helpers (open checkout, billing portal)
    +-- notifications.ts        # NEW - push token registration, permission request

.maestro/                       # NEW - E2E test flows
+-- auth/
|   +-- login.yaml
|   +-- signup.yaml
+-- recipes/
|   +-- add-recipe.yaml
|   +-- import-from-url.yaml
+-- grocery/
|   +-- manage-list.yaml
+-- plan/
|   +-- weekly-plan.yaml
+-- premium/
|   +-- subscribe.yaml
+-- config.yaml
```

## Architectural Patterns

### Pattern 1: Server-Authoritative Subscription State

**What:** Subscription status lives in the `subscriptions` Postgres table, not AsyncStorage. The client reads it on launch and caches in Zustand, but never writes it directly. Only Stripe webhooks (via Edge Function) can modify subscription state.

**When to use:** Always for paid features. Client-side subscription state is trivially bypassable.

**Trade-offs:** Slightly slower first load (requires DB query), but the `canAccess()` pattern already exists and the store interface stays the same. Offline users retain their last-known tier from Zustand state.

**Example:**
```typescript
// subscriptionStore.ts - replaces premiumStore.ts
interface SubscriptionState {
  tier: 'free' | 'premium';
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  loading: boolean;

  isPremium: () => boolean;
  canAccess: (feature: string) => boolean;  // Same API as before
  initialize: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

// initialize() fetches from subscriptions table instead of AsyncStorage
// The PREMIUM_FEATURES constant and canAccess() logic remain unchanged
```

### Pattern 2: Presence via Supabase Realtime Channels

**What:** Use Supabase Realtime Presence (not postgres_changes) to track which users are actively viewing a screen. Each screen that needs presence (grocery list, recipe detail) joins a presence channel keyed by `household_id:screen:resource_id`.

**When to use:** For showing "who's here" UI (avatar stacks, "Sarah is shopping" indicators). NOT for data sync (that stays as postgres_changes).

**Trade-offs:** Presence is ephemeral (no DB writes), very low latency. But it only works when the app is foregrounded. Users who background the app will "leave" presence automatically.

**Example:**
```typescript
// usePresence.ts
export function usePresence(channelKey: string, userInfo: { id: string; name: string; avatar: string }) {
  const [members, setMembers] = useState<PresenceMember[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`presence:${channelKey}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setMembers(Object.values(state).flat());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userInfo);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [channelKey]);

  return members;
}
```

### Pattern 3: Database Webhook-Triggered Push Notifications

**What:** Instead of the app calling a push function directly, create Supabase Database Webhooks that fire on INSERT to specific tables (e.g., `meal_plans`, `leftovers`, `grocery_items`). The webhook calls the `push-notification` Edge Function, which looks up relevant push tokens and sends via Expo Push API.

**When to use:** For event-driven notifications (someone added a meal, leftover is expiring, grocery item checked off). For scheduled notifications (cooking reminders), use local scheduling via `expo-notifications` on the device.

**Trade-offs:** Decouples notification logic from app code. Notifications fire even if triggered by another household member. But debugging requires checking Edge Function logs, not app logs.

**Data flow:**
```
User A adds meal plan -> INSERT meal_plans row
    -> Database Webhook fires -> push-notification Edge Function
    -> Queries push_tokens for household members (excluding User A)
    -> Sends to Expo Push API -> APNs -> User B's device
```

### Pattern 4: Edge Function for Stripe Checkout (not client-side)

**What:** The app calls a Supabase Edge Function to create a Stripe Checkout Session. The Edge Function returns a session URL/client secret. The app uses `@stripe/stripe-react-native` to present the payment sheet. After payment, Stripe sends a webhook to the `stripe-webhooks` Edge Function, which updates the `subscriptions` table.

**When to use:** Always. Never create Stripe sessions client-side (exposes secret key).

**Key webhook events to handle:**
- `checkout.session.completed` -- create/activate subscription record
- `customer.subscription.updated` -- plan changes, renewals
- `customer.subscription.deleted` -- cancellations
- `invoice.payment_failed` -- flag for grace period

**Example flow:**
```
App: POST /functions/v1/create-checkout-session { userId, priceId }
  -> Edge Function: stripe.checkout.sessions.create(...)
  -> Returns { clientSecret }
App: presentPaymentSheet({ clientSecret })
  -> User completes payment
Stripe: POST /functions/v1/stripe-webhooks (checkout.session.completed)
  -> Edge Function: verify signature, upsert subscriptions table
App: subscriptionStore.refreshSubscription() -> reads updated DB row
```

## New Database Tables

### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'free'
    CHECK (status IN ('free', 'active', 'past_due', 'canceled', 'trialing')),
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: users can only read their own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);
```

### push_tokens

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT DEFAULT 'ios',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, expo_push_token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tokens"
  ON push_tokens FOR ALL USING (auth.uid() = user_id);
```

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('cooking_reminder', 'leftover_alert', 'budget_warning',
                    'household_activity', 'subscription')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
```

### meal_generation_history

```sql
CREATE TABLE meal_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suggestion JSONB NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meal_generation_history ENABLE ROW LEVEL SECURITY;
-- Use existing household membership RLS pattern (SECURITY DEFINER function)
```

## Integration Points

### External Services

| Service | Integration Pattern | Configuration | Key Gotchas |
|---------|---------------------|---------------|-------------|
| Stripe API | Edge Functions (server-side only). App uses `@stripe/stripe-react-native` for UI. | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET` as Supabase secrets. `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in app env. | Webhook Edge Function must disable JWT auth in `config.toml`. Use `stripe.webhooks.constructEventAsync()` (not sync version) in Deno. |
| Expo Push API | Edge Function sends to `https://exp.host/--/api/v2/push/send`. App registers token via `expo-notifications`. | `EXPO_ACCESS_TOKEN` as Supabase secret for enhanced security. | Must request notification permissions on iOS. Token can change -- update on every app launch. |
| OpenAI API | Existing pattern (Edge Functions). **Model: `gpt-5-mini`** (replaces deprecated `gpt-4o-mini`). Add `generate-meal` function alongside existing `parse-recipe-url`. | Already configured: `OPENAI_API_KEY`. | Use `response_format: { type: 'json_schema' }` (structured outputs) for guaranteed valid JSON. gpt-5-mini has 400K context -- can handle much larger HTML payloads. |
| Apple (APNs via Expo) | Handled by Expo Push Service. No direct APNs integration needed. | Requires push notification entitlement in Apple Developer account + EAS Build configuration. | Development builds use Expo sandbox APNs. Production requires EAS Build (not Expo Go). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| subscriptionStore <-> Stripe Edge Functions | App calls Edge Function, then refreshes store from DB | Never write subscription state from client. Store is read-only from DB. |
| presenceStore <-> groceryStore | Separate concerns. Presence channel is distinct from postgres_changes channel. Both use `supabase.channel()` but for different purposes. | Don't multiplex. Keep grocery sync (data) and presence (ephemeral state) on separate channels. |
| notifications table <-> push-notification Edge Function | Database Webhook (INSERT trigger). Function reads the row, looks up push tokens, sends. | The notification record is the source of truth. Push delivery is best-effort. |
| Maestro tests <-> running app | Maestro interacts with the built app via accessibility tree. No test code in the app. | Requires `testID` props on interactive elements. Add these incrementally as tests are written. |

### Config Changes Required

**`supabase/config.toml`** (new section):
```toml
[functions.stripe-webhooks]
verify_jwt = false  # Stripe sends unsigned requests, we verify via Stripe signature instead
```

**`app.json`** (plugins addition):
```json
{
  "plugins": [
    "expo-router",
    "expo-sharing",
    ["expo-notifications", {
      "icon": "./assets/notification-icon.png",
      "color": "#334537"
    }],
    ["@stripe/stripe-react-native", {
      "merchantIdentifier": "merchant.com.mise.app",
      "enableApplePay": true
    }]
  ]
}
```

**New environment variables:**
```
# Supabase secrets (via `supabase secrets set`)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...
EXPO_ACCESS_TOKEN=...

# App environment (.env)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture handles fine. Single Supabase project, single Stripe account. Presence channels are lightweight. |
| 1k-10k users | Watch Supabase Realtime connection limits (default 200 concurrent). May need to upgrade Supabase plan. Presence channels per-grocery-list keep connections scoped. |
| 10k+ users | Consider Stripe Sync Engine for denormalizing Stripe data into Postgres (avoids API calls on every subscription check). Move notification sending to a queue to handle bursts. |

### First Bottleneck: Supabase Realtime Connections

Adding presence channels doubles the number of Realtime subscriptions (one for data sync, one for presence per active screen). The free Supabase tier allows 200 concurrent connections. At ~50 active households, this becomes tight.

**Mitigation:** Scope presence channels narrowly (per grocery list, not per household). Disconnect presence when app backgrounds. Consider combining data sync and presence on a single channel if connection limits are hit.

### Second Bottleneck: Push Notification Volume

Every grocery check-off, meal plan change, and leftover alert triggers a notification Edge Function invocation. For active households, this could be 50-100 invocations/day.

**Mitigation:** Debounce grocery notifications (batch check-offs into a single "X checked off 5 items" notification with a 30-second window). Only send notifications for the event types each user has enabled in settings.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Subscription Verification

**What people do:** Check subscription status from AsyncStorage or a client-side variable before showing premium features.
**Why it's wrong:** Trivially bypassable. Users can modify AsyncStorage. The current `premiumStore.ts` does exactly this.
**Do this instead:** Read subscription status from the `subscriptions` database table. Only Stripe webhooks (server-side) can write to this table.

### Anti-Pattern 2: Multiplexing Data Sync and Presence on One Channel

**What people do:** Add presence tracking to the existing `grocery-items-${listId}` postgres_changes channel.
**Why it's wrong:** Presence and postgres_changes are different Supabase Realtime primitives. Mixing them on one channel creates coupling.
**Do this instead:** Use separate channels: `grocery-items-${listId}` for data sync (existing), `presence:grocery:${listId}` for who's online (new).

### Anti-Pattern 3: Sending Push Notifications from the App

**What people do:** Call the Expo Push API directly from the React Native app when a user performs an action.
**Why it's wrong:** Requires storing Expo access tokens on client. Notifications only fire when the triggering user's app is open.
**Do this instead:** Use Database Webhooks that fire on INSERT to relevant tables.

### Anti-Pattern 4: Using Deprecated gpt-4o-mini Model

**What people do:** Continue using `gpt-4o-mini` in Edge Functions after it was deprecated Feb 2026.
**Why it's wrong:** API calls return errors. Feature is completely broken.
**Do this instead:** Swap to `gpt-5-mini` (drop-in replacement with better 400K context and structured outputs).

## Suggested Build Order

Based on dependency analysis:

1. **AI Fix + Stripe + Subscription Store** (foundation for premium gating)
   - IMMEDIATE: Update `parse-recipe-url` Edge Function from `gpt-4o-mini` to `gpt-5-mini`
   - New DB tables: `subscriptions`
   - New Edge Functions: `stripe-webhooks`, `create-checkout-session`, `create-billing-portal`
   - New store: `subscriptionStore` (replaces `premiumStore`)
   - Modify: `subscription.tsx` screen, `app.json` plugins

2. **Push Notifications** (independent, benefits from subscription for premium notification types)
   - New DB tables: `push_tokens`, `notifications`
   - New Edge Function: `push-notification`
   - New hook: `useNotifications`
   - New store: `notificationStore`
   - Configure: Database Webhooks on `meal_plans`, `leftovers`, `grocery_items`

3. **Real-Time Presence** (builds on existing Realtime infrastructure)
   - New store: `presenceStore`
   - New hook: `usePresence`
   - New components: `PresenceAvatarStack`, `ActivityIndicator`
   - Modify: `useGrocerySync.ts`, grocery list UI, recipe detail UI

4. **Enhanced AI Features** (recipe extraction + meal generator)
   - New DB table: `meal_generation_history`
   - New Edge Function: `generate-meal`
   - Modify: `parse-recipe-url` (add schema.org extraction, increase HTML limit)
   - Modify: "Surprise Me" UI to use AI generator

5. **E2E Testing with Maestro** (requires all features built)
   - New directory: `.maestro/` with YAML flow files
   - Add `testID` props to interactive components

## Sources

- [Supabase Stripe Webhooks Guide](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [Supabase Realtime Presence Docs](https://supabase.com/docs/guides/realtime/presence)
- [Stripe React Native SDK (Expo)](https://docs.expo.dev/versions/latest/sdk/stripe/)
- [Stripe Subscriptions Integration](https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=react-native)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Maestro E2E Testing for React Native](https://docs.maestro.dev/get-started/supported-platform/react-native)
- [OpenAI Model Deprecations](https://developers.openai.com/api/docs/deprecations) -- gpt-4o-mini deprecated Feb 2026
- [GPT-5 mini Model](https://platform.openai.com/docs/models/gpt-5-mini) -- replacement model
- Existing codebase analysis: `premiumStore.ts`, `useGrocerySync.ts`, `parse-recipe-url/index.ts`, `groceryStore.ts`

---
*Architecture research for: Mise v2.0 -- Stripe, Push Notifications, Presence, AI, E2E Testing*
*Researched: 2026-03-24*
