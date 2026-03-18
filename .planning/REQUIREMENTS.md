# Requirements: ReadWise Offline

**Defined:** 2026-03-18
**Core Value:** Доступные саммари нон-фикшн книг на русском языке с полным офлайн-доступом

## v1 Requirements

### Security

- [ ] **SEC-01**: RLS policy restricts subscription field updates to service role only (prevents user self-promotion to Pro)
- [ ] **SEC-02**: Server-side content gating via Edge Functions validates subscription before returning full summary content
- [ ] **SEC-03**: Signed audio URLs with time-limited access tokens prevent direct audio file access

### Audio Player

- [ ] **AUDIO-03**: Background playback via Media Session API with lock screen controls (play/pause/skip)
- [ ] **AUDIO-04**: Sleep timer with configurable duration (15/30/45/60 min) auto-stops playback

### Reader

- [ ] **READ-04**: User can adjust font size (small/medium/large/XL) with setting persisted
- [ ] **READ-05**: User can switch reading theme (light/dark/sepia) with setting persisted
- [ ] **READ-06**: User can adjust line spacing with setting persisted
- [ ] **READ-07**: Table of contents with clickable section navigation within summary
- [ ] **READ-08**: User can highlight text and save quotes to personal collection
- [ ] **READ-09**: Audio player accessible from reader view (inline play/pause button)
- [ ] **READ-10**: User can copy selected text to clipboard

### Content & Admin

- [ ] **CONT-01**: Key ideas displayed as swipeable carousel on book page (5-10 cards)
- [ ] **CONT-02**: Admin can upload key ideas with title + text per card and drag-and-drop reordering
- [ ] **CONT-03**: "Continue reading" section on homepage shows user's unfinished summaries with progress
- [ ] **CONT-04**: Reading statistics in profile: books read, total reading time, reading streaks

### Quizzes

- [ ] **QUIZ-01**: Multiple-choice quiz with 3-5 questions per summary, accessible after reading
- [ ] **QUIZ-02**: Flashcards for key concepts — front shows question/concept, flip reveals answer
- [ ] **QUIZ-03**: Admin can create quiz questions and flashcards per book in admin form
- [ ] **QUIZ-04**: Quiz results and flashcard progress saved and displayed in user profile stats

### Offline

- [ ] **OFFL-04**: Downloads page showing list of downloaded books with storage size and delete option
- [ ] **OFFL-05**: Chunked audio downloads with visible progress bar
- [ ] **OFFL-06**: Offline banner indicator displayed when user reads without internet connection

### Growth

- [ ] **GROW-01**: SEO meta tags per page (title, description, Open Graph tags) via react-helmet-async
- [ ] **GROW-02**: PWA install prompt (Add to Home Screen) with dismissible UI
- [ ] **GROW-03**: Promotional banners carousel on homepage (swipeable, admin-managed)

### Collections

- [ ] **COLL-01**: Admin can create and manage book collections/featured lists with title, description, cover
- [ ] **COLL-02**: Collections displayed on homepage as horizontal scrollable sections

## v2 Requirements

### Payments & Subscriptions

- **PAY-01**: YooKassa payment integration (one-time + recurring)
- **PAY-02**: Subscription state machine (pending, active, past_due, cancelled)
- **PAY-03**: Freemium enforcement (5 free summaries, Pro gates for audio/downloads)
- **PAY-04**: Auto-renewal via saved payment methods
- **PAY-05**: Subscription management page in profile

### Notifications

- **NOTF-01**: Push-уведомления о новых саммари
- **NOTF-02**: Напоминания о чтении

### Gamification

- **GAME-01**: Reading achievements/badges
- **GAME-02**: Daily/weekly reading goals

### AI Features

- **AI-01**: AI-powered personalized recommendations

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app (React Native/Flutter) | PWA covers needs for V1, native app is V2.0+ |
| OAuth login (Google, GitHub) | Email/password sufficient for V1 |
| Video content | Storage complexity, not in product focus |
| Real-time chat / comments | Not in product focus |
| AI content generation | Content created manually by author |
| Multi-language support | Russian-only for V1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | - | Pending |
| SEC-02 | - | Pending |
| SEC-03 | - | Pending |
| AUDIO-03 | - | Pending |
| AUDIO-04 | - | Pending |
| READ-04 | - | Pending |
| READ-05 | - | Pending |
| READ-06 | - | Pending |
| READ-07 | - | Pending |
| READ-08 | - | Pending |
| READ-09 | - | Pending |
| READ-10 | - | Pending |
| CONT-01 | - | Pending |
| CONT-02 | - | Pending |
| CONT-03 | - | Pending |
| CONT-04 | - | Pending |
| QUIZ-01 | - | Pending |
| QUIZ-02 | - | Pending |
| QUIZ-03 | - | Pending |
| QUIZ-04 | - | Pending |
| OFFL-04 | - | Pending |
| OFFL-05 | - | Pending |
| OFFL-06 | - | Pending |
| GROW-01 | - | Pending |
| GROW-02 | - | Pending |
| GROW-03 | - | Pending |
| COLL-01 | - | Pending |
| COLL-02 | - | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 0
- Unmapped: 28 ⚠️

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
