# Phase 35: Data Foundation - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

App has a canonical food data layer with numeric nutrition storage, unit conversion, and caching infrastructure ready for external API integration. This phase delivers: Postgres migration with food_items table (tsvector + GIN index, 30-day TTL), canonical NutritionData TypeScript types shared between client and Edge Functions, and a unit conversion module with food-specific density tables.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from research:
- Nutrition must be stored as numeric values (not strings) — the existing NutritionInfo interface uses strings from schema.org scraping, new types must coexist
- Unit conversion needs food-specific density tables (1 cup flour = 120g, 1 cup sugar = 200g, etc.)
- Cache table needs tsvector + GIN index for full-text search and a TTL mechanism for 30-day expiry
- Types must be shared between client (React Native) and Edge Functions (Deno)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `NutritionInfo` interface in `src/types/database.ts` (string-based — calories?: string)
- Existing `Ingredient` type in recipe types
- Supabase migration pattern established across 18+ migrations
- Edge Function pattern with auth, rate limiting, Gemini integration

### Established Patterns
- Zustand stores for client state management
- Supabase Edge Functions (Deno) for backend logic
- TypeScript types in `src/types/` directory
- Database types generated from Supabase schema

### Integration Points
- New food_items table connects to existing pantry_items and recipe ingredients
- New NutritionData type used alongside existing NutritionInfo (backward compatible)
- Unit conversion module used by future recipe nutrition calculation (Phase 38)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
