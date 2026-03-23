---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/2-create-and-run-playwright-mcp-end-to-end/2-SUMMARY.md
autonomous: true
requirements: [E2E-TABS]
must_haves:
  truths:
    - "Recipes tab loads and displays recipe cards"
    - "Grocery tab loads and shows grocery list items"
    - "Budget tab loads and shows budget tracking UI"
    - "Profile tab loads and shows user profile info"
    - "Recipe detail page is accessible from recipes list"
    - "Edit profile page is accessible from profile tab"
    - "All screenshots captured and results documented"
  artifacts:
    - path: ".planning/quick/2-create-and-run-playwright-mcp-end-to-end/2-SUMMARY.md"
      provides: "Test results documentation with pass/fail for each flow"
---

<objective>
Run interactive Playwright MCP end-to-end tests across all remaining SharedKitchen tabs and sub-pages.

Purpose: Verify that the Recipes, Grocery, Budget, and Profile tabs plus sub-pages (recipe detail, edit profile, leftovers, subscription) render correctly and are interactive after login. The Plan tab and onboarding were already tested.

Output: Screenshots of each screen and a SUMMARY.md documenting pass/fail results for each tested flow.
</objective>

<execution_context>
@/Users/deeg/.claude/get-shit-done/workflows/execute-plan.md
@/Users/deeg/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Login and test Recipes + Grocery tabs</name>
  <files>.planning/quick/2-create-and-run-playwright-mcp-end-to-end/2-SUMMARY.md</files>
  <action>
Use Playwright MCP tools to run end-to-end tests. The app is at http://localhost:8081.

STEP 1 - Login:
- Navigate to http://localhost:8081
- Take a snapshot to see the current state
- If on sign-in page, fill email field with "buyer@example.com" and password with "***REMOVED***"
- Click the sign-in button
- Wait for navigation to complete, take snapshot to confirm logged in

STEP 2 - Recipes Tab:
- Click the "Recipes" tab in bottom navigation
- Take a snapshot to verify recipe list loads
- Take a screenshot for visual record
- Verify recipe cards are visible (should show recipes from seed data or user-added)
- Click on the first recipe card to navigate to recipe detail page
- Take a snapshot of the recipe detail page (should show ingredients, instructions)
- Take a screenshot of recipe detail
- Navigate back to recipes list

STEP 3 - Grocery Tab:
- Click the "Grocery" tab in bottom navigation
- Take a snapshot to verify grocery list loads
- Take a screenshot for visual record
- Look for grocery list items, categories/sections, checkboxes
- If there is an "Add" button, click it to verify the add item sheet opens
- Take a snapshot of the add item UI
- Dismiss/close the add item sheet if opened
- Take a screenshot of final grocery state

Record results: For each screen visited, note whether it loaded successfully, what content was visible, and any errors encountered.
  </action>
  <verify>
    <automated>echo "Task 1 verified by screenshot evidence and snapshot content during execution"</automated>
  </verify>
  <done>Recipes tab shows recipe list, recipe detail page is accessible, Grocery tab shows grocery list with sections. Screenshots captured for all screens.</done>
</task>

<task type="auto">
  <name>Task 2: Test Budget + Profile tabs and sub-pages</name>
  <files>.planning/quick/2-create-and-run-playwright-mcp-end-to-end/2-SUMMARY.md</files>
  <action>
Continue from logged-in state (if session expired, re-login using same credentials).

STEP 1 - Budget Tab:
- Click the "Budget" tab in bottom navigation
- Take a snapshot to verify budget tracking UI loads
- Take a screenshot for visual record
- Verify budget elements are visible: spending amounts, category chips (Groceries/Dining Out/Takeout), weekly breakdown
- If there is an "Add Expense" or similar button, click it to verify the add expense flow
- Take a snapshot of any modal/sheet that opens
- Dismiss if needed

