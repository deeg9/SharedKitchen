# Feature Research: Social Meal Feed

**Domain:** Social feed for collaborative cooking/meal planning app
**Researched:** 2026-04-06
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any social feed. Missing these = feed feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Follow/unfollow kitchens | Core social primitive -- without this there is no feed. Cookpad, Whisk, and every social cooking app uses follow-based feeds. | MEDIUM | Needs follow relationship table, discovery UI, follower counts. Use asymmetric follow model (like Instagram/Cookpad) not mutual friend model (like Venmo) -- lower friction for cooking context. |
| Chronological feed of meals from followed kitchens | The feed itself. Venmo shows friend transactions in a scrollable list; translate to "Kitchen X planned Chicken Tikka for Tuesday dinner." Cookpad's home tab is exactly this pattern. | HIGH | Requires feed query joining follows + meal_plan entries + recipes. Pagination critical. Fan-out-on-read (query at read time) is correct for SharedKitchen's scale (dozens of followed kitchens, not millions). |
| Feed card with kitchen name, meal name, recipe photo, and timestamp | Every social feed needs a clear content unit. Venmo's unit is the transaction card; Cookpad's is the recipe card with cooksnap photo. SharedKitchen's unit is the meal card. | MEDIUM | Card shows: kitchen avatar + name, meal name, day/slot context ("Tuesday Dinner"), recipe photo (if available), timestamp. Tap to expand for recipe details. |
| Like/react to meals | Universal social signal. Cookpad, Allrecipes, Pepper, Whisk all have likes. Single-tap heart is table stakes. | LOW | Simple join table (user_id, feed_item_id). Optimistic UI update. Like count displayed on card. |
| Save recipe from feed to own library | Users see a recipe they want and expect to grab it. Yummly's entire UX was built on the "Yum" save button. Cookpad allows saving others' recipes. This is the key value-exchange of a cooking social feed. | MEDIUM | Deep dependency on existing recipe infrastructure. Must clone recipe data (not reference) so saved recipe persists even if source kitchen changes/deletes it. Mark provenance ("Saved from Kitchen X"). |
| Share toggle / privacy control | Users need control over what auto-posts. Venmo lets you set transaction privacy (public/friends/private). Cookpad profiles control public visibility. | LOW | Per-meal toggle: "Share to feed" (default ON with easy toggle off). Kitchen-level default setting in kitchen profile. |
| Kitchen profile (public view) | Followers need to see who they're following. Cookpad profiles show recipe count, follower/following counts, bio. | MEDIUM | Public-facing view of kitchen: name, avatar, member count, bio/description, recipe count, meal streak, follower/following counts. Distinct from existing household settings screen. |
| Comments on feed items | Expected social primitive alongside likes. Cookpad, Whisk, Pepper, Allrecipes all support comments. Venmo has comments on transactions. | MEDIUM | Flat comment list (no threading). Comment row: user avatar, name, text, timestamp. Push notification to feed item author on new comment. |
| Push notifications for social events | Users expect to know when someone follows them, likes their meal, or comments. Standard in every social app. | MEDIUM | New notification types: new_follower, feed_like, feed_comment. Leverage existing expo-notifications + Expo Push API infrastructure. |

### Differentiators (Competitive Advantage)

