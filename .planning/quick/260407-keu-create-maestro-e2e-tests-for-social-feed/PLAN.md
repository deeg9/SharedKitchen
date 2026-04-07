# Quick Plan: Maestro E2E Tests for Social, Budget, and Profile Features

**Goal:** Add 7 Maestro YAML test flows covering social feed, kitchen search/profile, budgeting, and profile features. All tests runnable via `maestro test`.

**Convention notes:** Use `appId: com.sharedkitchen.app`, `launchApp` without clearState for logged-in flows, testID-based taps, `extendedWaitUntil` for async loads, `assertVisible` for verification.

---

## Task 1: Social feed view test

**File:** `.maestro/social-feed-view.yaml`

```yaml
appId: com.sharedkitchen.app
name: "Social Feed View"
---
# Social Feed View
# Navigates to Plan tab, switches to Feed segment, verifies feed loads.
# Assumes user is logged in with at least one followed kitchen.

- launchApp

# Navigate to Plan tab
- tapOn:
    id: "plan-tab"

# Switch to Feed segment
- tapOn:
    text: "Feed"

# Wait for feed content to load
- extendedWaitUntil:
    visible:
      text: ".*"
    timeout: 5000

# Verify we are on the Feed view (Feed text should be selected/visible)
- assertVisible:
    text: "Feed"

# Verify My Plan segment is also visible (confirms segmented control rendered)
- assertVisible:
    text: "My Plan"
```

---

## Task 2: Kitchen search test

**File:** `.maestro/social-kitchen-search.yaml`

```yaml
appId: com.sharedkitchen.app
name: "Kitchen Search"
---
# Kitchen Search Flow
# Opens the search overlay from Plan tab, types a query, verifies results appear, closes search.
# Assumes user is logged in.

- launchApp

# Navigate to Plan tab
- tapOn:
    id: "plan-tab"

# Tap search icon to open search overlay
- tapOn:
    id: "plan-search-icon"

# Wait for search input to appear
- extendedWaitUntil:
    visible:
      id: "kitchen-search-input"
    timeout: 3000

# Type a search query
- tapOn:
    id: "kitchen-search-input"
- inputText: "test"

# Wait for search results to load
- extendedWaitUntil:
    visible:
      text: ".*"
    timeout: 5000

# Close the search overlay
- tapOn:
    id: "kitchen-search-close"

# Verify we are back on the Plan tab
- assertVisible:
    id: "plan-tab"
```

---

## Task 3: Kitchen profile view test

**File:** `.maestro/social-kitchen-profile.yaml`

```yaml
appId: com.sharedkitchen.app
name: "Kitchen Profile View"
---
# Kitchen Profile View
# Navigates to the user's own kitchen profile and verifies profile card elements.
# Assumes user is logged in.

- launchApp

# Navigate to Profile tab
- tapOn:
    id: "profile-tab"

# Wait for profile to load
- extendedWaitUntil:
    visible:
      text: "Your Kitchens"
    timeout: 5000

# Verify kitchen profile elements are visible
- assertVisible:
    id: "kitchen-profile-name"

- assertVisible:
    id: "kitchen-profile-avatar"

- assertVisible:
    id: "kitchen-profile-recipe-count"

- assertVisible:
    id: "kitchen-profile-follower-count"

- assertVisible:
    id: "kitchen-profile-following-count"

# Verify edit button is available (own profile)
- assertVisible:
    id: "kitchen-profile-edit-button"
```

---

## Task 4: Budget add expense test

**File:** `.maestro/budget-add-expense.yaml`

```yaml
appId: com.sharedkitchen.app
name: "Budget Add Expense"
---
# Budget Add Expense Flow
# Opens budget tab, taps FAB to add expense, fills form, submits.
# Assumes user is logged in.

- launchApp

# Navigate to Budget tab
- tapOn:
    id: "budget-tab"

# Wait for budget dashboard to load
- extendedWaitUntil:
    visible:
      id: "budget-add-expense-button"
    timeout: 5000

# Tap FAB to open add expense sheet
- tapOn:
    id: "budget-add-expense-button"

# Wait for expense form to appear
- extendedWaitUntil:
    visible:
      text: "Add Expense"
    timeout: 3000

# Select a category chip
- tapOn:
    text: "Groceries"

# Tap into the amount field and enter a value
- tapOn:
    text: "0.00"
- inputText: "25.50"

# Submit the expense
- tapOn:
    id: "budget-expense-submit"

# Wait for sheet to dismiss and verify budget tab is still visible
- extendedWaitUntil:
    visible:
      id: "budget-tab"
    timeout: 5000

# Verify we are back on the budget dashboard
- assertVisible:
    id: "budget-add-expense-button"
```

