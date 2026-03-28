# Requirements: SharedKitchen v3.0 — Video Recipe Import

**Defined:** 2026-03-28
**Core Value:** Households can collaboratively plan, shop for, and cook dinners together in real-time
**Goal:** Users can import recipes from TikTok, Instagram, YouTube, and any video URL — via share sheet or paste — with transcript-based AI extraction

## v3.0 Requirements

### Video URL Detection

- [x] **VURL-01**: App detects TikTok URLs (tiktok.com, vm.tiktok.com) as video import targets
- [x] **VURL-02**: App detects Instagram Reel URLs (instagram.com/reel/, instagram.com/p/) as video import targets
- [x] **VURL-03**: App detects YouTube URLs (youtube.com, youtu.be, YouTube Shorts) as video import targets
- [x] **VURL-04**: Unrecognized URLs fall through to the existing HTML import pipeline as graceful degradation

### Transcript Extraction

- [x] **TRANS-01**: Edge Function extracts transcript from video URL via Supadata API
- [x] **TRANS-02**: Edge Function handles Supadata async responses (HTTP 202) for longer videos with polling
- [x] **TRANS-03**: Edge Function completes transcript + recipe parse within 60-second timeout budget

### Recipe Parsing

- [x] **PARSE-01**: Gemini Flash converts video transcript into structured recipe (title, ingredients, steps, metadata)
- [x] **PARSE-02**: Gemini uses best-guess for ambiguous measurements ("a splash" → "1 tbsp")
- [x] **PARSE-03**: Non-recipe videos are detected and user sees a clear error instead of a hallucinated recipe

### Client Import Flow

- [x] **IMPORT-01**: User can paste a video URL in the existing recipe import field and it triggers video import
- [x] **IMPORT-02**: User sees a preview of the extracted recipe with option to edit before saving
- [x] **IMPORT-03**: Saved recipe includes a link back to the original source video
- [x] **IMPORT-04**: Import shows appropriate loading state while transcript + parsing completes

### Share Sheet

- [ ] **SHARE-01**: SharedKitchen appears in the iOS share sheet when sharing from TikTok, Instagram, or YouTube
- [ ] **SHARE-02**: Tapping SharedKitchen in share sheet opens the app and begins video import automatically
- [ ] **SHARE-03**: Share sheet works when app is in foreground, background, or killed

### Rate Limiting

- [x] **RATE-01**: Free users are limited to 3 video imports per calendar month
- [x] **RATE-02**: Premium subscribers have unlimited video imports
- [x] **RATE-03**: Import flow shows usage counter ("2 of 3 imports used this month")
- [x] **RATE-04**: User hitting the free limit sees an upgrade prompt

## Future Requirements

### Enhanced Video Processing

- **ENHANCE-01**: Gemini multimodal analyzes video frames for on-screen text and ingredient visuals
- **ENHANCE-02**: User can select specific timestamp range to extract recipe from long videos
- **ENHANCE-03**: Batch import multiple video URLs at once

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video download/storage | Unnecessary — transcript extraction handles content without downloading video |
| Gemini multimodal video analysis | Higher cost, slower — defer to future enhancement if transcript quality insufficient |
| Android share sheet | iOS-only app |
| Creator attribution/profiles | Recipe apps link to source URL, not creator profiles |
| Video playback in-app | Link to original platform instead — avoids ToS and storage issues |
| Offline video import | Requires network for transcript API + Gemini |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VURL-01 | Phase 23 | Complete |
| VURL-02 | Phase 23 | Complete |
| VURL-03 | Phase 23 | Complete |
| VURL-04 | Phase 23 | Complete |
| TRANS-01 | Phase 23 | Complete |
| TRANS-02 | Phase 23 | Complete |
| TRANS-03 | Phase 23 | Complete |
| PARSE-01 | Phase 23 | Complete |
| PARSE-02 | Phase 23 | Complete |
| PARSE-03 | Phase 23 | Complete |
| IMPORT-01 | Phase 23 | Complete |
| IMPORT-02 | Phase 23 | Complete |
| IMPORT-03 | Phase 23 | Complete |
| IMPORT-04 | Phase 23 | Complete |
| SHARE-01 | Phase 24 | Pending |
| SHARE-02 | Phase 24 | Pending |
| SHARE-03 | Phase 24 | Pending |
| RATE-01 | Phase 23 | Complete |
| RATE-02 | Phase 23 | Complete |
| RATE-03 | Phase 23 | Complete |
| RATE-04 | Phase 23 | Complete |

**Coverage:**
- v3.0 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation (traceability added)*
