# Phase 45: Recipe Attribution & Creator Permissions - Validation

**Extracted from:** 45-RESEARCH.md Validation Architecture section
**Created:** 2026-04-10

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest with jest-expo preset |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern="<pattern>" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ATTR-01 | Creator attribution row renders with avatar + handle | unit | `npx jest --testPathPattern="RecipeDetail" --no-coverage` | No -- Wave 0 |
| ATTR-02 | Edit button hidden for non-creators, shown for creators | unit | `npx jest --testPathPattern="RecipeDetail" --no-coverage` | No -- Wave 0 |
| ATTR-03 | Non-creator can still rate/favorite (no UI change needed) | unit | `npx jest --testPathPattern="recipeStore" --no-coverage` | Partial -- `tests/stores/recipeStore.test.ts` exists |
| ATTR-04 | Legacy backfill SQL correctness | manual-only | N/A (SQL migration verified by running against test DB) | N/A |
| IDEN-03 | People search returns matching profiles | unit | `npx jest --testPathPattern="PeopleSearch\|KitchenSearchBar" --no-coverage` | No -- Wave 0 |

## Sampling Rate

- **Per task commit:** `npx jest --testPathPattern="<changed-module>" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Wave 0 Gaps

- [ ] `tests/screens/recipe-detail-attribution.test.tsx` -- covers ATTR-01, ATTR-02
- [ ] `tests/components/PeopleSearch.test.tsx` -- covers IDEN-03
- [ ] No new framework install needed -- Jest already configured