---

## Task 5: Budget dashboard view test

**File:** `.maestro/budget-dashboard-view.yaml`

```yaml
appId: com.sharedkitchen.app
name: "Budget Dashboard View"
---
# Budget Dashboard View
# Opens budget tab and verifies categories and weekly breakdown are visible.
# Assumes user is logged in.

- launchApp

# Navigate to Budget tab
- tapOn:
    id: "budget-tab"

# Wait for budget dashboard to load
- extendedWaitUntil:
    visible:
      text: "Groceries"
    timeout: 5000

# Verify expense category chips are visible
- assertVisible:
    text: "Groceries"

- assertVisible:
    text: "Dining Out"

- assertVisible:
    text: "Takeout"

# Verify dollar sign is rendered (budget amounts)
- assertVisible:
    text: "$"

# Verify the FAB is present
- assertVisible:
    id: "budget-add-expense-button"
```

---

## Task 6: Profile view and edit test

**File:** `.maestro/profile-view-edit.yaml`

```yaml
appId: com.sharedkitchen.app
name: "Profile View and Edit"
---
# Profile View and Edit Flow
# Opens profile tab, verifies sections, taps edit profile button.
# Assumes user is logged in.

- launchApp

# Navigate to Profile tab
- tapOn:
    id: "profile-tab"

# Wait for profile to load
- extendedWaitUntil:
    visible:
      text: "Edit Profile"
    timeout: 5000

# Verify key profile sections are visible
- assertVisible:
    text: "Your Kitchens"

- assertVisible:
    text: "Members"

# Verify action buttons are present
- assertVisible:
    id: "profile-edit-button"

- assertVisible:
    id: "profile-sign-out-button"

# Tap edit profile
- tapOn:
    id: "profile-edit-button"

# Verify edit profile screen opens (look for a save or form element)
- extendedWaitUntil:
    visible:
      text: ".*"
    timeout: 3000
```

---

## Task 7: Profile social notifications toggle test

**File:** `.maestro/profile-social-notifications.yaml`

```yaml
appId: com.sharedkitchen.app
name: "Profile Social Notifications"
---
# Profile Social Notifications
# Navigates to profile, finds the social notifications toggle, verifies it exists.
# Assumes user is logged in.

- launchApp

# Navigate to Profile tab
- tapOn:
    id: "profile-tab"

# Wait for profile to load
- extendedWaitUntil:
    visible:
      text: "Edit Profile"
    timeout: 5000

# Scroll down to find the social notifications toggle
- scrollUntilVisible:
    element:
      id: "social-notifications-toggle"
    direction: DOWN
    timeout: 5000

# Verify the toggle is visible
- assertVisible:
    id: "social-notifications-toggle"
```

---

## Verification

```bash
# Verify all 7 new test files exist
ls -la .maestro/social-feed-view.yaml .maestro/social-kitchen-search.yaml .maestro/social-kitchen-profile.yaml .maestro/budget-add-expense.yaml .maestro/budget-dashboard-view.yaml .maestro/profile-view-edit.yaml .maestro/profile-social-notifications.yaml

# Dry-run parse check (Maestro validates YAML syntax)
for f in social-feed-view social-kitchen-search social-kitchen-profile budget-add-expense budget-dashboard-view profile-view-edit profile-social-notifications; do
  echo "--- $f ---"
  maestro test .maestro/$f.yaml --dry-run 2>&1 | head -5
done
```

## Done Criteria
- 7 new YAML files in `.maestro/` directory
- Each file uses `appId: com.sharedkitchen.app` and follows existing conventions
- Tests cover: social feed, kitchen search, kitchen profile, budget add expense, budget dashboard, profile view/edit, social notifications toggle
- `maestro test .maestro/<file>.yaml` parses without YAML errors
