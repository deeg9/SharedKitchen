---
phase: 6
slug: push-notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 6 — Validation Strategy

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
| 06-01-01 | 01 | 1 | NOTIF-01 | unit | `npx jest --testPathPattern notification` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | NOTIF-02 | unit | `npx jest --testPathPattern notification` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | NOTIF-03 | unit | `npx jest --testPathPattern cooking-reminder` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | NOTIF-04 | unit | `npx jest --testPathPattern leftover-alert` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 1 | NOTIF-05 | unit | `npx jest --testPathPattern budget-alert` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Notification scheduling utility test stubs
- [ ] Push token registration test stubs

*Existing jest infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push permission prompt with explanation | NOTIF-02 | Requires physical device + EAS build | Trigger permission flow, verify explanation screen appears before OS prompt |
| Local cooking reminder fires | NOTIF-03 | Requires physical device with notification center | Schedule meal, wait for reminder time, verify notification appears |
| Leftover expiry alert fires | NOTIF-04 | Requires physical device with notification center | Add leftover with near use-by date, verify alert appears |
| Budget threshold push | NOTIF-05 | Requires server-side trigger + physical device | Add expenses past 80% threshold, verify push received |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
