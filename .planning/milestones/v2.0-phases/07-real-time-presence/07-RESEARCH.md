# Phase 7: Real-Time Presence - Research

**Researched:** 2026-03-25
**Domain:** Supabase Realtime Presence, React Native UI (avatar stacks, toast notifications)
**Confidence:** HIGH

## Summary

Phase 7 adds real-time presence indicators and activity toasts to Mise, enabling household members to see who else is viewing the same screen and receive live notifications when someone checks off a grocery item or modifies the meal plan. This phase requires zero new npm dependencies -- Supabase Realtime Presence is already available in the installed `@supabase/supabase-js@^2.100.0` client. The existing `useGrocerySync.ts` hook provides the exact integration pattern to follow, but presence channels MUST be kept separate from the existing postgres_changes channels.

The primary technical risk is phantom avatar flickering caused by the `sync` event's reconciliation behavior. During a `sync` event, Supabase emits simultaneous `join` and `leave` events even when no users are actually joining or leaving -- this is state reconciliation between local and server state, not real user activity. The solution is to use only the `sync` event for UI updates (reading the full `presenceState()` each time) and debouncing state changes by 200-500ms before updating React state.

**Primary recommendation:** Build a `usePresence` hook that creates a dedicated Supabase Presence channel per screen (keyed by `household_id:screen:resource_id`), use only the `sync` event callback for UI state, debounce updates 300ms, and pair it with a `PresenceAvatarStack` component that reuses the existing `Avatar` UI component. For activity toasts, subscribe to postgres_changes on `grocery_items` and `meal_plans` tables and display transient toast notifications (not the same as push notifications -- these are in-app only, visible when the app is foregrounded).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RT-01 | User sees live avatar stacks on grocery list screen showing who else is currently viewing | usePresence hook + PresenceAvatarStack component on grocery.tsx; presence channel keyed by `presence:grocery:${listId}` |
| RT-02 | User sees live avatar stacks on recipe detail screen showing who else is currently viewing | Same usePresence hook on recipe/[id].tsx; presence channel keyed by `presence:recipe:${recipeId}` |
| RT-03 | User sees toast notifications when household members check off grocery items or modify meal plans | Subscribe to postgres_changes on grocery_items (UPDATE where is_checked changes) and meal_plans (INSERT/UPDATE/DELETE); display in-app toast with member avatar and action description |
| RT-04 | Presence state uses Supabase Realtime Presence with debounced sync events (separate from data channels) | Dedicated presence channels separate from existing grocery-items postgres_changes channel; 300ms debounce on sync event; never multiplex presence and data on same channel |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.100.0 | Realtime Presence API | Already installed; Presence is built into the Realtime module, zero additional deps |
| `zustand` | ^5.0.12 | Presence state management | Already installed; consistent with all other stores in the project |
| `react-native-reanimated` | 4.2.1 | Toast entry/exit animations | Already installed; used elsewhere in the app |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | ^4.1.0 | Formatting "X seconds ago" timestamps | Already installed; for activity toast timestamps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom toast component | react-native-toast-message | Adding a dependency for something achievable with 50 lines of Animated/Reanimated code; project pattern is to build simple UI in-house |
| Zustand store for presence | React Context | Context would work but breaks pattern; all shared state in this project uses Zustand |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    usePresence.ts          # NEW - Generic presence hook for any screen
    useActivityToast.ts     # NEW - Subscribes to data changes, shows toasts
  components/
    presence/
      PresenceAvatarStack.tsx  # NEW - Overlapping avatar circles
      ActivityToast.tsx        # NEW - Transient toast notification
  stores/
    presenceStore.ts           # NEW - Optional if cross-screen presence needed
