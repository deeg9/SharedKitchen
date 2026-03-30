# SharedKitchen

## What This Is

SharedKitchen is a collaborative dinner planning mobile app for couples, roommates, and families. It combines a shared weekly meal calendar, AI-powered recipe library with web/video extraction and meal generation, auto-generated grocery lists with real-time sync and live presence, AI vision features (fridge scanning, food photo recipe discovery, photo meal logging), push notifications, Stripe-powered premium subscriptions, fullscreen cooking mode with step-by-step timers, and budget tracking — all in one warm, inviting interface. Built with React Native + Expo for iOS, backed by Supabase.

## Core Value

Households can collaboratively plan, shop for, and cook dinners together in real-time — eliminating the daily "what's for dinner?" friction.

## Current State

**Shipped:** v4.0 AI Vision — Scan, Snap & Add (2026-03-30)
**Codebase:** ~29,800 LOC across 220+ source files (TypeScript, SQL, YAML)
**Tech stack:** React Native + Expo (iOS), Supabase (Postgres, Auth, Realtime, Storage, Edge Functions), Gemini 2.5 Flash (vision + text), Supadata, Serper.dev, Stripe, expo-share-intent, expo-image-manipulator, expo-notifications, Maestro E2E

## Requirements

### Validated

- ✓ Weekly dinner calendar with day cards — v1.0
- ✓ Shared recipe library with search, filters, 2-column grid — v1.0
- ✓ AI-powered recipe import from URL — v1.0, enhanced v2.0 (JSON-LD first)
- ✓ Manual recipe creation — v1.0
- ✓ Recipe detail with scaling, ratings, notes — v1.0
- ✓ Grocery list auto-generated, grouped by section — v1.0
- ✓ Real-time grocery list sync via Supabase Realtime — v1.0
- ✓ Manual grocery item additions — v1.0
- ✓ Monthly budget dashboard with category breakdown — v1.0
- ✓ Weekly spending breakdown — v1.0
- ✓ Quick expense logging — v1.0
- ✓ Household creation and management — v1.0
- ✓ Multi-household support — v1.0
- ✓ Household invite system — v1.0
- ✓ Email/password and Google OAuth auth — v1.0
- ✓ User profile with avatar, name, cooking stats — v1.0
- ✓ "Surprise Me" random dinner generator — v1.0
- ✓ Edit meal plan day via bottom sheet — v1.0
- ✓ Leftover tracker with freshness badges — v1.0
- ✓ AI suggestion cards — v1.0
- ✓ Onboarding flow — v1.0
- ✓ Dietary preferences/restrictions — v1.0
- ✓ Dark mode — v1.0
- ✓ 5-tab bottom navigation — v1.0
- ✓ Culinary Curator design system — v1.0
- ✓ Stripe subscription checkout ($9.99/mo) — v2.0
- ✓ Server-authoritative premium gating via RLS — v2.0
- ✓ Stripe billing portal (cancel, update payment) — v2.0
- ✓ Stripe webhook handler with idempotent processing — v2.0
- ✓ Recipe import with gpt-5-mini structured outputs — v2.0
- ✓ JSON-LD/schema.org extraction before LLM fallback — v2.0
- ✓ Nutrition info and image extraction from URLs — v2.0
- ✓ AI-powered meal generator (dietary, history, leftovers, budget) — v2.0
- ✓ Per-user AI rate limiting and response caching — v2.0
- ✓ Push token registration with Expo Push API — v2.0
- ✓ Contextual notification permission pre-prompt — v2.0
- ✓ Local cooking reminders before meal prep time — v2.0
- ✓ Leftover expiry push alerts — v2.0
- ✓ Budget threshold push alerts (80%/100%) — v2.0
- ✓ Live presence avatars on grocery list — v2.0
- ✓ Live presence avatars on recipe detail — v2.0
- ✓ Activity toasts for household member actions — v2.0
- ✓ Fullscreen step-by-step cooking mode — v2.0
- ✓ Embedded countdown timers in cooking steps — v2.0
- ✓ Metric/imperial unit conversion toggle — v2.0
- ✓ AI-parsed timer durations from instruction text — v2.0
- ✓ 18 Maestro E2E test flows (auth, recipes, planning, grocery, premium, negative paths) — v2.0
- ✓ Recipe filtering: FilterBar with category/cost/time dropdowns, unified 14-category list, category picker in create/edit forms — v2.1
- ✓ filteredRecipes() unit tests covering all filter dimensions — v2.1
- ✓ getErrorMessage utility, zero console.error in stores, zero `as any` casts — v2.1
- ✓ ErrorBoundary wrapping root layout with fallback UI — v2.1
- ✓ Reusable EmptyState component on grocery screen — v2.1
- ✓ Video recipe import from TikTok/Instagram/YouTube via paste URL — v3.0
- ✓ iOS share sheet integration (expo-share-intent) — v3.0
- ✓ Supadata transcript extraction + Gemini Flash recipe parsing — v3.0
- ✓ Freemium video import rate limiting (3/month free, unlimited premium) — v3.0
- ✓ Kitchen tab with segmented control (On Hand / Shopping List) — v3.0
- ✓ Pantry/fridge inventory with auto-copy from checked grocery items — v3.0
- ✓ Real-time pantry sync via Supabase Realtime — v3.0

