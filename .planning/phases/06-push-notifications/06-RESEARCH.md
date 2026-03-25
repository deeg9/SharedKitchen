# Phase 6: Push Notifications - Research

**Researched:** 2026-03-25
**Domain:** Expo push notifications, local scheduled notifications, Supabase Edge Functions
**Confidence:** HIGH

## Summary

Phase 6 wires up the existing notification settings UI (profile screen toggle switches stored in AsyncStorage) to actual push notification delivery. The phase spans three distinct notification types: (1) local scheduled cooking reminders triggered from meal plan data, (2) local scheduled leftover expiry alerts triggered when leftovers are created, and (3) client-side budget threshold checks that trigger local alerts when expenses cross 80% or 100% of the monthly target. All three types are local notifications -- no server-side push delivery is required for this phase, which significantly reduces complexity. The only server interaction is storing push tokens in a `push_tokens` database table for future use (Phase 7+ household activity notifications).

The existing codebase has everything needed to support this: the profile screen already has a `NotificationSettings` interface with four toggles (`cookingReminders`, `leftoverAlerts`, `budgetWarnings`, `householdActivity`), stored in AsyncStorage under the key `notification_settings`. The `leftoverStore` has `getFreshnessStatus()` with use-by date math. The `budgetStore` has `monthlyTotal()` and `budgetTarget` for threshold comparison. The `planStore` has `mealPlan` data with `plan_date` and recipe details. The main work is: install `expo-notifications` and `expo-device`, create a notification service layer, add scheduling logic to the existing store actions, and build a contextual permission pre-prompt before requesting OS permission.

**Primary recommendation:** Keep all three notification types as local scheduled notifications. Create a centralized `src/lib/notifications.ts` service that handles permission requests, token registration, and scheduling. Hook into existing store actions (`addLeftover`, `addExpense`, `assignRecipe`) to schedule/cancel notifications as a side effect.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTIF-01 | App registers Expo push tokens and stores them in `push_tokens` table with device info | expo-notifications `getExpoPushTokenAsync()` + expo-device for device info + new migration for `push_tokens` table |
| NOTIF-02 | User sees contextual permission explanation before notification access prompt | Custom pre-prompt bottom sheet shown before `requestPermissionsAsync()` -- iOS only allows one system prompt per install |
| NOTIF-03 | User receives local scheduled cooking reminders before meal prep time | `scheduleNotificationAsync` with `date` trigger type, scheduled when recipe is assigned to a meal plan |
| NOTIF-04 | User receives push alert when a leftover is approaching its use-by date (1 day before, day of) | `scheduleNotificationAsync` with `date` trigger, two notifications scheduled on leftover creation |
| NOTIF-05 | User receives push alert when household spending exceeds 80% or 100% of monthly budget target | Client-side threshold check in `addExpense` action, immediate local notification via `scheduleNotificationAsync` with null trigger |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | ~55.0.13 | Push token registration, local notification scheduling, notification handlers | First-party Expo SDK 55 package, only supported notification library for Expo |
| expo-device | ~55.0.10 | Device info (model, OS version) for push token records | Required companion to expo-notifications for device metadata |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Date math for scheduling (already installed) | Calculating reminder times from plan_date and use_by_date |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local notifications for cooking/leftover | Database Webhook + Edge Function + Expo Push API | Massive over-engineering for reminders that only matter to the device owner; server push needed only for cross-user notifications (Phase 7+) |
| expo-notifications | react-native-push-notification | Not compatible with Expo managed workflow; would require ejecting |

**Installation:**
```bash
npx expo install expo-notifications expo-device
```

**Version verification:** expo-notifications@55.0.13 and expo-device@55.0.10 are the current latest versions on npm as of 2026-03-25, aligned with Expo SDK 55.

## Architecture Patterns

### Recommended Project Structure
```
src/
+-- lib/
|   +-- notifications.ts        # NEW - centralized notification service
+-- hooks/
|   +-- useNotifications.ts     # NEW - app-level notification setup hook
+-- components/
|   +-- notifications/
|       +-- PermissionPrompt.tsx # NEW - pre-prompt bottom sheet
+-- stores/
    +-- leftoverStore.ts        # MODIFIED - schedule alerts on addLeftover
    +-- budgetStore.ts          # MODIFIED - check thresholds on addExpense
    +-- planStore.ts            # MODIFIED - schedule reminders on assignRecipe

supabase/
+-- migrations/
|   +-- 00013_create_push_tokens.sql  # NEW
+-- functions/
    +-- push-notification/            # NEW - Edge Function for future use
        +-- index.ts

app/
+-- _layout.tsx                 # MODIFIED - add useNotifications hook
+-- (app)/(tabs)/profile.tsx    # MODIFIED - wire toggle switches to real permissions
```

