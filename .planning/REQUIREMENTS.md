# Requirements: SharedKitchen v2.2 — UI Polish & Bug Fixes

**Defined:** 2026-03-26
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time
**Goal:** Fix visual bugs, layout issues, and broken features discovered during device testing

## v2.2 Requirements

### Auth UI

- [x] **AUTH-01**: Sign-in screen displays app logo above "SharedKitchen" title with polished visual design

### Layout & Safe Areas

- [ ] **LAYOUT-01**: All bottom sheets and modals respect safe area insets — X button and header never hidden behind status bar
- [ ] **LAYOUT-02**: Profile screen content anchored below status bar — no scrolling behind clock/WiFi/battery
- [x] **LAYOUT-03**: Recipe detail bottom buttons (Start Cooking, Add to Plan) properly sized and spaced with no overlap
- [x] **LAYOUT-04**: Recipe detail removes white card overlay on food image — content starts below the image

### Edge Functions

- [ ] **EDGE-01**: generate-meal edge function returns 200 with valid meal suggestions

### Recipes UI

- [x] **RECIPE-01**: Filter bar (Category/Cost/Time) does not bleed through "What should we cook" popup — proper z-index layering

### Profile & Settings

- [ ] **SETTINGS-01**: Dark Mode toggle and App Settings section removed from profile screen
- [ ] **SETTINGS-02**: Dietary restrictions replaced with searchable input instead of static chip list
- [ ] **SETTINGS-03**: Household management area redesigned for better usability

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 14 | Complete |
| LAYOUT-01 | Phase 13 | Pending |
| LAYOUT-02 | Phase 13 | Pending |
| LAYOUT-03 | Phase 13 | Complete |
| LAYOUT-04 | Phase 13 | Complete |
| EDGE-01 | Phase 14 | Pending |
| RECIPE-01 | Phase 13 | Complete |
| SETTINGS-01 | Phase 15 | Pending |
| SETTINGS-02 | Phase 15 | Pending |
| SETTINGS-03 | Phase 15 | Pending |

**Coverage:**
- v2.2 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark mode implementation | Removed entirely — toggle broken, not worth fixing now |
| New feature development | Polish-only milestone |
| Android-specific fixes | iOS-first remains |
| Premium analytics dashboard | Deferred to v3.0 |

---
*Requirements defined: 2026-03-26*
