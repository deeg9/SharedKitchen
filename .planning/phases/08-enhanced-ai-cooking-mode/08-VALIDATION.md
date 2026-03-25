---
phase: 8
slug: enhanced-ai-cooking-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x with jest-expo 55 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --bail --testPathPattern` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | AI-04, AI-05 | unit | `npx jest --testPathPattern parse-recipe` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | COOK-05 | unit | `npx jest --testPathPattern timer` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | AI-06 | unit | `npx jest --testPathPattern generate-meal` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | COOK-01, COOK-02 | unit | `npx jest --testPathPattern cooking` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | COOK-03, COOK-04 | unit | `npx jest --testPathPattern timer\|unit-convert` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] JSON-LD extraction test stubs
- [ ] Cooking mode component test stubs
- [ ] Timer hook test stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| JSON-LD extraction from real recipe sites | AI-04 | Requires network access to real URLs | Import recipes from allrecipes.com, seriouseats.com, verify extraction without LLM |
| Meal generator suggestions quality | AI-06 | LLM output quality is subjective | Generate 3 meal suggestions, verify they respect dietary prefs and avoid recent meals |
| Fullscreen cooking mode UX | COOK-01 | Visual/interaction verification | Enter cooking mode, swipe through steps, verify pagination and progress |
| Timer accuracy | COOK-03 | Requires real-time observation | Start timer, verify countdown accuracy, test pause/resume |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
