# Phase 22: Presence, Subscription, Notifications & Edge Cases QA - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Validate real-time presence (avatar stack on recipe detail), Stripe subscription (screen loads, checkout flow), push notifications (permission prompt, timer notifications), and edge case handling (loading states, empty household, missing data).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — autonomous mode.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/hooks/usePresence.test.ts` — existing presence hook tests
- `tests/components/PresenceAvatarStack.test.tsx` — if exists
- `.maestro/premium-checkout.yaml` — existing premium checkout flow (needs appId update)
- `.maestro/negative-failed-payment.yaml` — negative payment flow
- `.maestro/negative-ai-timeout.yaml` — negative AI timeout flow
- `.maestro/negative-permissions-denied.yaml` — negative permissions flow

### Integration Points
- `src/hooks/usePresence.ts` — presence tracking hook
- `src/components/presence/PresenceAvatarStack.tsx` — avatar stack component
- `app/(app)/subscription.tsx` — subscription screen
- `src/stores/subscriptionStore.ts` — subscription state
- `src/lib/notifications.ts` — notification utilities
- `src/hooks/useNotifications.ts` — notification hook

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard QA testing approach.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