Features that set SharedKitchen apart from Cookpad/Allrecipes-style social cooking apps.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Household-level social (kitchens follow kitchens, not users follow users) | No cooking app does social at the household level. Cookpad/Whisk are individual-user social. SharedKitchen's core value is collaborative households -- the social unit should be the kitchen, not the person. "The Smith Kitchen is cooking pad thai tonight." This is the Venmo analogy: Venmo shows friend-level activity, SharedKitchen shows kitchen-level activity. | MEDIUM | Follow relationships are kitchen-to-kitchen. Any household member can post/interact on behalf of the kitchen. Avoids individual social pressure. |
| Meal context in feed (day + slot, not just recipe) | Cookpad shows recipes. SharedKitchen shows what people are actually eating and when. "Tuesday Dinner: Chicken Tikka Masala" is more relatable than just a recipe post. Adds planning inspiration: "Oh, they're doing taco Tuesday too." | LOW | Already have meal_plan data with day/slot. Feed query just includes this context. |
| Cooksnap-style meal photos from vision features | Users can photograph their finished meal (already built in v4.0 photo meal logging) and attach it to the feed card. Cookpad's cooksnaps are their highest-engagement feature. SharedKitchen already has the camera + food photo infrastructure. | LOW | Extend existing photo meal logging to optionally attach photo to the shared feed item. Photo stored in Supabase Storage (already used for recipe images). |
| One-tap "Cook This Too" -- add meal to own plan | Go beyond just saving the recipe. When you see a meal in your feed, tap to add it directly to YOUR meal plan for a specific day. No other cooking social app does plan-to-plan inspiration this seamlessly. | MEDIUM | Combines recipe save + meal plan assignment in one flow. Bottom sheet: pick day + slot, recipe gets cloned to library and meal gets created. |
| Auto-post from meal plan (zero-effort content creation) | Unlike Instagram/Cookpad where you have to actively create posts, SharedKitchen auto-generates feed items from meal plan. Venmo does this -- every payment auto-appears in the feed. No content creation friction. | LOW | When a meal is added to plan and share toggle is on, create a feed_item row. No separate "post" action needed. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full comment threads with replies and nested threading | "We need rich discussions like Facebook" | Massive complexity (threading, notification management, moderation). Cooking apps are not discussion platforms. Cookpad keeps comments flat and simple. Allrecipes forums are a ghost town. | Flat comments only (no replies/threading). Keep it lightweight like Venmo -- short reactions, not conversations. |
| Public global feed / explore/discover tab | "Users need to discover new kitchens" | Cold-start problem: empty global feed looks dead. Moderation burden. Content quality varies wildly. Cookpad's global feed works because they have 100M+ users. | Kitchen discovery via invite links, search by name, and "suggested kitchens" based on mutual follows. No public browsing of strangers' meals. |
| Recipe ratings/reviews on feed items | "People should rate recipes they see" | SharedKitchen already has recipe ratings. Adding ratings to feed items conflates "I like that you're cooking this" (social signal) with "this recipe is 3/5 stars" (quality signal). Confusing UX. | Likes on feed items (social approval). Ratings stay on recipe detail screen (quality assessment). Keep the two signals separate. |
| Direct messaging between kitchens | "Followers should be able to chat" | Building a messaging system is a massive undertaking (real-time, read receipts, media, notifications, moderation). PROJECT.md explicitly lists this as out of scope. | Comments on feed items serve as lightweight public communication. Deep conversations happen via existing channels (text, iMessage). |
| Algorithmic / ranked feed | "Show me the best content first" | At SharedKitchen's scale (dozens to hundreds of followed kitchens, not thousands), chronological is fine. Algorithmic feeds require usage data, ML infrastructure, and create filter bubbles. | Chronological reverse-chron feed. Simple, predictable, fair. Add "new since last visit" divider for catch-up. |
| Emoji reactions (multiple reaction types beyond like) | "Let users react with different emojis like Slack" | Multiple reaction types add UI complexity, database complexity, and decision fatigue. For a cooking feed, a heart/like is sufficient social signal. | Single like (heart). If demand emerges post-launch, consider adding 2-3 cooking-specific reactions (fire, drooling, chef-kiss) as a v5.1 enhancement. |
| Stories / ephemeral content | "Add stories like Instagram" | Ephemeral content is antithetical to a meal planning app. Meals are planned, persistent, and reference-worthy. Stories add massive complexity (media pipeline, expiry logic, viewer tracking). | Meal photos persist on feed cards permanently. The feed IS the story of what your followed kitchens are eating. |
| User-level follows (follow individual people) | "I want to follow my friend, not their whole kitchen" | Contradicts SharedKitchen's household-first model. Creates tension when one household member follows someone but the other doesn't. Complicates permissions and feed visibility. | Kitchen-to-kitchen follow. All members of your kitchen see the same feed. Consistent with existing multi-household architecture. |

## Feature Dependencies

```
[Kitchen Profile (public view)]
    └──enables──> [Follow System (kitchen-to-kitchen)]
                       └──enables──> [Kitchen Discovery / Search]
                       └──enables──> [Feed Display (chronological)]
                                          └──requires──> [Auto-post / Share Toggle]
                                          |                    └──requires──> [Feed item data model]
                                          └──enables──> [Like on feed items]
                                          └──enables──> [Comments on feed items]
                                          └──enables──> [Save Recipe from Feed]
                                          |                    └──enables──> [Cook This Too (add to plan)]
                                          └──enables──> [Meal Photo on Feed Card]
                                          └──enables──> [Push Notifications (social)]
```

### Dependency Notes