### Pattern 1: Centralized Notification Service
**What:** A single `src/lib/notifications.ts` module that wraps all expo-notifications API calls. All stores and hooks import from this module rather than calling expo-notifications directly.
**When to use:** Always. Prevents scattered notification logic across stores.
**Example:**
```typescript
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id', // from app.json
  });

  // Upsert token in database
  await supabase.from('push_tokens').upsert({
    user_id: userId,
    expo_push_token: token.data,
    device_id: Device.modelId ?? 'unknown',
    platform: Device.osName?.toLowerCase() ?? 'ios',
  }, { onConflict: 'user_id,expo_push_token' });

  return token.data;
}

export async function scheduleCookingReminder(
  mealPlanId: string,
  recipeName: string,
  planDate: string,
  prepTimeMinutes: number
): Promise<string | null> {
  const settings = await getNotificationSettings();
  if (!settings.cookingReminders) return null;

  // Schedule reminder for prep_time minutes before the planned meal
  // Default meal time: 6:00 PM if no specific time
  const mealTime = new Date(planDate + 'T18:00:00');
  const reminderTime = new Date(mealTime.getTime() - prepTimeMinutes * 60 * 1000);

  if (reminderTime <= new Date()) return null; // Don't schedule past reminders

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to start cooking!',
      body: `${recipeName} needs ${prepTimeMinutes} min of prep. Start now to be ready by dinner.`,
      data: { type: 'cooking_reminder', mealPlanId },
    },
    trigger: { type: 'date', date: reminderTime },
  });

  return id;
}

export async function scheduleLeftoverAlerts(
  leftoverId: string,
  name: string,
  useByDate: string
): Promise<string[]> {
  const settings = await getNotificationSettings();
  if (!settings.leftoverAlerts) return [];

  const ids: string[] = [];
  const useBy = new Date(useByDate + 'T09:00:00'); // Morning alert
  const dayBefore = new Date(useBy.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();

  // Day before alert
  if (dayBefore > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Leftover expiring tomorrow',
        body: `${name} should be used by tomorrow. Plan to use it today!`,
        data: { type: 'leftover_alert', leftoverId },
      },
      trigger: { type: 'date', date: dayBefore },
    });
    ids.push(id);
  }

  // Day-of alert
  if (useBy > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Leftover expires today',
        body: `${name} expires today. Use it or freeze it!`,
        data: { type: 'leftover_alert', leftoverId },
      },
      trigger: { type: 'date', date: useBy },
    });
    ids.push(id);
  }

  return ids;
}

export async function checkBudgetThreshold(
  monthlyTotal: number,
  budgetTarget: number,
  householdName: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.budgetWarnings) return;

  const percentage = (monthlyTotal / budgetTarget) * 100;

  // Check if we already sent this alert this month
  const monthKey = `budget_alert_${new Date().getFullYear()}_${new Date().getMonth()}`;

  if (percentage >= 100) {
    const sent = await AsyncStorage.getItem(`${monthKey}_100`);
    if (!sent) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Budget exceeded!',
          body: `${householdName} has exceeded the monthly budget of $${budgetTarget}.`,
          data: { type: 'budget_warning', threshold: 100 },
        },
        trigger: null, // Immediate
      });
      await AsyncStorage.setItem(`${monthKey}_100`, 'true');
    }
  } else if (percentage >= 80) {
    const sent = await AsyncStorage.getItem(`${monthKey}_80`);
    if (!sent) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Budget warning',
          body: `${householdName} has used 80% of the monthly budget ($${Math.round(monthlyTotal)} of $${budgetTarget}).`,
          data: { type: 'budget_warning', threshold: 80 },
        },
        trigger: null, // Immediate
      });
      await AsyncStorage.setItem(`${monthKey}_80`, 'true');
    }
  }
}

async function getNotificationSettings() {
  const val = await AsyncStorage.getItem('notification_settings');
  if (val) return JSON.parse(val);
  return {
    cookingReminders: true,
    leftoverAlerts: true,
    budgetWarnings: true,
    householdActivity: true,
  };
}
```

