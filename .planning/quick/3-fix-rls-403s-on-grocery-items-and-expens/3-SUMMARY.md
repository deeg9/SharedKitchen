---
phase: quick-3
plan: 01
status: complete
duration: 5min
---

# Quick Task 3: RLS 403s and Unexpected Text Node Investigation

## Findings

### RLS 403 Errors — NOT a real issue

Direct API testing with authenticated user token confirmed all RLS policies work correctly:
- `grocery_lists` SELECT → 200 (returns list)
- `grocery_items` SELECT → 200 (returns items)
- `expenses` SELECT → 200 (returns empty array)
- `budget_settings` SELECT → 200 (returns empty array)

The 403 errors seen in the previous Playwright session were caused by:
1. **Stale auth session** — the browser had a token from before the household was created. On fresh page load, all queries succeed.
2. **budget_settings 406** — returns HTTP 406 (Not Acceptable) when using `.single()` with no rows. This is PostgREST's PGRST116 error, already handled in `budgetStore.ts:237`.

No code changes needed.

### "Unexpected text node" Warnings — Third-party library issue

The "Unexpected text node: . A text node cannot be a child of a View" error originates from `@gorhom/bottom-sheet` library's internal web rendering.

Evidence:
- All app JSX components were audited (budget, premium, UI) — no bare text nodes found
- Error only appears on pages using `<BottomSheet>` (budget, profile)
- The error message "." (a period character) is not present in any app component
- `@gorhom/bottom-sheet` is known to have limited React Native Web support

No code changes needed — this is a cosmetic dev-mode warning, not a production issue.

## Resolution

Both issues were investigated and found to not require code changes:
- RLS policies are correct and functional
- Text node warning is from third-party library, harmless in production