- ✓ Camera photo capture with permission pre-prompt and compression — v4.0
- ✓ analyze-food-photo Edge Function with Gemini 2.5 Flash vision (scan/identify intents) — v4.0
- ✓ Vision-specific rate limiting (5/month free, unlimited premium) — v4.0
- ✓ Fridge/pantry photo scan with brand-level item identification — v4.0
- ✓ Editable scan review screen with bulk-add to On Hand inventory — v4.0
- ✓ Duplicate detection via normalized name matching against existing pantry — v4.0
- ✓ Multi-photo scan (scan multiple shelves, merge before saving) — v4.0
- ✓ Food photo dish identification with confidence levels — v4.0
- ✓ Recipe web search via Serper.dev (2-3 results) — v4.0
- ✓ Recipe import from search results via existing parseRecipeUrl pipeline — v4.0
- ✓ Dual-action after dish ID: Find Recipes or Log as Meal — v4.0
- ✓ Photo meal logging to weekly plan (day + slot picker) — v4.0
- ✓ Recipe-less meals displayed on Plan tab via notes fallback — v4.0

### Active

(None — planning next milestone)

## Current Milestone: v4.0 AI Vision — Scan, Snap & Add (SHIPPED)

**Shipped:** 2026-03-30

**Delivered features:**
- Camera-based vision infrastructure with Gemini 2.5 Flash (scan + identify intents)
- Fridge/pantry photo scan with brand-level identification, editable review, dedup, multi-photo, bulk-add
- Food photo → recipe discovery with Serper.dev web search and existing import pipeline
- Food photo → meal logging with day/slot picker and Plan tab display

### Out of Scope

- Android build — iOS-first; Expo cross-platform foundation ready
- Web version — mobile-first product
- Social features beyond household — no public profiles or recipe sharing
- Meal prep / batch cooking — per-day planning kept simple
- Grocery delivery integration (Instacart, etc.)
- Real-time chat — activity feed provides lightweight awareness
- Video content in recipes — text + photos only
- Apple IAP — Stripe external payment at ~3% vs 15-30%
- AI-generated recipe images — extract from source URLs instead
- Premium analytics dashboard — deferred to v3.0

## Context

- **v1.0 MVP** shipped with 63 requirements across 4 phases (Foundation, Core Features, Supporting Features, Onboarding & Freemium)
- **v2.0 AI, Payments & Polish** shipped with 30 requirements across 5 phases (AI Fix & Payment Foundation, Push Notifications, Real-Time Presence, Enhanced AI & Cooking Mode, E2E Testing)
- Architecture spec: `/Users/deeg/Desktop/mise-stitch-prompt.md`
- Design language: warm cream/off-white backgrounds, deep olive/sage green primary (#334537), burnt orange accent (#904d00), Material Design 3 color tokens, Plus Jakarta Sans headers, Inter body text
- Design philosophy: "Tactile Sophistication" — no-line rule, tonal layering, ambient shadows, ghost borders

## Constraints

- **Platform**: iOS only (React Native + Expo, EAS Build)
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)
- **Auth**: Email/password + Google OAuth via Supabase Auth
- **AI**: OpenAI gpt-5-mini for recipe extraction and meal generation
- **Payments**: Stripe external payments (post-Epic v. Apple ruling)
- **Notifications**: expo-notifications with Expo Push API
- **E2E Testing**: Maestro YAML flows (external CLI, no project deps)
- **Design**: Culinary Curator MD3 design system (4 font sizes, 2 weights)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native + Expo over native Swift | Cross-platform foundation; faster development | ✓ Good — enabled rapid iteration |
| Supabase over Firebase | Postgres flexibility, Realtime, RLS | ✓ Good — RLS critical for premium gating |
| Multi-household from day one | Easier to architect upfront | ✓ Good — clean data isolation |
| Real-time grocery sync from v1 | Core to collaborative value prop | ✓ Good — extended to Presence in v2 |
| gpt-5-mini replacing gpt-4o-mini | gpt-4o-mini deprecated Feb 2026 | ✓ Good — structured outputs cleaner |
| JSON-LD extraction before LLM | ~80% of recipe sites have schema.org data | ✓ Good — eliminated LLM cost for majority |
| Stripe external payments over Apple IAP | ~3% vs 15-30% commission | ✓ Good — post-Epic ruling enables this |
| Server-authoritative subscriptions | AsyncStorage premium state bypassable | ✓ Good — RLS enforces server-side |
| Local notifications for Phase 6 | No server push needed for cooking/leftover/budget | ✓ Good — simpler architecture |
| Supabase Presence for avatars | Separate from postgres_changes channels | ✓ Good — clean separation of concerns |
| Maestro over Detox for E2E | YAML-based, no project deps, EAS Workflows support | ✓ Good — 18 flows written quickly |
| Gemini 2.5 Flash for vision over GPT-5 | Already integrated, 8x cheaper for image analysis | ✓ Good — single API key for text + vision |
| Single analyze-food-photo Edge Function with intent param | 90% shared code (auth, rate limit, Gemini) | ✓ Good — clean extension for scan vs identify |
| Serper.dev for recipe web search | 2,500 free queries, structured results, $0.001/query | ✓ Good — cheaper and simpler than Spoonacular |
| expo-image-manipulator for client compression | Part of Expo SDK, no native rebuild needed | ✓ Good — 1024px JPEG 0.6 keeps payloads small |
| Base64 in JSON body (not Storage) | Images are transient, not persisted | ✓ Good — simpler architecture, no cleanup |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-03-30 after v4.0 milestone shipped*