STEP 2 - Profile Tab:
- Click the "Profile" tab in bottom navigation
- Take a snapshot to verify profile info loads
- Take a screenshot for visual record
- Verify profile shows: user display name, email, household info, member list
- Look for "Edit Profile" button/link and click it
- Take a snapshot of the edit profile page
- Take a screenshot
- Navigate back to profile

STEP 3 - Sub-pages (if accessible from profile or elsewhere):
- From profile, look for links to Leftovers or Subscription pages
- If a "Premium" or "Subscription" link exists, click it
- Take a snapshot of the subscription/premium page
- Take a screenshot
- Navigate back

STEP 4 - Dark mode toggle (if visible on profile):
- If there is a dark mode / theme toggle on the profile page, tap it
- Take a screenshot to capture the theme change
- Toggle back if needed

Record all results for the summary.
  </action>
  <verify>
    <automated>echo "Task 2 verified by screenshot evidence and snapshot content during execution"</automated>
  </verify>
  <done>Budget tab shows spending UI with categories. Profile tab shows user info with edit capability. Sub-pages (subscription, leftovers) tested if accessible. Screenshots captured for all screens.</done>
</task>

<task type="auto">
  <name>Task 3: Document test results in SUMMARY</name>
  <files>.planning/quick/2-create-and-run-playwright-mcp-end-to-end/2-SUMMARY.md</files>
  <action>
Create the SUMMARY.md documenting all test results from Tasks 1 and 2.

Structure the summary as:

```markdown
---
phase: quick-2
plan: 01
status: complete
duration: Xmin
---

# Quick Task 2: Playwright MCP E2E Test Results

## Test Results

| # | Test Flow | Status | Notes |
|---|-----------|--------|-------|
| 1 | Login | PASS/FAIL | [details] |
| 2 | Recipes Tab - List View | PASS/FAIL | [details] |
| 3 | Recipes Tab - Recipe Detail | PASS/FAIL | [details] |
| 4 | Grocery Tab - List View | PASS/FAIL | [details] |
| 5 | Grocery Tab - Add Item | PASS/FAIL | [details] |
| 6 | Budget Tab - Overview | PASS/FAIL | [details] |
| 7 | Budget Tab - Add Expense | PASS/FAIL | [details] |
| 8 | Profile Tab - View | PASS/FAIL | [details] |
| 9 | Profile - Edit Profile | PASS/FAIL | [details] |
| 10 | Subscription Page | PASS/FAIL | [details] |
| 11 | Dark Mode Toggle | PASS/FAIL | [details] |

## Issues Found

[List any bugs, rendering issues, or broken flows discovered]

## Coverage Summary

Previously tested: Sign-in, Onboarding (6 steps), Plan tab
This session: Recipes, Grocery, Budget, Profile, Edit Profile, Subscription
Remaining untested: [any flows not covered]
```

Fill in actual results from the test execution. Be honest about any failures or issues.
  </action>
  <verify>
    <automated>test -f ".planning/quick/2-create-and-run-playwright-mcp-end-to-end/2-SUMMARY.md" && echo "SUMMARY exists"</automated>
  </verify>
  <done>SUMMARY.md exists with pass/fail results for all tested flows, issues documented, and coverage summary complete.</done>
</task>

</tasks>

<verification>
- All 5 tabs visited and snapshotted (Plan already done previously; Recipes, Grocery, Budget, Profile tested here)
- Recipe detail sub-page tested
- Edit profile sub-page tested
- Subscription page tested if accessible
- SUMMARY.md documents results with pass/fail table
</verification>

<success_criteria>
- Playwright MCP tools used to navigate all 4 remaining tabs
- At least 2 sub-pages tested (recipe detail, edit profile)
- Screenshots taken for every screen visited
- SUMMARY.md created with structured test results
- Any bugs or issues clearly documented
</success_criteria>

<output>
After completion, the summary lives at: `.planning/quick/2-create-and-run-playwright-mcp-end-to-end/2-SUMMARY.md`
</output>
