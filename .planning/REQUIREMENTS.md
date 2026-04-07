# Requirements: SharedKitchen

**Defined:** 2026-04-07
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time

## v5.0 Requirements

Requirements for Social Feed milestone. Each maps to roadmap phases.

### Kitchen Identity

- [x] **KITC-01**: User can view a kitchen's public profile (name, avatar, bio, recipe count, follower/following counts)
- [x] **KITC-02**: User can search for kitchens by name to discover and follow
- [x] **KITC-03**: User can share an invite link that lets someone follow their kitchen

### Follow System

- [ ] **FOLL-01**: User can follow/unfollow another kitchen (asymmetric, kitchen-to-kitchen)
- [ ] **FOLL-02**: User can view their following list and followers list
- [x] **FOLL-03**: Follower/following counts display on kitchen profile

### Feed

- [ ] **FEED-01**: Meals added to plan auto-post to followers' feed (zero-friction content creation)
- [ ] **FEED-02**: User can scroll a chronological feed of meals from followed kitchens on the Plan tab
- [ ] **FEED-03**: Feed cards show kitchen avatar + name, meal name, day/slot context, recipe photo, timestamp
- [ ] **FEED-04**: User can attach meal photos to feed posts (leveraging v4.0 camera infrastructure)
- [ ] **FEED-05**: Feed supports infinite scroll with cursor-based pagination

### Interactions

- [ ] **INTR-01**: User can like (heart) a feed item with optimistic UI and like count
- [ ] **INTR-02**: User can comment on a feed item (flat comments, no threading)
- [ ] **INTR-03**: User can save a recipe from the feed to their own library (with "Saved from Kitchen X" provenance)
- [ ] **INTR-04**: User can "Cook This Too" — save recipe + add to own meal plan in one tap via day/slot picker

### Notifications

- [ ] **NOTF-01**: User receives push notification when someone follows their kitchen
- [ ] **NOTF-02**: User receives push notification when someone likes their feed item
- [ ] **NOTF-03**: User receives push notification when someone comments on their feed item

### Moderation

- [ ] **MODR-01**: User can report a feed item or comment for inappropriate content
- [ ] **MODR-02**: User can block a kitchen (hides all their content from feed)

## Future Requirements

Deferred to v5.x or later. Tracked but not in current roadmap.

### Feed Enhancements

- **FEED-06**: "New since last visit" divider in feed for catch-up UX
- **FEED-07**: Kitchen-level default share setting (always share / always ask / never share)
- **FEED-08**: Per-meal share toggle to control individual meal visibility

### Social Enhancements

- **SOCL-01**: Suggested kitchens based on mutual follows
- **SOCL-02**: 2-3 cooking-specific reactions beyond heart (fire, drooling, chef-kiss)
- **SOCL-03**: Weekly "What's everyone eating" digest notification

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Threaded/nested comments | Massive complexity, cooking apps not discussion platforms. Cookpad keeps comments flat. |
| Public global feed / explore tab | Cold-start problem, moderation burden. Follow-based only. |
| Algorithmic/ranked feed | Unnecessary at SharedKitchen's scale. Chronological is predictable and fair. |
| Direct messaging between kitchens | Massive undertaking (real-time, read receipts, moderation). Use external messaging. |
| User-level follows (follow people, not kitchens) | Contradicts household-first model. Kitchen-to-kitchen maintains consistency. |
| Stories / ephemeral content | Antithetical to meal planning. Meals are persistent and reference-worthy. |
| Recipe ratings on feed items | Conflates social signal with quality signal. Ratings stay on recipe detail. |
| Emoji reactions (multiple types) | Decision fatigue, UI complexity. Single heart is sufficient for v5.0. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| KITC-01 | Phase 30 | Complete |
| KITC-02 | Phase 30 | Complete |
| KITC-03 | Phase 30 | Complete |
| FOLL-01 | Phase 31 | Pending |
| FOLL-02 | Phase 31 | Pending |
| FOLL-03 | Phase 30 | Complete |
| FEED-01 | Phase 32 | Pending |
| FEED-02 | Phase 32 | Pending |
| FEED-03 | Phase 32 | Pending |
| FEED-04 | Phase 32 | Pending |
| FEED-05 | Phase 32 | Pending |
| INTR-01 | Phase 33 | Pending |
| INTR-02 | Phase 33 | Pending |
| INTR-03 | Phase 33 | Pending |
| INTR-04 | Phase 33 | Pending |
| NOTF-01 | Phase 34 | Pending |
| NOTF-02 | Phase 34 | Pending |
| NOTF-03 | Phase 34 | Pending |
| MODR-01 | Phase 33 | Pending |
| MODR-02 | Phase 33 | Pending |

**Coverage:**
- v5.0 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-06 after roadmap creation*
