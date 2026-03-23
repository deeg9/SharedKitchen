---
phase: 2
slug: core-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 + @testing-library/react-native 13 |
| **Config file** | jest.config.js (exists from Phase 1) |
| **Quick run command** | `npx jest --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | RECP-01,04,05,08 | unit | `npx jest tests/stores/recipeStore.test.ts --bail` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | RECP-02,03,06 | unit | `npx jest tests/screens/recipeDetail.test.tsx tests/screens/addRecipe.test.tsx --bail` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | AI-01,RECP-07 | unit | `npx jest tests/lib/ai.test.ts --bail` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | PLAN-01,02,03,04,05,06,07 | unit | `npx jest tests/stores/planStore.test.ts tests/screens/plan.test.tsx --bail` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | GROC-01,02,03,06 | unit | `npx jest tests/lib/grocery-utils.test.ts tests/stores/groceryStore.test.ts --bail` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | GROC-04,05,07,08 | unit | `npx jest tests/hooks/useGrocerySync.test.ts tests/stores/groceryStore.test.ts --bail` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/stores/recipeStore.test.ts` — stubs for RECP-01, RECP-04, RECP-08
- [ ] `tests/stores/planStore.test.ts` — stubs for PLAN-01, PLAN-03, PLAN-04
- [ ] `tests/stores/groceryStore.test.ts` — stubs for GROC-01, GROC-04, GROC-07
- [ ] `tests/screens/recipeDetail.test.tsx` — stubs for RECP-02, RECP-03
- [ ] `tests/screens/addRecipe.test.tsx` — stubs for RECP-06
- [ ] `tests/screens/plan.test.tsx` — stubs for PLAN-01, PLAN-02, PLAN-06
- [ ] `tests/lib/dates.test.ts` — stubs for PLAN-02 week computation
- [ ] `tests/lib/grocery-utils.test.ts` — stubs for GROC-01 ingredient aggregation, RECP-03 scaling
- [ ] `tests/lib/ai.test.ts` — stubs for AI-01, RECP-07
- [ ] `tests/hooks/useGrocerySync.test.ts` — stubs for GROC-08 Realtime subscription
- [ ] Update `tests/setup.tsx` — add mocks for date-fns, @shopify/flash-list, Supabase Realtime

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recipe photo upload | RECP-06 | Requires device camera/gallery | Open add recipe form, tap photo upload, verify image appears |
| AI URL import end-to-end | RECP-07, AI-01 | Requires live LLM API call | Paste a recipe URL, verify parsed data populates form correctly |
| Real-time grocery sync | GROC-08 | Requires two devices/simulators | Check item on device A, verify it appears checked on device B within 2s |
| Recipe image placeholder | RECP-01 | Visual verification | Browse recipes, verify colored placeholder with food emoji shows for recipes without photos |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
