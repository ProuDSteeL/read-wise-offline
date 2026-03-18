# Feature Landscape

**Domain:** Russian-language book summaries PWA (nonfiction)
**Researched:** 2026-03-18
**Competitors analyzed:** Blinkist, Smart Reading, Headway, getAbstract, Shortform
**Confidence:** MEDIUM (based on training data knowledge of competitor apps; no live web verification available)

## Table Stakes

Features users expect from any book summary app. Missing = product feels incomplete or amateurish.

| Feature | Why Expected | Complexity | Status in Codebase | Notes |
|---------|-------------|------------|-------------------|-------|
| **Catalog with search and filters** | Every competitor has browsable, searchable library | Med | DONE (CAT-01..04) | Working: search, category chips, sections |
| **Text reader with comfortable reading UX** | Core product is reading summaries | Med | PARTIAL (READ-01..03) | Markdown rendering exists; font/theme/spacing settings missing |
| **Reader customization (font size, theme, line spacing)** | Blinkist, Headway, Smart Reading all have this | Med | NOT DONE | Sepia/dark/light themes, font size slider, line spacing are standard |
| **Audio playback with speed control** | Blinkist set expectation; 70%+ of summary app users use audio | Med | DONE (AUDIO-01..02) | Play, pause, seek, speed, position save all working |
| **Sleep timer** | Standard in all audio-enabled reading apps | Low | NOT DONE | 15/30/45/60 min presets + end of chapter |
| **Freemium model with clear upgrade path** | Users expect to try before buying | Med | PARTIAL | Access control logic exists (5 free reads, 10 highlights); paywall UI is placeholder, no real payment |
| **Payment processing** | Can not monetize without it | High | NOT DONE | YooKassa integration required; subscription plans defined in UI (299/mo, 1990/yr) |
| **User profile with reading stats** | Blinkist and Headway show streaks, books read, time spent | Low | PARTIAL | Profile page exists; stats hook exists but needs polishing |
| **Reading progress tracking** | Users expect to resume where they left off | Low | DONE (READ-02) | user_progress table with read/audio position |
| **"Continue reading" section on home** | Every competitor has this on the home screen | Low | PARTIAL | Component exists (ContinueCard), needs wiring |
| **Bookmarks / highlights** | Standard feature in any reading app | Med | DONE (READ-03) | Text selection + highlight saving working |
| **Offline access to downloaded content** | Your core differentiator, also table stakes for reading apps | High | PARTIAL | IndexedDB storage, download dialog, offline reader exist; needs polish for "My Downloads" section |
| **Table of contents / chapter navigation** | Expected for summaries longer than 5 min read | Low | NOT DONE | Parse markdown headings into TOC |
| **Key ideas / flashcards** | Blinkist has "Key Insights", Headway has "Key Ideas" visual cards | Med | PARTIAL | KeyIdeaCard component exists; admin upload + carousel not done |
| **Collections / curated lists** | "Best of 2025", "Startup essentials" etc. | Low | PARTIAL | AdminCollections page exists; display on home partial |
| **Responsive mobile-first design** | 80%+ of book summary app usage is mobile | Med | DONE (UI-01..03) | Bottom nav, mobile-first, dark theme |

## Differentiators

Features that set ReadWise Offline apart. Not universally expected but create competitive advantage.

| Feature | Value Proposition | Complexity | Status | Notes |
|---------|-------------------|------------|--------|-------|
| **Full offline mode (text + audio download)** | Smart Reading and Blinkist have limited offline; your PWA approach with IndexedDB for large audio is genuinely better for Russian market with spotty mobile data | High | PARTIAL | Core infra exists. Need: download management UI, storage quota display, selective download (text-only vs audio+text), auto-cleanup of old downloads |
| **Price point (299 vs 400-500 rub/mo)** | 35-40% cheaper than Smart Reading | N/A (business) | DEFINED | Already in PaywallPrompt. Real competitive advantage for price-sensitive Russian market |
| **Russian-only focus** | Blinkist/Shortform English only; Smart Reading is pricier. Niche ownership | N/A (content) | DEFINED | Advantage while catalog is small; becomes table stakes if competitors localize |
| **PWA install (no app store)** | No Apple/Google 30% cut, instant updates, no review delays | Low | PARTIAL | Service worker exists; install prompt hook exists; needs A2HS banner |
| **Personalized recommendations** | Based on reading history categories | Med | DONE | useRecommendations hook working with category overlap algorithm |
| **Background audio playback** | Listen while phone is locked/other apps open | Med | NOT DONE | Requires MediaSession API integration; critical for audio users |
| **SEO-optimized summary pages** | Organic traffic from Google; competitors behind paywalls have poor SEO | Med | NOT DONE | Need SSR/SSG for book pages, meta tags, structured data. Vite SPA needs prerendering strategy |