### Pattern 2: App-Level Notification Handler Hook
**What:** A `useNotifications` hook called once in `_layout.tsx` that sets up notification handlers for foreground display and tap-to-open navigation.
**When to use:** Always. Must be set up at app root level.
**Example:**
```typescript
// src/hooks/useNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { registerPushToken } from '../lib/notifications';
import { useAuthStore } from '../stores/authStore';

// Configure how notifications display when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotificationSetup() {
  const router = useRouter();
  const { session } = useAuthStore();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Register push token on every app launch (token can rotate)
    registerPushToken(session.user.id);

    // Handle notification tap -> navigate to relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        switch (data.type) {
          case 'cooking_reminder':
            router.push('/(app)/(tabs)/plan');
            break;
          case 'leftover_alert':
            router.push('/(app)/leftovers');
            break;
          case 'budget_warning':
            router.push('/(app)/(tabs)/budget');
            break;
        }
      }
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [session?.user?.id]);
}
```

### Pattern 3: Pre-Prompt Before System Permission Dialog
**What:** Show a custom bottom sheet explaining why notifications are valuable before calling `requestPermissionsAsync()`. On iOS, the system dialog can only be shown once per app install -- if the user dismisses it, they must manually enable in Settings.
**When to use:** The first time the app needs notification permission, triggered from the notification settings UI or during a contextually appropriate moment (e.g., after creating first meal plan).
**Example:**
```typescript
// src/components/notifications/PermissionPrompt.tsx
// A bottom sheet that explains notification benefits, then calls requestPermissionsAsync
// Only shown when permission status is 'undetermined'
// If user taps "Enable", call requestPermission()
// If user taps "Not Now", dismiss and respect the choice
```

### Anti-Patterns to Avoid
- **Requesting notification permission on app launch without context:** iOS only shows the system dialog once. A cold request on first launch gets denied more often than a contextual request after the user sees value.
- **Scheduling notifications without checking settings:** Always read the AsyncStorage `notification_settings` before scheduling. The toggle switches in profile must be respected.
- **Not canceling stale notifications:** When a meal plan is cleared or a leftover is deleted, the associated scheduled notifications must be canceled. Store notification IDs alongside the data that created them.
- **Scheduling past notifications:** Always check that the trigger date is in the future before calling `scheduleNotificationAsync`.
- **Testing in Expo Go:** Push token registration will not work in Expo Go since SDK 53. Local notifications work in Expo Go, but push tokens require an EAS development build.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push token management | Custom token refresh logic | expo-notifications `getExpoPushTokenAsync()` called on every app launch | Expo handles token rotation; calling on each launch ensures the latest token is always stored |
| Notification scheduling | Custom setTimeout/setInterval timers | `scheduleNotificationAsync` with date/calendar triggers | OS-level scheduling works even when app is killed; JS timers die with the app |
| APNs/FCM routing | Direct APNs/FCM integration | Expo Push Service API | Expo abstracts away the platform differences entirely |
| Budget alert deduplication | Complex DB-based dedup | AsyncStorage key per month per threshold | Simple, local, and doesn't need server involvement |

**Key insight:** All three notification types (cooking reminders, leftover alerts, budget warnings) are best implemented as local scheduled notifications. Server-side push is only needed for cross-user notifications (e.g., "Sarah checked off 5 grocery items"), which is deferred to Phase 7+ household activity notifications.

## Common Pitfalls

### Pitfall 1: iOS System Permission Dialog Shown Only Once
**What goes wrong:** App calls `requestPermissionsAsync()` without a pre-prompt. User reflexively taps "Don't Allow." Notifications are permanently blocked unless the user manually goes to Settings.
**Why it happens:** iOS is the only mobile OS with a one-shot permission dialog for notifications.
**How to avoid:** Always show a custom pre-prompt bottom sheet first. Only call `requestPermissionsAsync()` after the user taps "Enable Notifications" in the pre-prompt. If the user taps "Not Now," remember this choice and ask again later in a different context.
**Warning signs:** `getPermissionsAsync()` returns `denied` status.

### Pitfall 2: Push Token Not Updating on Rotation
**What goes wrong:** Token is registered once during onboarding and never updated. Expo rotates tokens periodically. Push notifications stop arriving.
**Why it happens:** Token registration only called once, not on every app launch.
**How to avoid:** Call `registerPushToken()` on every app launch (in `useNotificationSetup` hook). Use database upsert on `(user_id, expo_push_token)` to handle token changes gracefully.
**Warning signs:** Notifications work initially but stop after days/weeks.

