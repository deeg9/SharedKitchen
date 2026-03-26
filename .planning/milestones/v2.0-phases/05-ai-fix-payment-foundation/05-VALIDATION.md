---
phase: 5
slug: ai-fix-payment-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 5 — Validation Strategy

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
| 05-01-01 | 01 | 1 | AI-03 | unit | `npx jest --testPathPattern parse-recipe` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | AI-07 | unit | `npx jest --testPathPattern rate-limit` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | PAY-02 | unit | `npx jest --testPathPattern subscriptionStore` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | PAY-03 | unit | `npx jest --testPathPattern stripe-webhook` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | PAY-05 | unit | `npx jest --testPathPattern rls` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | PAY-01 | manual | Stripe test mode checkout | N/A | ⬜ pending |
| 05-03-02 | 03 | 2 | PAY-04 | manual | Stripe billing portal link | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/__tests__/subscriptionStore.test.ts` — stubs for PAY-02
- [ ] `supabase/functions/parse-recipe-url/__tests__/` — stubs for AI-03
- [ ] Rate limiting utility test stubs for AI-07

*Existing jest infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe checkout flow | PAY-01 | Requires real Stripe test mode + browser redirect | Create test customer, complete checkout in Stripe test mode, verify subscription created |
| Billing portal access | PAY-04 | Requires Stripe-hosted portal session | Click "Manage Subscription", verify portal opens with cancel/update options |
| Webhook event handling | PAY-03 | Requires Stripe CLI webhook forwarding | Run `stripe listen --forward-to`, trigger test events, verify DB updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