```

### Pattern 1: Presence Hook (per-screen)
**What:** A React hook that joins a Supabase Presence channel when a screen mounts and untracks/removes the channel on unmount. Uses the `sync` event exclusively for UI updates with a debounce timer.
**When to use:** On every screen that needs "who's here" indicators (grocery list, recipe detail).
**Example:**
```typescript
// Source: Supabase Realtime Presence docs + project pattern from useGrocerySync.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PresenceMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export function usePresence(
  channelKey: string | null,
  currentUser: PresenceMember | null,
  debounceMs = 300
) {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!channelKey || !currentUser) return;

    const channel = supabase.channel(`presence:${channelKey}`, {
      config: {
        presence: { key: currentUser.user_id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Clear any pending debounce
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          const state = channel.presenceState();
          const present: PresenceMember[] = [];
          for (const [key, presences] of Object.entries(state)) {
            // Skip self
            if (key === currentUser.user_id) continue;
            const latest = presences[presences.length - 1] as any;
            if (latest) {
              present.push({
                user_id: latest.user_id,
                display_name: latest.display_name,
                avatar_url: latest.avatar_url,
              });
            }
          }
          setMembers(present);
        }, debounceMs);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.user_id,
            display_name: currentUser.display_name,
            avatar_url: currentUser.avatar_url,
          });
        }
      });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [channelKey, currentUser?.user_id]);

  return members;
}
```

### Pattern 2: Activity Toast via postgres_changes
**What:** Subscribe to postgres_changes on `grocery_items` and `meal_plans` to detect actions by OTHER household members, then display a transient toast. This reuses the same Supabase Realtime primitive as `useGrocerySync` but on a different channel for activity awareness.
**When to use:** When the app is foregrounded and the user should see real-time activity from household members.
**Example:**
```typescript
// Activity toast subscription for grocery item check-offs
const activityChannel = supabase
  .channel(`activity:grocery:${listId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'grocery_items',
      filter: `grocery_list_id=eq.${listId}`,
    },
    (payload) => {
      const newItem = payload.new as GroceryItem;
      const oldItem = payload.old as Partial<GroceryItem>;
      // Only show toast for check-off events by OTHER users
      if (newItem.is_checked !== oldItem.is_checked && newItem.checked_by !== currentUserId) {
        showActivityToast({
          userId: newItem.checked_by,
          action: newItem.is_checked ? 'checked off' : 'unchecked',
          itemName: newItem.name,
        });
      }
    }
  )
  .subscribe();
```

### Pattern 3: Channel Naming Convention
**What:** Strict naming convention to prevent channel collisions and ensure presence and data channels never overlap.
**When to use:** Always.
**Convention:**
```
Data sync:     grocery-items-${listId}          (existing, DO NOT MODIFY)
Presence:      presence:grocery:${listId}        (new)
Activity:      activity:grocery:${listId}        (new, for toast events)
               presence:recipe:${recipeId}       (new)
               activity:mealplan:${householdId}  (new, for meal plan changes)
```

### Anti-Patterns to Avoid
- **Multiplexing presence and postgres_changes on one channel:** These are different Supabase Realtime primitives. The existing `grocery-items-${listId}` channel handles data sync. Create SEPARATE channels for presence. The Supabase docs confirm these are independent primitives.
- **Using join/leave events for UI updates:** The `sync` event fires join/leave simultaneously during reconciliation even when no users actually join or leave. Always read `presenceState()` on `sync` events, never react to individual join/leave.
- **Updating React state on every sync event without debounce:** Rapid sync events (e.g., during initial connection, network reconnection) cause setState floods and avatar flickering. Always debounce 200-500ms.
- **Forgetting to call `supabase.removeChannel()` on unmount:** Leaking channels doubles connection count and hits the Supabase 200-connection free tier limit faster.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Avatar display | Custom image/initials component | Existing `Avatar` component (`src/components/ui/Avatar.tsx`) | Already handles image URIs, fallback initials, and three sizes (sm/md/lg) |
| Presence tracking | Custom WebSocket or polling | `supabase.channel().on('presence', ...)` | Handles heartbeats, reconnection, and state reconciliation automatically |
| Toast animations | Manual Animated.View timing | `react-native-reanimated` slide-in/slide-out | Already installed; provides smooth 60fps animations with worklets |
| Debounce utility | Custom setTimeout wrapper | Inline setTimeout in the hook (see Pattern 1) | Simple enough to inline; no need for lodash.debounce |
| Member profile data | Separate API call per presence member | `householdStore.members` | Already loaded on app init; contains `display_name`, `avatar_url`, and `user_id` for all household members |

**Key insight:** The household members list is already loaded in `householdStore.members` with profile data (display_name, avatar_url). Presence payloads should include user_id, display_name, and avatar_url so the `PresenceAvatarStack` component can render without additional API calls. But for fallback (e.g., if presence payload is minimal), the household members cache provides everything needed.

## Common Pitfalls

### Pitfall 1: Phantom Avatar Flickering from sync Reconciliation
**What goes wrong:** Avatars appear and disappear rapidly on screen, sometimes showing the current user's own avatar briefly.
**Why it happens:** The Supabase `sync` event fires with simultaneous join/leave during state reconciliation between local and server state. If the UI reacts to every event immediately, this manifests as flickering.
**How to avoid:** (1) Only use the `sync` event, never individual join/leave. (2) Debounce state updates by 300ms. (3) Filter out the current user from the presence state before setting React state.
**Warning signs:** Avatars appearing for 100-200ms then vanishing during initial connection or network changes.

### Pitfall 2: Doubled Realtime Connections Hitting Free Tier Limit
**What goes wrong:** App stops receiving real-time updates silently after hitting the 200-connection limit.
**Why it happens:** Each presence channel is a separate connection. If grocery data sync (existing) + grocery presence + recipe presence + activity channels all stack up, a household with 4 members could use 16+ connections just for one screen.
**How to avoid:** (1) Remove channels on unmount religiously. (2) Only create presence channels when the screen is active/focused. (3) Share one activity channel per household rather than per-screen. (4) Monitor connection count during development.
**Warning signs:** Real-time features working for some users but not others; intermittent subscription failures.

### Pitfall 3: Showing Toasts for Own Actions
**What goes wrong:** User checks off a grocery item and immediately sees a toast saying "You checked off milk."
**Why it happens:** postgres_changes fires for ALL changes, including the current user's own actions. The event payload does not inherently distinguish the actor unless the row has a `checked_by` or `created_by` field.
**How to avoid:** Always compare the actor ID in the payload against the current user ID. For grocery items, `checked_by` already exists on the row. For meal plans, `created_by` exists. Filter these before showing toasts.
**Warning signs:** Seeing duplicate feedback (optimistic UI update + toast) for your own actions.

### Pitfall 4: Stale Presence After App Backgrounding
**What goes wrong:** User's avatar stays visible to others after they've switched to another app or locked their phone.
**Why it happens:** Supabase Presence tracks WebSocket connection state, not app foreground state. On mobile, the OS may keep the WebSocket alive briefly when backgrounded.
**How to avoid:** Use React Native's `AppState` listener to call `channel.untrack()` on background and re-track on foreground. This provides a tighter presence signal than relying on WebSocket timeout.
**Warning signs:** Avatars showing for users who clearly left the screen 30+ seconds ago.

### Pitfall 5: Toast Notification Conflicts with Push Notifications
**What goes wrong:** User gets both an in-app activity toast AND a push notification for the same event (e.g., a household member checking off a grocery item).
**Why it happens:** Phase 6 set up Database Webhooks that trigger push notifications on table changes. Phase 7 adds in-app toasts for the same table changes.
**How to avoid:** Activity toasts (RT-03) are in-app-only UI. They are NOT push notifications. The push notification system from Phase 6 handles background alerts. When the app is foregrounded, `expo-notifications` is configured to show alerts (`shouldShowAlert: true` in the existing `useNotifications.ts`). Consider suppressing push notification display when an activity toast is already showing the same event, OR scope RT-03 toasts to only grocery check-offs and meal plan changes (which are high-frequency, real-time collaborative events), leaving push notifications for lower-frequency events (leftover alerts, budget warnings).

## Code Examples

### PresenceAvatarStack Component
```typescript
// Source: Project pattern (Avatar.tsx) + standard overlapping avatar layout
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { PresenceMember } from '../../hooks/usePresence';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface PresenceAvatarStackProps {
  members: PresenceMember[];
  maxVisible?: number;
}

export function PresenceAvatarStack({ members, maxVisible = 3 }: PresenceAvatarStackProps) {
  if (members.length === 0) return null;

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - maxVisible;

  return (
    <View style={styles.container}>
      {visible.map((member, index) => (
        <View
          key={member.user_id}
          style={[styles.avatarWrapper, { marginLeft: index > 0 ? -8 : 0, zIndex: maxVisible - index }]}
        >
          <Avatar
            uri={member.avatar_url}
            name={member.display_name}
            size="sm"
          />
        </View>
      ))}
      {overflow > 0 && (
        <View style={[styles.overflowBadge, { marginLeft: -8 }]}>
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: borderRadius.full,
  },
  overflowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  overflowText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
});
```

### ActivityToast Component
```typescript
// Source: Project design system (tonal layering, ambient shadows, ghost borders)
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Avatar } from '../ui/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface ActivityToastProps {
  avatar_url: string | null;
  display_name: string;
  message: string;       // e.g., "checked off Milk"
  duration?: number;     // auto-dismiss ms, default 3000
  onDismiss: () => void;
}

export function ActivityToast({
  avatar_url,
  display_name,
  message,
  duration = 3000,
  onDismiss,
}: ActivityToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    // Auto-dismiss
    translateY.value = withDelay(duration, withTiming(-100, { duration: 300 }));
    opacity.value = withDelay(duration, withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toast, animatedStyle]}>
      <Avatar uri={avatar_url} name={display_name} size="sm" />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{display_name}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.float,
    zIndex: 1000,
  },
  textContainer: { flex: 1 },
  name: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },
  message: { ...typography.bodySm, color: colors.onSurfaceVariant },
});
```

### Integration in Grocery Screen (titleRow modification)
```typescript
// In grocery.tsx, add to the titleRow between editCatBtn and screenTitle:
const members = usePresence(
  activeListId ? `grocery:${activeListId}` : null,
  userId ? { user_id: userId, display_name: profile?.display_name ?? '', avatar_url: profile?.avatar_url ?? null } : null
);

// In the JSX titleRow:
<View style={styles.titleRow}>
  <PresenceAvatarStack members={members} />
  <Text style={styles.screenTitle}>Grocery List</Text>
  <Pressable onPress={() => setCatSheetOpen(true)} style={styles.editCatBtn}>
    <MaterialCommunityIcons name="tag-edit-outline" size={20} color={colors.onSurfaceVariant} />
  </Pressable>
</View>
```

### Integration in Recipe Detail (hero area)
```typescript
// In recipe/[id].tsx, add presence to the header button area:
const members = usePresence(
  id ? `recipe:${id}` : null,
  userId ? { user_id: userId, display_name: profile?.display_name ?? '', avatar_url: profile?.avatar_url ?? null } : null
);

// Position the avatar stack in the hero area, e.g., next to the back button:
<View style={{ position: 'absolute', right: 60, top: insets.top + spacing.xs + 6, zIndex: 10 }}>
  <PresenceAvatarStack members={members} />
</View>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual join/leave event handlers | sync-only event handler with presenceState() | Always been the recommended pattern, but docs now explicitly warn about phantom events | Prevents flickering; simpler code |
| Global presence channel per household | Per-screen presence channels | N/A (Mise-specific) | More granular "who's viewing what" vs "who's online anywhere" |

**Deprecated/outdated:**
- None. Supabase Realtime Presence API has been stable since v2.x. The `channel()` API replaced the older `socket.channel()` pattern in supabase-js v2.

## Open Questions

1. **Should activity toasts be suppressed when a push notification for the same event is already displayed?**
   - What we know: Phase 6 configured `shouldShowAlert: true` for foreground notifications. If Database Webhooks trigger push notifications for grocery check-offs, users could see both a push banner and an activity toast.
   - What's unclear: Whether Phase 6 actually set up Database Webhooks for grocery item changes (review needed). If not, this is not an issue.
   - Recommendation: Check Phase 6 implementation. If DB webhooks exist for grocery_items, either (a) suppress push display when toast is showing, or (b) only use toasts for high-frequency events and push for low-frequency events. The simplest approach: activity toasts handle grocery check-offs and meal plan changes in-app; push notifications only fire for background events.

2. **Where exactly should PresenceAvatarStack be positioned on each screen?**
   - What we know: Grocery screen has a `titleRow` with centered title and tag-edit button. Recipe detail has a hero image with overlay buttons.
   - What's unclear: Exact visual design placement per the "Culinary Curator" design system.
   - Recommendation: Grocery: replace the empty `editCatBtn` spacer on the left of the title row with the avatar stack. Recipe: position below the back button or in the hero area. Both are lightweight layout changes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (jest-expo) v29.7.0 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern=presence --passWithNoTests` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RT-01 | Presence avatar stack renders on grocery screen | unit | `npx jest tests/components/PresenceAvatarStack.test.tsx -x` | Wave 0 |
| RT-02 | Presence avatar stack renders on recipe detail | unit | `npx jest tests/components/PresenceAvatarStack.test.tsx -x` | Wave 0 |
| RT-03 | Activity toast shows for other users' actions | unit | `npx jest tests/hooks/useActivityToast.test.tsx -x` | Wave 0 |
| RT-04 | usePresence hook debounces sync events and filters self | unit | `npx jest tests/hooks/usePresence.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=presence --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/hooks/usePresence.test.tsx` -- covers RT-01, RT-02, RT-04 (mock supabase.channel, verify debounce, verify self-filtering)
- [ ] `tests/hooks/useActivityToast.test.tsx` -- covers RT-03 (mock postgres_changes, verify toast data shape, verify self-filtering)
- [ ] `tests/components/PresenceAvatarStack.test.tsx` -- covers RT-01, RT-02 (render with 0/1/3/5 members, verify overflow badge)
- [ ] `tests/components/ActivityToast.test.tsx` -- covers RT-03 (render, auto-dismiss callback)

## Sources

### Primary (HIGH confidence)
- [Supabase Realtime Presence docs](https://supabase.com/docs/guides/realtime/presence) -- Complete API for channel creation, track/untrack, sync/join/leave events, presenceState(), custom presence keys, and the explicit warning about phantom join/leave during sync reconciliation
- Existing codebase: `src/hooks/useGrocerySync.ts` -- Working Supabase Realtime postgres_changes integration pattern (channel creation, event subscription, cleanup)
- Existing codebase: `src/components/ui/Avatar.tsx` -- Reusable avatar component with image/initials fallback
- Existing codebase: `src/stores/householdStore.ts` -- Member data with profiles (display_name, avatar_url) already loaded

### Secondary (MEDIUM confidence)
- Project-level research: `.planning/research/SUMMARY.md` and `.planning/research/ARCHITECTURE.md` -- Confirmed presence architecture pattern, channel separation requirement, 200-connection limit concern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies; everything already installed and verified in package.json
- Architecture: HIGH - usePresence hook follows exact pattern of existing useGrocerySync; Presence API verified against official Supabase docs
- Pitfalls: HIGH - Phantom flickering from sync reconciliation is explicitly documented in Supabase official docs; other pitfalls derived from codebase analysis (existing postgres_changes channels, existing push notification setup)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (Supabase Presence API is stable; no upcoming breaking changes known)