### Pitfall 3: expo-notifications Plugin Missing from app.json
**What goes wrong:** Push token registration silently fails on iOS. No error thrown, but APNs entitlement is not included in the build.
**Why it happens:** `expo-notifications` requires a config plugin entry in `app.json` to add the push notification entitlement to the iOS build. Without it, `getExpoPushTokenAsync()` silently returns nothing useful.
**How to avoid:** Add `["expo-notifications", { "icon": "./assets/notification-icon.png", "color": "#334537" }]` to the `plugins` array in `app.json`.
**Warning signs:** Works in development (Expo Go local notifications) but push tokens fail in EAS builds.

### Pitfall 4: Scheduling Notifications for Deleted Data
**What goes wrong:** User creates a leftover, two expiry alerts are scheduled. User deletes the leftover. Alerts still fire, confusing the user.
**Why it happens:** No cleanup of scheduled notification IDs when the source data is deleted.
**How to avoid:** Store scheduled notification IDs (returned by `scheduleNotificationAsync`) in a map (AsyncStorage or Zustand). When source data is deleted, call `cancelScheduledNotificationAsync(id)` for all associated notification IDs.
**Warning signs:** Users report "phantom" notifications for items they already used or deleted.

### Pitfall 5: Budget Alerts Fire Multiple Times
**What goes wrong:** Every expense addition re-checks the budget threshold. If the total is at 85%, every new expense triggers the 80% alert.
**Why it happens:** No deduplication of threshold alerts.
**How to avoid:** Use an AsyncStorage key per month per threshold level (e.g., `budget_alert_2026_2_80`). Only fire the alert if the key doesn't exist. Reset keys at month boundary.
**Warning signs:** Users receive dozens of "80% budget" alerts in a month.

### Pitfall 6: Testing Push Tokens in Expo Go
**What goes wrong:** Developer tests push notifications in Expo Go. Everything appears to work (local notifications), but push token registration fails silently or returns a simulator token.
**Why it happens:** Expo Go does not support push token registration since SDK 53. Only EAS development builds on physical devices can register real push tokens.
**How to avoid:** Test local notification scheduling in Expo Go (this works). Test push token registration and remote push delivery only on physical devices with EAS development builds.
**Warning signs:** `Device.isDevice` returns false in simulator; `getExpoPushTokenAsync` throws or returns empty.

## Code Examples

### Scheduling a Cooking Reminder (in planStore.assignRecipe)
```typescript
// Inside planStore.ts assignRecipe action, after successful DB insert:
import { scheduleCookingReminder } from '../lib/notifications';

// After saving meal plan entry:
const recipe = await fetchRecipeById(recipeId);
if (recipe) {
  const notifId = await scheduleCookingReminder(
    mealPlanEntry.id,
    recipe.name,
    date,
    recipe.prep_time_minutes ?? 30
  );
  // Optionally store notifId for later cancellation
}
```

### Scheduling Leftover Expiry Alerts (in leftoverStore.addLeftover)
```typescript
// Inside leftoverStore.ts addLeftover action, after successful DB insert:
import { scheduleLeftoverAlerts } from '../lib/notifications';

// After inserting leftover:
const alertIds = await scheduleLeftoverAlerts(
  leftover.id,
  data.name,
  data.use_by_date
);
// Store alertIds in AsyncStorage keyed by leftover.id for cleanup
```

### Budget Threshold Check (in budgetStore.addExpense)
```typescript
// Inside budgetStore.ts addExpense action, after successful DB insert:
import { checkBudgetThreshold } from '../lib/notifications';

// After inserting expense, re-compute total:
const { monthlyTotal, budgetTarget } = get();
const newTotal = monthlyTotal() + data.amount;
await checkBudgetThreshold(newTotal, budgetTarget, 'Your Household');
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
    }],
    ["expo-notifications", {
      "icon": "./assets/notification-icon.png",
      "color": "#334537"
    }]
  ]
}
```

