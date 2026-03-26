# Requirements: Mise v2.1

**Defined:** 2026-03-25
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time

## v2.1 Requirements

### Recipe Discovery

- [ ] **DISC-01**: FilterBar component committed and rendering in recipes tab with category/cost/time dropdowns
- [ ] **DISC-02**: Manual recipe form includes category picker from standard category list
- [ ] **DISC-03**: Recipe edit form includes category picker to update existing recipes
- [ ] **DISC-04**: AI-imported recipes populate category field from extracted data (already works — verify)
- [ ] **DISC-05**: Filtering by category, cost range, and prep time returns correct results client-side

### Stripe Checkout

- [ ] **PAY-01**: Stripe test env vars documented in .env.example (publishable key, price ID)
- [ ] **PAY-02**: Supabase Edge Function secrets documented for Stripe (secret key, webhook signing secret, price ID)
- [ ] **PAY-03**: Full checkout flow works in test mode: initiate → PaymentSheet → webhook → subscription row created
- [ ] **PAY-04**: Subscription status reflects correctly in app after successful test checkout
- [ ] **PAY-05**: Billing portal opens and allows subscription management in test mode

### Code Quality

- [ ] **QUAL-01**: Client-side console.error calls in stores replaced with proper error handling pattern
- [ ] **QUAL-02**: All `as any` TypeScript casts replaced with proper type definitions
- [ ] **QUAL-03**: Unused imports removed across codebase
- [ ] **QUAL-04**: React error boundary wraps main app layout with user-friendly fallback UI
- [ ] **QUAL-05**: Empty state component shown on grocery screen when no items exist

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side recipe filtering | Client-side sufficient for household-sized recipe collections |
| Premium analytics dashboard | Deferred to v3.0 — separate milestone |
| i18n / string extraction | English-only for now |
| Sentry / error reporting service | Would add value but out of scope for this polish pass |
| Android build | iOS-first remains |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISC-01 | Phase 10 | Pending |
| DISC-02 | Phase 10 | Pending |
| DISC-03 | Phase 10 | Pending |
| DISC-04 | Phase 10 | Pending |
| DISC-05 | Phase 10 | Pending |
| PAY-01 | Phase 11 | Pending |
| PAY-02 | Phase 11 | Pending |
| PAY-03 | Phase 11 | Pending |
| PAY-04 | Phase 11 | Pending |
| PAY-05 | Phase 11 | Pending |
| QUAL-01 | Phase 12 | Pending |
| QUAL-02 | Phase 12 | Pending |
| QUAL-03 | Phase 12 | Pending |
| QUAL-04 | Phase 12 | Pending |
| QUAL-05 | Phase 12 | Pending |

**Coverage:**
- v2.1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after v2.1 milestone init*
