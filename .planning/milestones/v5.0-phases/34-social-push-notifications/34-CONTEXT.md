# Phase 34: Social Push Notifications - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive push notifications for social interactions: new followers, likes on their feed items, and comments on their feed items. This phase creates a server-side Edge Function triggered by database webhooks, with a separate social notification toggle in settings.

</domain>

<decisions>
## Implementation Decisions

### Notification Design
- New `send-social-notification` Edge Function triggered by database webhook on post_likes/post_comments/follows inserts
- No batching in v5.0 — send individual notifications. Batching is a v5.1 optimization.
- Separate "Social Notifications" toggle in Profile settings — independent from household notifications
- Notification text: "Kitchen X liked your meal" / "Kitchen X commented on your meal" / "Kitchen X started following you"

### Claude's Discretion
- Database webhook configuration (Supabase Dashboard or migration)
- Edge Function implementation details (auth, error handling)
- How to look up the target user's push token from kitchen_id
- Self-notification prevention (don't notify yourself)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `push_tokens` table — existing table for Expo Push token registration
- `expo-notifications` — already configured for local notifications
- Expo Push API — token registration already exists from v2.0
- Existing Edge Function patterns (parse-recipe-url, analyze-food-photo) — auth, CORS, error handling

### Established Patterns
- Edge Functions in `supabase/functions/` with Deno runtime
- Push token stored per user in `push_tokens` table
- Local notification scheduling via `scheduleNotificationAsync` — but social needs server-side push

### Integration Points
- `push_tokens` table — look up target user's token
- `follows` table — webhook trigger for new follower
- `post_likes` table — webhook trigger for like
- `post_comments` table — webhook trigger for comment
- Profile settings screen — add social notification toggle

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

- Notification batching ("20 people liked your post") — v5.1
- Weekly digest notification — future

</deferred>
