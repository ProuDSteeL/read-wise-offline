# Roadmap: ReadWise Offline

## Overview

This roadmap covers the v1.5 polish and feature completion for ReadWise Offline -- a brownfield PWA with working auth, catalog, reader, audio player, and basic offline support already shipped. Payments are deferred to v2. The work ahead is security hardening, reader/audio polish, content features (key ideas, quizzes, collections), offline UX completion, and growth fundamentals. Security comes first because signed URLs and server-side gating are prerequisites for offline downloads and content protection.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Security Hardening** - Lock down RLS policies, server-side content gating, and signed audio URLs
- [ ] **Phase 2: Reader Enhancement** - Font/theme/spacing customization, TOC navigation, highlights, and reader-audio integration
- [ ] **Phase 3: Audio Player Polish** - Background playback with lock screen controls and sleep timer
- [ ] **Phase 4: Content & Collections** - Key ideas carousel, continue reading, reading stats, and admin-managed collections
- [ ] **Phase 5: Quizzes & Learning** - Multiple-choice quizzes, flashcards, admin creation, and progress tracking
- [ ] **Phase 6: Offline Hardening** - Downloads page, chunked audio downloads with progress, and offline indicator
- [ ] **Phase 7: Growth & Discovery** - SEO meta tags, PWA install prompt, and promotional banners

## Phase Details

### Phase 1: Security Hardening
**Goal**: All premium content is protected server-side; no client-side bypass is possible
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. A non-Pro user cannot update their own subscription fields via DevTools or API calls
  2. Full summary content is only returned from Edge Functions after server-side subscription validation
  3. Audio file URLs are time-limited signed URLs that expire and cannot be shared or reused
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — RLS trigger to protect subscription fields + update free tier limits (SEC-01)
- [ ] 01-02-PLAN.md — Content gating Edge Function with server-side truncation + paywall UI (SEC-02)
- [ ] 01-03-PLAN.md — Private audio bucket + signed URL Edge Function + client integration (SEC-03)

### Phase 2: Reader Enhancement
**Goal**: Users have a comfortable, customizable reading experience with navigation and text interaction tools
**Depends on**: Nothing (independent of Phase 1)
**Requirements**: READ-04, READ-05, READ-06, READ-07, READ-08, READ-09, READ-10
**Success Criteria** (what must be TRUE):
  1. User can change font size (small/medium/large/XL) and the setting persists across sessions
  2. User can switch between light, dark, and sepia reading themes independently of the app theme
  3. User can adjust line spacing and the setting persists across sessions
  4. User can open a table of contents and tap a section heading to jump directly to it
  5. User can highlight text, save quotes to a personal collection, copy text to clipboard, and play/pause audio without leaving the reader
**Plans**: 1 plan

Plans:
- [ ] 02-01-PLAN.md — Add copy-to-clipboard and verify all 7 reader requirements

### Phase 3: Audio Player Polish
**Goal**: Audio playback works reliably in the background and supports sleep timer for bedtime listening
**Depends on**: Nothing (independent)
**Requirements**: AUDIO-03, AUDIO-04
**Success Criteria** (what must be TRUE):
  1. Audio continues playing when the user locks their phone or switches to another app, with play/pause/skip controls visible on the lock screen
  2. User can set a sleep timer (15/30/45/60 min) and playback automatically stops when the timer expires
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Extend AudioContext with Media Session API, centralized sleep timer, offline loading + update AudioPlayerPage + unit tests (AUDIO-03, AUDIO-04)
- [ ] 03-02-PLAN.md — Refactor OfflineReaderPage to use AudioContext + MiniAudioPlayer sleep timer indicator + manual verification (AUDIO-03, AUDIO-04)

### Phase 4: Content & Collections
**Goal**: Users discover content through key ideas, personalized homepage sections, reading stats, and curated collections
**Depends on**: Phase 2 (reader features provide the reading experience that generates stats and progress)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, COLL-01, COLL-02
**Success Criteria** (what must be TRUE):
  1. Book page displays key ideas as a swipeable carousel of 5-10 cards
  2. Admin can upload key ideas with title and text per card, and reorder them via drag-and-drop
  3. Homepage shows a "Continue reading" section with the user's unfinished summaries and their progress
  4. User profile displays reading statistics: books read, total reading time, and reading streaks
  5. Admin can create collections with title/description/cover, and collections appear as horizontal scrollable sections on the homepage
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Key ideas Embla carousel on BookPage + verify admin reorder buttons (CONT-01, CONT-02)
- [ ] 04-02-PLAN.md — Homepage collection book rows + verify continue reading, stats, admin collections (COLL-02, COLL-01, CONT-03, CONT-04)

### Phase 5: Quizzes & Learning
**Goal**: Users can test and reinforce their understanding of book summaries through quizzes and flashcards
**Depends on**: Phase 4 (key ideas content provides the material that quizzes and flashcards reference)
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04
**Success Criteria** (what must be TRUE):
  1. After reading a summary, user can take a multiple-choice quiz with 3-5 questions and see their score
  2. User can study key concepts via flashcards that show a question/concept on the front and reveal the answer on flip
  3. Admin can create quiz questions and flashcards per book in the admin form
  4. Quiz results and flashcard progress appear in the user's profile statistics
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Offline Hardening
**Goal**: Users can download books for offline reading with full visibility into storage usage
**Depends on**: Phase 1 (signed URLs from SEC-03 are required for secure audio downloads)
**Requirements**: OFFL-04, OFFL-05, OFFL-06
**Success Criteria** (what must be TRUE):
  1. User can view a "My Downloads" page showing all downloaded books with storage size per book and a delete option
  2. Audio downloads show a visible progress bar and handle large files via chunked downloading
  3. When the user is offline, a banner indicator is displayed so they know they are reading without internet
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Growth & Discovery
**Goal**: The app is discoverable via search engines and encourages PWA installation
**Depends on**: Nothing (independent, placed last as lowest priority)
**Requirements**: GROW-01, GROW-02, GROW-03
**Success Criteria** (what must be TRUE):
  1. Each page has appropriate SEO meta tags (title, description, Open Graph) that render correctly in link previews
  2. Users on mobile see a dismissible "Add to Home Screen" prompt encouraging PWA installation
  3. Homepage displays admin-managed promotional banners in a swipeable carousel
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

Note: Phases 1, 2, 3 have no mutual dependencies and could execute in parallel. Phase 4 depends on Phase 2. Phase 5 depends on Phase 4. Phase 6 depends on Phase 1.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 0/3 | Not started | - |
| 2. Reader Enhancement | 0/1 | Not started | - |
| 3. Audio Player Polish | 2/2 | Complete | 2026-03-19 |
| 4. Content & Collections | 0/2 | Not started | - |
| 5. Quizzes & Learning | 0/? | Not started | - |
| 6. Offline Hardening | 0/? | Not started | - |
| 7. Growth & Discovery | 0/? | Not started | - |