## Anti-Features

Features to deliberately NOT build. These add complexity without proportional value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **AI-generated summaries** | Quality risk; author creates content manually; AI summaries are commodity | Keep manual curation as quality signal. Mention "expert-curated" in marketing |
| **Social features (comments, reviews, sharing progress)** | Low engagement in summary apps; Blinkist removed social features; high moderation cost | Simple "share book link" button is sufficient |
| **Video content** | Storage costs explode; not core value; Headway tried and it is niche | Stick to text + audio. Consider short-form vertical video only for marketing |
| **Gamification (streaks, achievements, leaderboards)** | Headway does this; it drives vanity metrics not retention. Reading apps are not games | Simple "books read this month" counter is enough. Defer gamification to V2 |
| **OAuth / social login** | Adds complexity; email+password is fine for V1; Russian users are accustomed to it | Keep email+password. Consider adding phone/SMS login later (more common in RU than OAuth) |
| **Native mobile app** | PWA covers the use case. Native means 2x maintenance, app store fees, review delays | Invest in PWA quality: install prompt, offline, MediaSession API |
| **Real-time sync across devices** | Supabase already syncs on app load. Real-time adds WebSocket complexity | Current "sync on focus/reconnect" pattern is sufficient |
| **Complex CMS / multi-author workflow** | Single author creating content. CMS adds months of work | Keep simple admin form. Add bulk upload if needed |
| **Push notifications** | Browser push has low opt-in rates; adds service worker complexity; low value for reading app | Email digest if needed later. Focus on "Continue reading" section instead |

## Feature Dependencies

```
Payment (YooKassa) --> Freemium enforcement (meaningful paywall)
    |
    v
Subscription management --> Access control (already coded, needs real payments behind it)

Reader customization (font/theme/spacing) --> no dependencies (can build anytime)

Key Ideas admin upload --> Key Ideas carousel on book page
    |
    v
Key Ideas offline download (extend existing download infra)

Sleep timer --> no dependencies (simple timer on existing audio context)

Background audio (MediaSession API) --> no dependencies (extend AudioContext)

TOC / chapter navigation --> Markdown heading parsing (no deps, enhance existing reader)

SEO optimization --> Prerendering strategy (may need vite-plugin-ssr or similar)

Offline downloads polish --> Existing IndexedDB infra (extend useDownloads hook)

Promotional banners --> Admin banner management (simple CRUD)
```

**Critical path:** Payment (YooKassa) is the gating feature. Without real payment processing, the freemium model is just a UI facade. Everything monetization-related depends on this.

## MVP Recommendation

The project already has a solid foundation (auth, catalog, reader, audio player, offline infra, access control skeleton). The milestone should focus on making the freemium loop real and polishing what exists.

### Priority 1 -- Must ship (makes the product monetizable)

1. **YooKassa payment integration** -- without this, no revenue. Implement subscription creation, webhook handling for payment confirmation, subscription expiry management
2. **Freemium access control enforcement** -- access control logic exists but payments are mocked. Wire real subscription status to paywall
3. **Reader customization** -- font size, theme (light/dark/sepia), line spacing. Table stakes that users notice immediately
4. **Sleep timer** -- low effort, high value for audio users
5. **Background audio (MediaSession API)** -- without this, audio is unusable when the screen locks. Critical for the 70%+ of users who listen

### Priority 2 -- Should ship (makes the product feel complete)

6. **Key ideas carousel** -- admin upload + display on book page. Already partially built
7. **TOC / chapter navigation** -- parse markdown headings, show in sidebar/drawer
8. **Offline downloads polish** -- "My Downloads" section with storage management, download progress, selective download
9. **"Continue reading" on home** -- ContinueCard exists, wire it up properly
10. **Reading stats in profile** -- books read count, total time, reading streak (simple counter, not gamification)

### Priority 3 -- Nice to have (polish and growth)

11. **Collections / curated lists on home** -- admin already exists, display needs work
12. **Promo banner on home** -- swipeable carousel for seasonal promotions
13. **SEO optimization** -- important for organic growth but not blocking launch
14. **A2HS install banner** -- prompt users to install PWA

### Defer to V2

- Push notifications
- AI-powered recommendations (current category-based is fine)
- Gamification
- Native app
- Phone/SMS login

## Competitive Analysis Matrix

