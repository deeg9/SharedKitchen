# Requirements: SharedKitchen

**Defined:** 2026-04-09
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time

## v6.0 Requirements

Requirements for Food Data Integration milestone. Each maps to roadmap phases.

### Data Foundation

- [ ] **DATA-01**: App stores nutrition data in canonical numeric format (calories, protein, carbs, fat, fiber, sodium per serving and per 100g)
- [ ] **DATA-02**: App converts between food-specific units (cups, tbsp, oz) and grams using density tables
- [ ] **DATA-03**: App caches food data from external APIs in Postgres with full-text search and 30-day TTL

### Food Search

- [ ] **SRCH-01**: User can search foods by name across USDA, FatSecret, and cached data from a single search interface
- [ ] **SRCH-02**: Search results show food name, brand (if applicable), and key nutrition facts (calories, protein, carbs, fat)
- [ ] **SRCH-03**: User can view detailed nutrition breakdown for any search result

### Barcode Scanning

- [ ] **SCAN-01**: User can scan a product barcode using the device camera
- [ ] **SCAN-02**: App looks up scanned barcode via Open Food Facts and FatSecret, displaying product name and nutrition
- [ ] **SCAN-03**: User can add scanned product to pantry/fridge inventory with nutrition data
- [ ] **SCAN-04**: User can add scanned product to grocery list with product details

### Recipe Nutrition

- [ ] **NUTR-01**: App matches recipe ingredients to food database entries using AI-assisted text matching
- [ ] **NUTR-02**: App calculates per-recipe nutrition totals from matched ingredient data
- [ ] **NUTR-03**: User sees a nutrition card (calories, protein, carbs, fat) on recipe detail screen
- [ ] **NUTR-04**: User sees aggregated daily/weekly nutrition totals on the Plan tab for planned meals

## Future Requirements

### AI Enhancement

- **AIEN-01**: Meal generator considers nutrition balance when suggesting meals
- **AIEN-02**: Nutrition-aware grocery list suggestions based on dietary goals
- **AIEN-03**: Household nutrition dashboard with weekly trends

### Premium Features

- **PREM-01**: Detailed micronutrient breakdown (vitamins, minerals) beyond basic macros
- **PREM-02**: Dietary goal setting and progress tracking per household member
- **PREM-03**: Unlimited barcode scans (free tier: N/month)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Calorie counting / food diary | SharedKitchen is meal planning, not diet tracking — anti-feature per research |
| Individual user nutrition tracking | Household-first model; per-person tracking adds complexity without core value |
| Custom food database entries | Users creating food items leads to data quality issues; defer to v7+ |
| Nutrition label OCR from photos | Barcode scanning covers packaged foods; OCR adds complexity for marginal gain |
| Real-time API calls without caching | USDA rate limits (1K/hr global) make cache-first mandatory |
| USDA bulk CSV import | On-demand caching is simpler; bulk import adds migration complexity |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| SRCH-01 | — | Pending |
| SRCH-02 | — | Pending |
| SRCH-03 | — | Pending |
| SCAN-01 | — | Pending |
| SCAN-02 | — | Pending |
| SCAN-03 | — | Pending |
| SCAN-04 | — | Pending |
| NUTR-01 | — | Pending |
| NUTR-02 | — | Pending |
| NUTR-03 | — | Pending |
| NUTR-04 | — | Pending |

**Coverage:**
- v6.0 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