- **Feed Display requires Follow System:** No feed without knowing who to show content from. Follow system must be built and testable before feed rendering.
- **Follow System requires Kitchen Profile:** Users need to see a kitchen's profile before deciding to follow. Even a minimal profile (name, avatar, recipe count) must exist.
- **Auto-post / Share Toggle required for Feed Display:** Without content being posted to the feed, there is nothing to display. The auto-post mechanism (creating feed_item rows from meal plan entries) must exist before the feed can render.
- **Like/Comment require Feed Display:** Interactions attach to feed items -- need the feed first.
- **Save Recipe requires existing recipe infrastructure:** Recipe cloning must handle all recipe fields (ingredients, steps, nutrition, photos). Existing recipe import pipeline provides a model but save-from-feed is a simpler variant (structured data to structured data, no parsing needed).
- **Cook This Too requires Save Recipe:** Must save the recipe first, then create the meal plan entry. Two-step atomic operation.
- **Push Notifications (social) require Feed Display:** Need feed items and interactions to exist before notifications about them make sense.

## MVP Definition

### Launch With (v5.0)

Minimum to validate social feed concept with real users.

- [ ] Feed item data model (schema for shared meals) -- foundation everything else builds on
- [ ] Kitchen profile public view (name, avatar, bio, recipe count, follower counts) -- needed for follow decisions
- [ ] Kitchen-to-kitchen follow/unfollow with kitchen search/discovery -- core social primitive
- [ ] Auto-post meals from plan to feed with per-meal share toggle -- content creation with zero friction
- [ ] Chronological feed on Plan tab showing meals from followed kitchens -- the feed itself
- [ ] Feed cards: kitchen avatar + name, meal name, day/slot, recipe photo, timestamp -- content unit
- [ ] Like (heart) on feed items with count -- minimum social signal
- [ ] Flat comments on feed items -- lightweight interaction
- [ ] Save recipe from feed to own library -- key value exchange
- [ ] Push notifications for new followers, likes, and comments -- engagement loop

### Add After Validation (v5.x)

Features to add once core feed is working and users are engaged.

- [ ] "Cook This Too" one-tap add-to-plan from feed -- once save-recipe is validated, extend to plan integration
- [ ] Meal photos attached to feed cards (leverage v4.0 camera) -- once users are posting, add visual richness
- [ ] "New since last visit" divider in feed -- once feed has enough content to need catch-up UX
- [ ] Suggested kitchens (based on mutual follows) -- once follow graph has enough edges
- [ ] Kitchen-level default share setting (always share / always ask / never share) -- once users express preference patterns

### Future Consideration (v6+)

- [ ] 2-3 cooking-specific reactions beyond heart (fire, drooling, chef-kiss) -- defer until like engagement data exists
- [ ] Weekly "What's everyone eating" digest notification -- defer until feed has consistent content
- [ ] Kitchen invite from feed ("Invite to your kitchen") -- social feature crossover, complex permissions

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Feed item data model + auto-post | HIGH | MEDIUM | P1 |
| Follow/unfollow kitchens | HIGH | MEDIUM | P1 |
| Kitchen profile (public) | HIGH | MEDIUM | P1 |
| Feed display (chronological) | HIGH | HIGH | P1 |
| Share toggle per meal | MEDIUM | LOW | P1 |
| Feed card design | HIGH | MEDIUM | P1 |
| Like on feed items | HIGH | LOW | P1 |
| Save recipe from feed | HIGH | MEDIUM | P1 |
| Flat comments | MEDIUM | MEDIUM | P1 |
| Push notifications (social) | MEDIUM | MEDIUM | P1 |
| Kitchen discovery / search | MEDIUM | MEDIUM | P1 |
| Meal photos on feed | MEDIUM | LOW | P2 |
| Cook This Too (add to plan) | HIGH | MEDIUM | P2 |
| Suggested kitchens | LOW | MEDIUM | P3 |
| Cooking-specific reactions | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v5.0 launch
- P2: Should have, add in v5.x
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Cookpad | Whisk | Allrecipes | Venmo (model) | SharedKitchen Approach |
|---------|---------|-------|------------|---------------|----------------------|
| Social unit | Individual user | Individual user | Individual user | Individual user (friends) | Kitchen (household) -- unique differentiator |
| Content type | Recipes + cooksnaps | Recipes | Recipes + reviews | Transactions | Meals from plan (recipe + day/slot context) |
| Follow model | Asymmetric (follow) | Asymmetric | N/A (no follow) | Symmetric (friends) | Asymmetric follow (kitchen-to-kitchen) |
| Feed type | Home tab recipe feed | Community feed | No feed (search-based) | Friends-only transaction feed | Friends-only meal feed on Plan tab |
| Content creation | Manual recipe post | Manual recipe share | Manual recipe submit | Auto from payment | Auto from meal plan (zero friction) |
| Photo sharing | Cooksnaps on recipes | Recipe photos | User photos on reviews | No photos | Meal photos from v4.0 camera infra |
| Interactions | Like, comment, cooksnap | Like, comment | Rate, review, photo | Like, comment | Like, comment, save recipe |
| Save/collect | Save to collection | Save to meal plan | Save to recipe box | N/A | Save recipe + "Cook This Too" (add to plan) |
| Privacy | Public profiles, controlled info | Public | Public | Friends-only (post-2021) | Follow-based only, share toggle per meal |
| Discovery | Global explore, trending | Communities | Search, categories | Contacts sync | Search by name, invite links, mutual follow suggestions |

