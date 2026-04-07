# Milestones

## v5.0 Social Feed (Shipped: 2026-04-07)

**Phases completed:** 5 phases, 12 plans, 25 tasks

**Key accomplishments:**

- Zustand socialStore with profile CRUD, lazy creation, and search; kitchen profile modal screen with KitchenProfileCard showing avatar, name, bio, recipe count, and follower/following counts
- Debounced kitchen search overlay on Plan tab with live results and invite code sharing (copy/share) on own kitchen profile screen
- Follow/unfollow actions in socialStore with optimistic UI rollback, wired to Follow/Following toggle button on kitchen profile screens with counter updates and unfollow toast
- Followers/following list screen with segmented control, inline follow buttons, two-step Supabase queries, and navigation wiring from kitchen profile stat taps
- Auto-post hook in planStore creates feed_post rows on meal assignment, with meal photo upload to Supabase Storage and cursor-paginated feed queries in socialStore
- Venmo-style social feed on Plan tab with segmented control, infinite-scroll FeedCard list, pull-to-refresh, camera photo attach on own posts, and empty state with search CTA
- Complete data layer for likes, comments, recipe saving, reporting, and blocking with optimistic UI patterns, blocked kitchen feed filtering, and reported_content migration with RLS
- Interactive FeedCard with animated like toggle, CommentSheet bottom sheet, and recipe save with Alert feedback wired through socialStore methods
- Cook This Too button with MealSlotPickerSheet for recipe-to-plan flow, plus long-press action sheet for report/block moderation on non-own feed cards
- Webhook-triggered Edge Function sending Expo push notifications for follows, likes, and comments with kitchen-to-user token resolution and self-notification prevention
- Database webhook triggers on follows/likes/comments tables firing async HTTP to Edge Function, with social notifications toggle in profile settings

---

## v4.0 AI Vision — Scan, Snap & Add (Shipped: 2026-03-30)

**Phases completed:** 4 phases, 9 plans, 13 tasks

**Key accomplishments:**

- Image compression utility, analyzePhoto Edge Function client, camera permission hook, and 4 reusable camera UI components for vision feature foundation
- analyze-food-photo Edge Function with Gemini 2.5 Flash vision, intent-based prompt routing (scan/identify), and 5/month free rate limiting via ai_usage_log
- ScannedItem types, duplicate detection via normalized substring matching, and bulkAddPantryItems with optimistic batch insert
- Serper.dev recipe search Edge Function with 20/month free rate limiting and typed client helper
- Dish identification and recipe results bottom sheets with Kitchen tab camera routing for scan vs identify intents
- Day + meal slot picker bottom sheet with dual-path UX (Find Recipes / Log as Meal) on dish identification
- End-to-end photo-to-meal-plan flow wiring: DishIdentifiedSheet -> MealSlotPickerSheet -> planStore.assignRecipe with notes-based Plan tab display

---

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
