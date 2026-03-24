---
phase: quick-3
plan: 01
type: investigate
wave: 1
depends_on: []
---

<objective>
Investigate and fix RLS 403 errors on grocery_items and expenses tables, and fix "Unexpected text node" warnings on the budget page.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Investigate RLS 403 errors</name>
  <action>
Test Supabase API directly with authenticated user token to verify RLS policies work.
Check if the errors are from stale auth tokens or actual policy issues.
  </action>
  <done>API calls return 200 — RLS policies are correct. The 403/406 errors were from:
1. Stale auth session in previous browser tab (resolved on page reload)
2. budget_settings returning 406 (PGRST116 - no rows) which is already handled in code
  </done>
</task>

<task type="auto">
  <name>Task 2: Investigate "Unexpected text node" warnings</name>
  <action>
Search all budget-related components for bare text nodes outside Text components.
Check BottomSheet, Card, and premium components.
  </action>
  <done>The "Unexpected text node: ." error originates from @gorhom/bottom-sheet library's internal web rendering, not from app code. This is a known third-party library issue with React Native Web compatibility. No fix needed in app code.</done>
</task>

</tasks>
