# Milestones

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
