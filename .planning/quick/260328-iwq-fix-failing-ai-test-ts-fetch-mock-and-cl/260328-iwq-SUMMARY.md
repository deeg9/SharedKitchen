---
phase: quick
plan: 260328-iwq
subsystem: testing
tags: [jest, fetch-mock, test-fix, worktree]
dependency_graph:
  requires: []
  provides: [green-ai-tests, worktree-test-exclusion]
  affects: [tests/lib/ai.test.ts, jest.config.js]
tech_stack:
  patterns: [global-fetch-mock, jest-testPathIgnorePatterns]
key_files:
  modified:
    - tests/lib/ai.test.ts
    - jest.config.js
decisions:
  - Used global.fetch mock instead of supabase.functions.invoke to match refactored parseRecipeUrl
  - Added testPathIgnorePatterns with <rootDir>/.claude/worktrees/ to prevent duplicate test discovery
metrics:
  duration: 116s
  completed: 2026-03-28
  tasks: 2
  files: 2
---

# Quick Task 260328-iwq: Fix Failing ai.test.ts Fetch Mock and Worktree Duplicates

Rewrote parseRecipeUrl tests to mock global fetch (JSON-LD fast path + edge function fallback) and excluded .claude/worktrees/ from Jest test discovery.

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Add testPathIgnorePatterns to jest.config.js | 79585d7 | Done |
| 2 | Rewrite parseRecipeUrl tests to mock global fetch | 1db6aa5 | Done |

## Changes Made

### Task 1: Jest Config - Worktree Exclusion
- Added `testPathIgnorePatterns` array to `jest.config.js`
- Excludes `/node_modules/` and `<rootDir>/.claude/worktrees/` from test discovery
- Prevents 5 worktree copies of the entire test suite from inflating test counts

### Task 2: Rewrite parseRecipeUrl Tests
- Replaced `supabase.functions.invoke` mock with `global.fetch` mock
- Test 1: Verifies fetch is called with URL and User-Agent header
- Test 2: Verifies JSON-LD extraction returns structured recipe data (name, ingredients, instructions)
- Test 3: Verifies fetch failure throws user-friendly error message
- Test 4: Verifies edge function fallback when no JSON-LD found (mocks sequential fetch calls + auth session)
- All 4 tests pass green

## Deviations from Plan

None - plan executed exactly as written.

## Verification

```
PASS tests/lib/ai.test.ts
  ai > parseRecipeUrl
    ✓ calls fetch with the provided URL
    ✓ returns structured recipe data from JSON-LD
    ✓ throws on fetch failure
    ✓ falls back to edge function when no JSON-LD found

Tests: 4 passed, 4 total
```

## Known Stubs

None.
