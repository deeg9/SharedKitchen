# v8.0 Social Recipes — Requirements

## Identity

- [x] **IDEN-01**: User can set a unique @handle during signup that is validated for uniqueness and format
- [x] **IDEN-02**: Existing users are prompted with a blocking interstitial to set their @handle on first launch after v8.0 update
- [x] **IDEN-03**: User can search for other users by @handle across the app
- [x] **IDEN-04**: @handle is displayed on all user-generated content (recipes, comments, cook logs, feed posts)

## Attribution

- [x] **ATTR-01**: Recipe detail page shows "Created by @handle" with creator's avatar below the recipe name
- [x] **ATTR-02**: Only the recipe creator can edit the recipe (name, ingredients, instructions, image)
- [x] **ATTR-03**: Non-creator household members can rate, comment, favorite, and save but not edit
- [x] **ATTR-04**: Recipes with no creator (legacy data) are assigned to the household admin during migration

## Cook Log

- [x] **COOK-01**: User can tap "I Cooked This" on recipe detail to log a cook with optional photo and note
- [x] **COOK-02**: After completing cooking mode, user is prompted with a sheet to log the cook with photo + note
- [x] **COOK-03**: After a meal plan date passes, user is prompted to log whether they cooked the planned recipe
- [x] **COOK-04**: Recipe detail shows "Cooked N times" badge with count from cook logs
- [x] **COOK-05**: Recipe detail shows a photo gallery of past cooks with cook date and @handle of who cooked
- [x] **COOK-06**: Cook log photos are stored in Supabase Storage with compression

## Comments

- [x] **CMNT-01**: User can add a comment on any recipe visible to them
- [x] **CMNT-02**: Recipe comments support one level of threading (replies to top-level comments)
- [x] **CMNT-03**: Comments are visible to household members and followers of the kitchen that owns the recipe
- [x] **CMNT-04**: Comment author can delete their own comment
- [ ] **CMNT-05**: Comments are visually distinct from existing private recipe notes

## Feed Integration

- [ ] **FEED-01**: When a user logs a cook, a feed post is automatically created with the cook photo
- [ ] **FEED-02**: Feed posts from cook logs show recipe name, cook's @handle, photo, and optional note
- [ ] **FEED-03**: Existing feed interactions (like, comment, save recipe) work on cook log feed posts

## Save to Collection

- [ ] **SAVE-01**: User can save any recipe from the feed or another kitchen's profile to their own recipe library
- [ ] **SAVE-02**: Saved recipes show "Saved from @handle's kitchen" attribution on recipe detail

## Future Requirements (Deferred)

- Version history — track recipe edits with timestamps and diffs (v8.1)
- Recipe forking/remixing — copy and modify someone's recipe as a linked variant (deferred indefinitely)

## Out of Scope

- Public recipe marketplace — recipes are shared via follow-based feed, not a public directory
- Recipe monetization — no paid recipe access or tipping
- DMs between kitchens — social interaction stays on recipes and feed
- Competitive gamification (leaderboards, rankings) — badges should be personal, not competitive
- Deep comment threading (>1 level) — poor mobile UX, flat/shallow is the sweet spot

## Traceability

| Requirement | Phase | Plan |
|-------------|-------|------|
| IDEN-01 | Phase 44 | — |
| IDEN-02 | Phase 44 | — |
| IDEN-03 | Phase 45 | — |
| IDEN-04 | Phase 44 | — |
| ATTR-01 | Phase 45 | — |
| ATTR-02 | Phase 45 | — |
| ATTR-03 | Phase 45 | — |
| ATTR-04 | Phase 45 | — |
| COOK-01 | Phase 46 | — |
| COOK-02 | Phase 46 | — |
| COOK-03 | Phase 46 | — |
| COOK-04 | Phase 46 | — |
| COOK-05 | Phase 46 | — |
| COOK-06 | Phase 46 | — |
| CMNT-01 | Phase 47 | — |
| CMNT-02 | Phase 47 | — |
| CMNT-03 | Phase 47 | — |
| CMNT-04 | Phase 47 | — |
| CMNT-05 | Phase 47 | — |
| FEED-01 | Phase 48 | — |
| FEED-02 | Phase 48 | — |
| FEED-03 | Phase 48 | — |
| SAVE-01 | Phase 48 | — |
| SAVE-02 | Phase 48 | — |
