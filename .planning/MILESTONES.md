# Milestones

## v8.0 v8.0 (Shipped: 2026-04-11)

**Phases completed:** 5 phases, 15 plans, 31 tasks

**Key accomplishments:**

- 26 it.todo() test stubs across 5 files covering HandleInput validation, HandleSetupStep onboarding, HandleSetupInterstitial blocking, FeedCard handle display, and root layout handle gate
- Handle column with LOWER() unique index, validation utils with 15 reserved words, and authStore handle state/actions with TDD coverage
- HandleInput with real-time validation, blocking interstitial for existing users, and onboarding step 1 for new users with shared useHandleForm hook
- @handle shown as primary identity on feed cards, profile screen, and recipe detail attribution with graceful display_name fallback
- Handle change UI on Edit Profile with 30-day cooldown enforcement and handleChangedAt state in authStore
- Creator-scoped RLS policies replacing permissive UPDATE/DELETE with backfill migration for legacy recipes
- CreatorAttribution component with avatar + handle below recipe name, edit button gated to recipe creator only
- People search by @handle in search overlay with Kitchens/People tabs, navigating to public profile page with avatar, handle, and 2-column recipe grid
- cook_logs table with RLS, Zustand store for CRUD + unlogged meal detection, and 1200px/0.8 JPEG photo upload to Supabase Storage
- 5 cook log UI components (sheet, button, badge, gallery, thumbnail) integrated into recipe detail with full logging flow
- Post-cooking CookLogSheet prompt via onCookComplete callback and PastMealBanner for unlogged meals on Plan tab with AsyncStorage dismiss persistence
- recipe_comments table with threaded RLS, comment_count trigger, and Zustand store with optimistic updates and single-level reply threading
- Four threaded comment UI components with reply context banner, long-press delete, and count badge integrated into recipe detail page
- Database migration adding post_type discriminator, cook_log FK, recipe clone RPC, and automatic feed post creation on cook log
- FeedCard renders cook-log posts with 'cooked' context and caption quotes; saveRecipeFromPost rewritten to use clone_recipe_to_household SECURITY DEFINER RPC
- SavedFromAttribution component showing "Saved from @handle's kitchen" on recipe detail with tappable navigation and save button for cross-household cloning

---

## v7.0 Stitch UI Redesign (Shipped: 2026-04-09)

**Phases completed:** 5 phases, 14 plans, ~30 tasks

**Key accomplishments:**

- 5 reusable shared UI components (DonutChart, ProgressBar, InsightCard, FilterChips, DateStrip) with animated SVG and Reanimated
- Day-focused meal planner with hero dinner card, DateStrip navigation, Day/Week toggle, and grocery shortcut card
- 6-screen onboarding redesign (Welcome with hero photo, Create Kitchen with illustration, Invite with code sharing, Add Recipes with progress counter, Plan Week with meal slots, All Set with glassmorphism)
- Recipe Library with horizontal FilterChips, full-width cards with description/difficulty/rating, and Import CTA
- Cooking Mode redesign with step photos, timer card, step type badges, Chef's Tip callouts, ingredient chips, and Previous/Next navigation
- Premium Upgrade screen with hero kitchen photo, feature comparison table (Free vs Premium), and monthly/yearly pricing tiers
- Grocery List with shopping progress bar, sync-with-plan, enhanced item rows with quantity/price/tags, and all 4 real-time hooks preserved
- Budget dashboard with DonutChart hero, month picker, Budget Insights cards, category progress bars, and weekly mini bar charts
- Profile with cooking insights (streak + completion ring), most-cooked recipe, household distribution chart, and grouped settings navigation
- Social Feed with following avatar strip, hero-sized meal photos, Try This Recipe CTAs, and View Full Recipe actions

---

## v6.0 Food Data Integration (Shipped: 2026-04-09)

**Phases completed:** 4 phases, 8 plans, 13 tasks

**Key accomplishments:**

- Client-side food search with debounced query, macro pill result rows, and inline nutrition detail expansion via bottom sheet on Kitchen tab
- BarcodeResultCard (`src/components/barcode/BarcodeResultCard.tsx`):
- 1. [Rule 3 - Blocking] Updated test fixtures for new required fields
- Commit:

---

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
