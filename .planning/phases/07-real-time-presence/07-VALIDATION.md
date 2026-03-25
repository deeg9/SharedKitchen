---
phase: 7
slug: real-time-presence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 7 — Validation Strategy

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
| 07-01-01 | 01 | 1 | RT-01, RT-02 | unit | `npx jest --testPathPattern presence` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | RT-03 | unit | `npx jest --testPathPattern activity` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | RT-04 | unit | `npx jest --testPathPattern presence` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Presence hook test stubs
- [ ] Activity toast test stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Avatar stacks appear on grocery list | RT-01 | Requires 2 devices/simulators viewing same screen | Open grocery list on 2 devices, verify avatar stack shows other user |
| Avatar stacks appear on recipe detail | RT-02 | Requires 2 devices viewing same recipe | Open same recipe on 2 devices, verify avatar stack |
| Toast when household member checks off item | RT-03 | Requires real-time multi-device interaction | Check off grocery item on device A, verify toast on device B |
| No phantom avatar flickering | RT-04 | Visual verification on device | Navigate between screens, verify no brief flash of stale avatars |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
