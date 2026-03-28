---
phase: quick
plan: 260328-iwq
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/lib/ai.test.ts
  - jest.config.js
autonomous: true
must_haves:
  truths:
    - "All ai.test.ts tests pass (0 failures)"
    - "Jest only discovers tests in the project root tests/ directory, not .claude/worktrees/"
    - "npx jest --listTests shows no duplicate test files from worktrees"
  artifacts:
    - path: "tests/lib/ai.test.ts"
      provides: "Updated parseRecipeUrl tests that mock global fetch"
    - path: "jest.config.js"
      provides: "testPathIgnorePatterns excluding .claude/worktrees"
  key_links:
    - from: "tests/lib/ai.test.ts"
      to: "src/lib/ai.ts"
      via: "parseRecipeUrl uses global fetch() then extractJsonLd or edge function"
      pattern: "global.fetch"
---

<objective>
Fix 2 failing ai.test.ts parseRecipeUrl tests and stop Jest from discovering duplicate tests in .claude/worktrees/.

Purpose: The parseRecipeUrl function was refactored to use global fetch() (for JSON-LD extraction + edge function fallback) instead of supabase.functions.invoke. The tests still mock supabase.functions.invoke, so the real fetch() call fails. Additionally, 5 worktree copies of the entire test suite inflate test counts.

Output: Green test suite, correct test count.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@tests/lib/ai.test.ts
@src/lib/ai.ts
@jest.config.js

<interfaces>
From src/lib/ai.ts:
```typescript
export async function parseRecipeUrl(
  url: string
): Promise<Omit<RecipeInsert, 'household_id' | 'created_by'>>
```
The function:
1. Calls `fetch(url)` to get HTML
2. Tries `extractJsonLd(html, url)` — if successful, returns immediately
3. Falls back to `fetch(supabaseUrl/functions/v1/parse-recipe-url)` with cleaned HTML
4. Validates response shape (name: string, ingredients: array)

The mock supabase is still needed for `supabase.auth.getSession()` (line 237) in the edge-function fallback path.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add testPathIgnorePatterns to jest.config.js to exclude worktree duplicates</name>
  <files>jest.config.js</files>
  <action>
Add `testPathIgnorePatterns` to jest.config.js to exclude `.claude/worktrees/` from test discovery:

```js
testPathIgnorePatterns: [
  '/node_modules/',
  '<rootDir>/.claude/worktrees/',
],
```

This prevents Jest from finding and running duplicate copies of every test file that exist in the 5 agent worktree directories.
  </action>
  <verify>
    <automated>cd /Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen && npx jest --listTests 2>/dev/null | grep -c "\.claude/worktrees/" | xargs -I{} test {} -eq 0</automated>
  </verify>
  <done>npx jest --listTests shows zero files from .claude/worktrees/</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite parseRecipeUrl tests to mock global fetch instead of supabase.functions.invoke</name>
  <files>tests/lib/ai.test.ts</files>
  <action>
The parseRecipeUrl function now calls global `fetch()` twice:
1. First fetch: GET the recipe URL to retrieve HTML
2. If JSON-LD extraction fails: POST to supabase edge function with cleaned HTML

The current tests mock `supabase.functions.invoke` which is no longer used by parseRecipeUrl.

Rewrite the 4 parseRecipeUrl tests:

**Test setup changes:**
- Add `global.fetch = jest.fn()` mock (or use `jest.spyOn(global, 'fetch')`)
- Keep the supabase mock (needed for `supabase.auth.getSession()` in the edge function fallback path)
- Mock `supabase.auth.getSession` to return a fake session with access_token
- Set `process.env.EXPO_PUBLIC_SUPABASE_URL` and `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY` for the edge function URL construction

**Test 1 — "calls fetch with the provided URL":**
- Mock fetch to return HTML with valid JSON-LD containing a Recipe schema (so it takes the fast path and doesn't hit the edge function)
- Call `parseRecipeUrl('https://example.com/recipe')`
- Assert `fetch` was called with `'https://example.com/recipe'` and correct User-Agent header

**Test 2 — "returns structured recipe data from JSON-LD":**
- Mock fetch to return HTML with a JSON-LD `<script type="application/ld+json">` block containing a Recipe with name, recipeIngredient array, and recipeInstructions array
- Call `parseRecipeUrl('https://example.com/recipe')`
- Assert result has correct name, ingredients array with length, instructions array with length

**Test 3 — "throws on fetch failure":**
- Mock fetch to reject/throw
- Assert `parseRecipeUrl('https://example.com/bad')` rejects with "Failed to fetch the recipe page"

**Test 4 — "falls back to edge function when no JSON-LD found":**
- First fetch call: return HTML with NO JSON-LD script tags (just plain `<html><body>Hello</body></html>`)
- Second fetch call: return a JSON response with recipe data `{ name: 'Test', ingredients: [...], instructions: [...] }` and `ok: true`, with headers containing content-type: application/json
- Mock `supabase.auth.getSession` to return `{ data: { session: { access_token: 'test-token' } } }`
- Assert result has the recipe data from the edge function response

Use `(global.fetch as jest.Mock).mockImplementation()` or `.mockResolvedValueOnce()` chaining to handle sequential fetch calls in test 4.

Keep the existing buildMealPrompt and parseMealSuggestions tests unchanged (they are in separate describe blocks if present, or are in other test files).
  </action>
  <verify>
    <automated>cd /Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen && npx jest tests/lib/ai.test.ts --no-coverage 2>&1 | tail -5</automated>
  </verify>
  <done>All 4 parseRecipeUrl tests pass. Zero test failures in ai.test.ts. Total test suites discovered by Jest does not include worktree duplicates.</done>
</task>

</tasks>

<verification>
Run the full ai.test.ts suite and confirm all tests pass:
```bash
npx jest tests/lib/ai.test.ts --no-coverage --verbose
```

Run all tests to confirm worktree exclusion works and no regressions:
```bash
npx jest --no-coverage 2>&1 | tail -3
```
</verification>

<success_criteria>
- All ai.test.ts tests pass (4 parseRecipeUrl tests green)
- Jest discovers only root-level test files (0 from .claude/worktrees/)
- No other test regressions introduced
</success_criteria>

<output>
After completion, create `.planning/quick/260328-iwq-fix-failing-ai-test-ts-fetch-mock-and-cl/260328-iwq-SUMMARY.md`
</output>
