# v9.0 Cooking Experience — Requirements

## Cooking Mode Redesign

- [ ] **COOK-R01**: Cooking mode displays the recipe hero image at the top of each step
- [ ] **COOK-R02**: Each step shows a category tag (MARINATING, GRILLING, SIMMERING, etc.) derived from step content
- [ ] **COOK-R03**: Each step shows only the ingredients relevant to that step, not the full ingredient list
- [ ] **COOK-R04**: Cooking mode has a segmented progress bar showing current step position
- [ ] **COOK-R05**: Bottom navigation shows Previous / Ingredients / Next Step buttons
- [ ] **COOK-R06**: Metric/Imperial toggle at the top converts ingredient amounts between measurement systems

## Comment Photo Attachments

- [ ] **CMNT-P01**: Comment input bar includes a camera/media icon button for attaching a photo
- [ ] **CMNT-P02**: Attached photos display as thumbnails within the comment body
- [ ] **CMNT-P03**: Tapping a comment photo thumbnail expands it to full-size view
- [ ] **CMNT-P04**: Comment photos are compressed and stored in Supabase Storage

## Co-Cook Tagging

- [ ] **COCOOK-01**: Cook log sheet includes a "Who did you cook with?" field for tagging @handles
- [ ] **COCOOK-02**: Tagged co-cooks appear on the cook log feed post
- [ ] **COCOOK-03**: Co-cook tags are stored in a cook_log_participants table linking cook_logs to user profiles

## Tech Debt Cleanup

- [ ] **DEBT-01**: Profiles RLS SELECT policy scoped to only expose handle, display_name, avatar_url (not all columns)
- [ ] **DEBT-02**: Reserved word validation enforced in authStore.updateHandle (not just UI-only)
- [ ] **DEBT-03**: 30-day handle change cooldown enforced in authStore.updateHandle (not just UI-only)
- [ ] **DEBT-04**: TypeScript type safety — regenerate database.ts or fix manual type definitions to eliminate `never` inference errors

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COOK-R01 | Phase 50 | Pending |
| COOK-R02 | Phase 50 | Pending |
| COOK-R03 | Phase 50 | Pending |
| COOK-R04 | Phase 50 | Pending |
| COOK-R05 | Phase 50 | Pending |
| COOK-R06 | Phase 50 | Pending |
| CMNT-P01 | Phase 51 | Pending |
| CMNT-P02 | Phase 51 | Pending |
| CMNT-P03 | Phase 51 | Pending |
| CMNT-P04 | Phase 51 | Pending |
| COCOOK-01 | Phase 52 | Pending |
| COCOOK-02 | Phase 52 | Pending |
| COCOOK-03 | Phase 52 | Pending |
| DEBT-01 | Phase 49 | Pending |
| DEBT-02 | Phase 49 | Pending |
| DEBT-03 | Phase 49 | Pending |
| DEBT-04 | Phase 49 | Pending |
