# Requirements: SharedKitchen v2.3 — Kitchen Switching

**Defined:** 2026-03-26
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time
**Goal:** Users can belong to multiple kitchens and switch between them, with all app data scoping to the active kitchen

## v2.3 Requirements

### Kitchen Switcher UI

- [ ] **KITCHEN-01**: Profile page shows a dropdown of all kitchens the user belongs to with the active one highlighted
- [ ] **KITCHEN-02**: User can tap a kitchen in the dropdown to switch — active kitchen persists across app sessions
- [ ] **KITCHEN-03**: Profile page has a "Create Kitchen" button that opens a flow to name and create a new kitchen
- [ ] **KITCHEN-04**: Profile page has a "Join Kitchen" button that accepts an invite code to join an existing kitchen

### Data Scoping

- [ ] **SCOPE-01**: Plan tab shows only meal plans for the active kitchen's household_id
- [ ] **SCOPE-02**: Recipes tab shows only recipes belonging to the active kitchen
- [ ] **SCOPE-03**: Grocery tab shows only grocery lists/items for the active kitchen
- [ ] **SCOPE-04**: Budget tab shows only expenses and budget settings for the active kitchen
- [ ] **SCOPE-05**: All Zustand stores re-fetch data when active kitchen changes

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KITCHEN-01 | — | Pending |
| KITCHEN-02 | — | Pending |
| KITCHEN-03 | — | Pending |
| KITCHEN-04 | — | Pending |
| SCOPE-01 | — | Pending |
| SCOPE-02 | — | Pending |
| SCOPE-03 | — | Pending |
| SCOPE-04 | — | Pending |
| SCOPE-05 | — | Pending |

**Coverage:**
- v2.3 requirements: 9 total
- Mapped to phases: 0
- Unmapped: 9

## Out of Scope

| Feature | Reason |
|---------|--------|
| Kitchen-level permissions (admin vs member roles) | Already exists in household_members table |
| Kitchen settings (notification prefs per kitchen) | Future enhancement |
| Transfer kitchen ownership | Edge case, defer |
| Kitchen deletion | Risky, defer to v3.0 |

---
*Requirements defined: 2026-03-26*