| Feature | Blinkist | Smart Reading | Headway | getAbstract | ReadWise (target) |
|---------|----------|---------------|---------|-------------|-------------------|
| Text summaries | Yes | Yes | Yes | Yes | Yes |
| Audio summaries | Yes | Yes | Yes | Limited | Yes |
| Key ideas/insights | Yes (cards) | No | Yes (flashcards) | Takeaways | Yes (cards) |
| Offline download | Pro only, limited | Yes | Pro only | PDF export | Yes (full, PWA) |
| Sleep timer | Yes | Yes | Yes | No | Planned |
| Background audio | Yes | Yes | Yes | N/A | Planned |
| Reading customization | Font, theme | Font, theme, spacing | Font, theme | Minimal | Planned |
| Freemium model | 1 free/day | Trial only | 1 free/day | Trial only | 5 free total |
| Personalization | AI-powered | Category-based | AI quiz | Role-based | Category-based |
| Social/sharing | Minimal | No | Challenges | No | No (deliberate) |
| Price (monthly) | ~800 rub | ~400-500 rub | ~700 rub | ~1500 rub | 299 rub |
| Russian language | No | Yes | Partial | No | Yes (only) |
| Platform | iOS/Android/Web | iOS/Android/Web | iOS/Android | Web | PWA |

## Freemium Model Details

Based on competitor patterns, the current "5 free summaries lifetime" model is reasonable but consider:

| Model | Competitor | Pros | Cons |
|-------|-----------|------|------|
| N free per day | Blinkist (1/day), Headway (1/day) | Keeps users coming back; sustained engagement | Complex to implement; users may never convert |
| N free lifetime | ReadWise (5 total) | Simple; forces decision quickly | May feel stingy; users leave before seeing value |
| Free trial (7-14 days) | Smart Reading | Full product experience; higher conversion | No ongoing free tier; users forget to cancel |
| Hybrid: trial + limited free | Best practice | Best of both; trial converts, free tier retains | Most complex |

**Recommendation:** Keep the 5 free summaries model for V1 (already implemented). It is simple and forces a purchase decision. Consider adding a 7-day full trial for new users in V1.5 to increase conversion. The 5-free model works well when the catalog is small (30-50 books) because users hit the wall quickly.

## Payment Integration Specifics (YooKassa)

Key behaviors expected in book/reading app payments:

| Behavior | Standard Approach | Notes |
|----------|-------------------|-------|
| Subscription creation | Redirect to YooKassa payment page or embedded widget | YooKassa supports both redirect and embedded JS widget |
| Recurring payments | YooKassa autopayments (saved card token) | Requires initial payment to save token, then recurring via API |
| Plan switching | Prorate or apply at next billing cycle | Start with "apply at next cycle" for simplicity |
| Cancellation | Cancel autopayment, access until period end | Must call YooKassa API to cancel recurring |
| Failed payment retry | YooKassa handles retry for autopayments | Webhook notifications for payment status changes |
| Receipt generation | YooKassa sends digital receipts (54-FZ compliance) | Required by Russian law for online payments |
| Refund | Within 7 days, via YooKassa API | Russian consumer protection law |

## Audio Player Enhancements Expected

Based on Blinkist and Headway patterns:

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Sleep timer (15/30/45/60 min, end of chapter) | Must | Low | setTimeout + pause audio |
| Background playback (MediaSession API) | Must | Med | Set metadata, handle media keys, lock screen controls |
| Playback speed (0.5x-3x) | Done | - | Already implemented |
| Skip forward/back (15s/30s) | Done | - | Already implemented |
| Chapter markers / segments | Nice | Med | Requires timestamp metadata in admin upload |
| Mini player (persistent bottom bar) | Done | - | MiniAudioPlayer component exists |
| Queue / playlist (next book auto-play) | Defer | Med | Blinkist has this; not critical for summaries |

## Reader Customization Expected

| Setting | Values | Priority | Notes |
|---------|--------|----------|-------|
| Font size | 14-24px range, slider or +/- buttons | Must | All competitors have this |
| Theme | Light / Dark / Sepia | Must | Dark already exists; add sepia |
| Line spacing | 1.2 / 1.5 / 1.8 / 2.0 | Should | Smart Reading has this |
| Font family | System / Serif / Sans-serif | Nice | Blinkist offers this; low priority |
| Text alignment | Left / Justified | Defer | Minor preference |
| Margin / padding | Narrow / Normal / Wide | Defer | Minor preference |

Settings should persist in localStorage and apply immediately (no save button).

## Sources

- Blinkist app feature analysis (training data, HIGH confidence -- well-known product)
- Smart Reading app analysis (training data, MEDIUM confidence -- Russian market leader)
- Headway app analysis (training data, MEDIUM confidence -- Ukrainian-origin competitor)
- getAbstract analysis (training data, MEDIUM confidence -- enterprise-focused)
- YooKassa payment integration patterns (training data, MEDIUM confidence -- standard Russian payment processor)
- MediaSession API capabilities (training data, HIGH confidence -- well-documented Web API)
- Existing codebase analysis (HIGH confidence -- direct code review)

**Note:** Web search was unavailable during research. All competitor feature analysis is based on training data (cutoff ~May 2025). Feature sets of competitors may have changed since then. Recommend manual verification of competitor apps before finalizing feature priorities.