## Existing Infrastructure Dependencies

These existing SharedKitchen features directly support social feed implementation:

| Existing Feature | How It Supports Social Feed | Changes Needed |
|-----------------|---------------------------|----------------|
| Multi-household / kitchen switching | Kitchen entity already exists as the social unit. Kitchen has name, members, avatar. | Add public profile fields (bio, public flag). |
| Meal plan data model (day cards, slots) | Feed items are derived from meal_plan rows. No new content type needed. | Add share_to_feed boolean column or separate feed_items table referencing meal_plans. |
| Recipe library with full data model | Recipe save/clone has a clear data model to copy from. | Add provenance field (saved_from_kitchen_id) on recipes. |
| Supabase Realtime | Real-time feed updates, like counts, new comments can use existing Realtime infrastructure. | New channel subscriptions for feed updates. |
| Camera + food photo (v4.0) | Meal photo capture already built. Extend to attach photos to feed items. | Connect photo upload flow to feed item creation. |
| Push notifications (v2.0) | Notification infrastructure exists. Add new notification types for social events. | New notification type handlers for follow/like/comment. |
| Supabase RLS | Feed privacy enforcement: only show feed items from kitchens you follow. Server-authoritative. | New RLS policies on feed_items, follows, comments, likes tables. |
| User profiles with avatar | Existing profile data can populate kitchen profile view. | Kitchen-level profile distinct from user profile. |
| Activity toasts (v2.0) | In-app activity awareness pattern already established. | Extend to social events (new follower, new like). |

## Sources

- [Cookpad: Build Your Community (Followers and Following)](https://blog.cookpad.com/uk/build-your-community-on-cookpad-followers-and-following/)
- [Cookpad: Exciting new features](https://blog.cookpad.com/us/exciting-changes-in-the-cookpad-app/)
- [Cookpad UX as antidote to Instagram for foodies](https://econsultancy.com/how-ux-makes-cookpad-s-app-the-best-antidote-to-instagram-for-foodies/)
- [Cookpad: A Cooksnap is worth 1,000 Words](https://blog.cookpad.com/us/a-cooksnap-is-worth-1-000-words/)
- [Why Venmo has a social graph -- Ben Chamberlain](https://medium.com/@bchamberlain951/why-venmo-has-a-social-graph-ce0091b3fcee)
- [Venmo removes global public feed -- TechCrunch](https://techcrunch.com/2021/07/20/venmo-removes-its-global-public-feed-in-a-significant-app-redesign/)
- [Pepper the App: Instagram for Cooking](https://thespoon.tech/pepper-app-aims-to-be-the-instagram-for-cooking/)
- [Allrecipes: From Community to Data](https://spacestudy.blog/allrecipes-community-to-data/)
- [Whisk: Recipe Keeper & Planner](https://trywhisk.com/)
- [BiteShare: a food social media app (Medium)](https://medium.com/@agrdesigner/biteshare-a-food-social-media-app-bd92c7865afa)
- [Guide to Implementing Social Feeds in Apps](https://www.social.plus/answers/guide-to-implementing-social-feeds-in-apps)
- [Yummly shutdown and alternatives](https://mealthinker.com/blog/yummly-alternative)
- [Best Cooking Apps 2026](https://www.bestapp.com/best-recipe-apps/)

---
*Feature research for: Social meal feed in SharedKitchen*
*Researched: 2026-04-06*