### push_tokens Migration
```sql
-- 00013_create_push_tokens.sql
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

CREATE POLICY "Users can read own tokens"
  ON push_tokens FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON push_tokens FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON push_tokens FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Expo Go push support | EAS development builds required | SDK 53 (2024) | Cannot test push tokens in Expo Go; local notifications still work |
| `Notifications.setNotificationChannelAsync` (Android only) | Expo config plugin handles channels | SDK 55 | Plugin config in app.json replaces manual channel setup |
| Manual APNs cert management | EAS Credentials handles APNs keys | EAS Build | eas credentials command manages p8 keys; less manual work |
| `expo-permissions` separate package | Permissions built into expo-notifications | SDK 50+ | No separate permissions package needed |

**Deprecated/outdated:**
- `expo-permissions` package: Permissions are now integrated into each SDK module. Use `Notifications.requestPermissionsAsync()` directly.

## Open Questions

1. **Notification icon asset**
   - What we know: The `expo-notifications` plugin requires an `icon` path for Android notification icons. The current project has `./assets/icon.png`.
   - What's unclear: Whether a separate notification-specific icon is needed or if the app icon works.
   - Recommendation: Use `./assets/icon.png` initially. Create a dedicated notification icon only if Android display looks wrong.

2. **Cooking reminder timing**
   - What we know: Meal plan entries have `plan_date` but no specific meal time. The recipe has `prep_time_minutes`.
   - What's unclear: What time to assume for dinner (6 PM? 7 PM?).
   - Recommendation: Default to 6:00 PM. Could be made configurable in a future iteration, but hardcoding is fine for v2.0.

3. **Notification ID storage for cancellation**
   - What we know: `scheduleNotificationAsync` returns a string ID. We need to cancel notifications when source data is deleted.
   - What's unclear: Best storage strategy for mapping source entity IDs to notification IDs.
   - Recommendation: Use AsyncStorage with keys like `notif_leftover_{id}` storing JSON arrays of notification IDs. Simple, works offline, and doesn't require a new DB table.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + jest-expo 55.0.11 |
| Config file | package.json `"test": "jest"` |
| Quick run command | `npx jest --testPathPattern=notifications --bail` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTIF-01 | Push token registration and DB storage | unit (mock expo-notifications) | `npx jest tests/lib/notifications.test.ts -x` | Wave 0 |
| NOTIF-02 | Pre-prompt shown before system dialog | unit (component render test) | `npx jest tests/components/PermissionPrompt.test.tsx -x` | Wave 0 |
| NOTIF-03 | Cooking reminder scheduling | unit (mock scheduleNotificationAsync) | `npx jest tests/lib/notifications.test.ts -x` | Wave 0 |
| NOTIF-04 | Leftover alert scheduling (day before + day of) | unit (date math + scheduling) | `npx jest tests/lib/notifications.test.ts -x` | Wave 0 |
| NOTIF-05 | Budget threshold check at 80% and 100% | unit (threshold logic + dedup) | `npx jest tests/lib/notifications.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=notifications --bail`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/notifications.test.ts` -- covers NOTIF-01, NOTIF-03, NOTIF-04, NOTIF-05
- [ ] `tests/components/PermissionPrompt.test.tsx` -- covers NOTIF-02
- [ ] Mock setup for expo-notifications and expo-device in `tests/setup.tsx`

## Sources

### Primary (HIGH confidence)
- [Expo Notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/) -- SDK 55 API reference, trigger types, permission handling
- [Expo Push Notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) -- token registration flow, projectId requirement
- [Supabase Push Notifications guide](https://supabase.com/docs/guides/functions/examples/push-notifications) -- Edge Function pattern for Expo Push API, database webhook setup
- [Supabase Expo push notifications example](https://github.com/supabase/supabase/blob/master/examples/user-management/expo-push-notifications/supabase/functions/push/index.ts) -- Working reference implementation
- npm registry -- expo-notifications@55.0.13 and expo-device@55.0.10 verified as current

### Secondary (MEDIUM confidence)
- [Expo Local Notifications 2026 guide](https://www.codesofphoenix.com/articles/expo/local-notifications-expo) -- scheduling patterns and permission best practices
- [Expo Permissions docs](https://docs.expo.dev/guides/permissions/) -- iOS one-shot permission dialog behavior

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - expo-notifications and expo-device versions verified on npm, aligned with project SDK 55
- Architecture: HIGH - patterns derived from existing codebase examination (leftoverStore, budgetStore, planStore, profile.tsx) and official Expo/Supabase docs
- Pitfalls: HIGH - iOS permission one-shot behavior, token rotation, and EAS build requirements are well-documented gotchas

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- Expo SDK 55 lifecycle)
