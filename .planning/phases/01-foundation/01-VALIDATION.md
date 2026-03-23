---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (bundled with Expo) + React Native Testing Library |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx jest --passWithNoTests --bail` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests --bail`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | unit | `npx jest tests/auth.test.ts -t "signup" -x` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-02 | unit | `npx jest tests/auth.test.ts -t "google" -x` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-03 | unit | `npx jest tests/supabase-client.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | HOUS-01 | unit | `npx jest tests/household.test.ts -t "create" -x` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | HOUS-02 | unit | `npx jest tests/household.test.ts -t "invite" -x` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | HOUS-03 | unit | `npx jest tests/household.test.ts -t "join" -x` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | HOUS-04 | unit | `npx jest tests/household.test.ts -t "members" -x` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | HOUS-05 | unit | `npx jest tests/stores/householdStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | DSGN-01 | unit | `npx jest tests/theme.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | DSGN-02 | unit | `npx jest tests/theme.test.ts -t "colors" -x` | ❌ W0 | ⬜ pending |
| 01-03-03 | 03 | 1 | DSGN-03 | integration | Manual — verify fonts load in Expo Go | N/A | ⬜ pending |
| 01-03-04 | 03 | 1 | DSGN-04 | component | `npx jest tests/components/TabBar.test.tsx -x` | ❌ W0 | ⬜ pending |
| 01-03-05 | 03 | 1 | DSGN-05 | component | `npx jest tests/components/BottomSheet.test.tsx -x` | ❌ W0 | ⬜ pending |
| 01-03-06 | 03 | 1 | DSGN-06 | component | `npx jest tests/components/Skeleton.test.tsx -x` | ❌ W0 | ⬜ pending |
| 01-03-07 | 03 | 1 | PROF-01 | component | `npx jest tests/screens/profile.test.tsx -x` | ❌ W0 | ⬜ pending |
| 01-03-08 | 03 | 1 | PROF-06 | unit | `npx jest tests/auth.test.ts -t "signout" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.js` — Jest configuration for Expo + TypeScript
- [ ] `tests/setup.ts` — test setup with React Native Testing Library
- [ ] `tests/auth.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-03, PROF-06
- [ ] `tests/supabase-client.test.ts` — stubs for AUTH-03
- [ ] `tests/household.test.ts` — stubs for HOUS-01, HOUS-02, HOUS-03, HOUS-04
- [ ] `tests/stores/householdStore.test.ts` — stubs for HOUS-05
- [ ] `tests/theme.test.ts` — stubs for DSGN-01, DSGN-02
- [ ] `tests/components/TabBar.test.tsx` — stubs for DSGN-04
- [ ] `tests/components/BottomSheet.test.tsx` — stubs for DSGN-05
- [ ] `tests/components/Skeleton.test.tsx` — stubs for DSGN-06
- [ ] `tests/screens/profile.test.tsx` — stubs for PROF-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fonts load correctly | DSGN-03 | Requires Expo Go runtime | Open app in Expo Go, verify Plus Jakarta Sans headers and Inter body text render |
| Google OAuth flow | AUTH-02 | Requires iOS simulator + Google credentials | Configure test Google OAuth client, run full sign-in flow on iOS simulator |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
