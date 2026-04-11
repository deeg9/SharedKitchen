---
phase: 49
slug: tech-debt-type-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if configured) / npx tsc --noEmit |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 49-01-01 | 01 | 1 | DEBT-01 | T-49-01 | RLS policy restricts profile columns | integration | `supabase db test` | ❌ W0 | ⬜ pending |
| 49-02-01 | 02 | 1 | DEBT-02 | — | Reserved word validation at store level | unit | `grep "RESERVED_WORDS" src/stores/authStore.ts` | ❌ W0 | ⬜ pending |
| 49-02-02 | 02 | 1 | DEBT-03 | — | Cooldown check at store level | unit | `grep "handleChangedAt" src/stores/authStore.ts` | ❌ W0 | ⬜ pending |
| 49-03-01 | 03 | 1 | DEBT-04 | — | Zero `never` type errors | typecheck | `npx tsc --noEmit 2>&1 \| grep -c never` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RLS policy blocks private columns from other sessions | DEBT-01 | Requires authenticated Supabase session | Query profiles table as non-owner user, verify only id/handle/display_name/avatar_url returned |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
