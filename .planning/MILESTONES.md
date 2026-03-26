# Milestones

## v2.0 AI, Payments & Polish (Shipped: 2026-03-26)

**Phases completed:** 5 phases, 13 plans, 27 tasks

**Key accomplishments:**

- Recipe import restored with gpt-5-mini, structured outputs, per-user rate limiting (10/50 daily), and 24h URL-based response caching
- Server-authoritative subscription system with Stripe webhook handler, RLS-enforced subscriptions table, and Zustand store replacing AsyncStorage-based premiumStore
- Stripe checkout + billing portal Edge Functions with all premium UI rewired from AsyncStorage to server-authoritative subscriptionStore
- Expo push notification infrastructure with token registration, centralized scheduling service, permission pre-prompt, and 22 unit tests
- Notification scheduling wired into three Zustand stores with OS permission gating on profile toggles
- Supabase Presence hooks with 300ms debounced sync, overlapping avatar stack, and animated activity toasts with self-filtering toast queue
- Presence avatars and activity toasts wired into grocery and recipe screens with AppState-based background untracking
- JSON-LD-first recipe extraction with nutrition/image fields, ISO 8601 timer parsing, and 36 unit tests
- Context-aware meal generator Edge Function gathering from 5 tables in parallel, with bottom sheet UI showing suggestion cards with cost/time/leftover badges
- Fullscreen dark cooking mode with horizontal step paging, countdown timers, metric/imperial conversion, and ingredient sidebar
- 74 testID props across 42 app components with Maestro config and 4 auth/onboarding E2E flow YAML definitions
- 6 Maestro E2E flows covering manual recipe creation, AI URL import, recipe detail interactions, meal plan add/edit/clear, and Surprise Me acceptance
- 7 Maestro E2E flows covering grocery list workflows, premium checkout, and 3 negative/failure paths

---
