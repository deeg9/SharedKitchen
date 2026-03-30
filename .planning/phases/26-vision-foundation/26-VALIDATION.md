---
phase: 26
slug: vision-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (existing) |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --testPathPattern=vision --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=vision --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | VIS-01 | unit | `npx jest --testPathPattern=CameraSheet` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 1 | VIS-02 | unit | `npx jest --testPathPattern=compressForVision` | ❌ W0 | ⬜ pending |
| 26-01-03 | 01 | 1 | VIS-03 | manual | N/A (iOS permission prompt) | N/A | ⬜ pending |
| 26-02-01 | 02 | 2 | VIS-04 | unit | `npx jest --testPathPattern=analyze-food-photo` | ❌ W0 | ⬜ pending |
| 26-02-02 | 02 | 2 | VIS-05 | unit | `npx jest --testPathPattern=vision.*rate` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/vision.test.ts` — stubs for compressForVision, analyzePhoto
- [ ] `tests/components/CameraSheet.test.tsx` — stubs for camera sheet render/permission

*Existing jest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Camera permission pre-prompt bottom sheet | VIS-03 | iOS system permission requires real device | Open camera sheet, verify pre-prompt appears before system dialog |
| Camera capture produces image | VIS-01 | Physical camera required | Take photo, verify preview displayed |
| Permission denied recovery card | VIS-03 | Requires denying iOS permission | Deny camera, verify inline recovery card with Settings button |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
