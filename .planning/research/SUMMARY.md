# Project Research Summary

**Project:** ReadWise Offline (Buks)
**Domain:** Russian-language book summaries PWA with freemium subscriptions and full offline support
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH (stack HIGH from verified package.json; features/pitfalls MEDIUM from training data)

## Executive Summary

ReadWise Offline is a mature-stage PWA with substantial working infrastructure (auth, catalog, reader, audio player, offline storage, access control skeleton) that now needs to become a real monetizable product. The project has a clear, proven tech stack (React 18 + TypeScript + Supabase + vite-plugin-pwa + localforage) that should not change. The work ahead is not greenfield — it is carefully wiring up the freemium loop, hardening security, and polishing the user experience to match competitor expectations.

The recommended approach is to treat payment integration as the critical path. YooKassa is the only viable payment processor for this Russian market context, and it uses a non-standard pattern: there is no subscription primitive — recurring payments must be manually implemented via saved payment method tokens and server-side cron jobs. Before any payment code is written, the existing Supabase RLS policies must be audited and hardened: the current blanket UPDATE policy on the `profiles` table allows any authenticated user to self-promote to Pro via DevTools, which would make the entire payment integration meaningless.

The highest-leverage work after payments is audio polish (Media Session API for background/lock screen playback — without this, the audio feature is unusable when the phone locks) and offline hardening (subscription-gated content leases, chunked audio downloads, storage quota management). SEO is important for organic growth but should be deferred until the monetization loop is proven. The product is well-positioned on price (299 rub/mo vs 400-500 for Smart Reading) and offline quality, which are genuine competitive advantages in the Russian market.

## Key Findings

### Recommended Stack

The existing stack is correct and should be left unchanged. React 18.3 + TypeScript 5.8 + Vite 5.4 + Tailwind 3.4 + shadcn/ui + Supabase + vite-plugin-pwa + localforage + React Query + React Router is a well-matched set for a content PWA of this scale. The Milestone 2 additions are minimal by design.

**New dependencies (only 4 packages):**
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`: Drag-and-drop for admin key ideas ordering — react-beautiful-dnd is deprecated; dnd-kit is the 2025 standard, works on mobile
- `react-helmet-async`: Dynamic meta tags per page — lightweight, works with React 18, sufficient for a SPA with limited public pages

**No npm package for YooKassa.** The widget loads from CDN (`yookassa.ru/checkout-widget/v1/checkout-widget.js`). Server-side API calls use plain `fetch` with Basic Auth from Supabase Edge Functions (Deno). Unofficial npm packages are Node.js-only and would break in Deno.

**No additional libraries for audio.** Media Session API and sleep timer are browser-native — no Howler.js or similar needed.

### Expected Features

The codebase already ships most table stakes. The gap is monetization activation and polish.

**Must have (table stakes, not yet done):**
- YooKassa payment integration — without real payments, the freemium UI is a facade; no revenue possible
- Freemium enforcement wired to real payments — access control logic exists but is mocked
- Reader customization (font size, theme, line spacing) — all competitors have this; users notice immediately
- Sleep timer — low effort, high value for the 70%+ of users who use audio; standard in all audio apps
- Background audio via Media Session API — without this, audio pauses when the phone locks; critical for any audio-first use case
- Server-side content gating via RLS and signed URLs — currently all premium content is accessible to any authenticated user who inspects network requests

**Should have (competitive, partially built):**
- Key ideas carousel — admin upload + display; components exist, not wired
- TOC / chapter navigation — parse markdown headings; no external dependency needed
- Offline downloads polish — My Downloads section, storage quota UI, selective download (text vs audio+text)
- "Continue reading" on home — ContinueCard component exists, needs wiring
- Reading stats in profile — simple counter, not gamification

**Defer to V2+:**
- Push notifications (low opt-in rates, adds service worker complexity)
- Gamification / streaks / achievements (vanity metrics, not retention)
- Native mobile app (PWA covers the use case; native means 2x maintenance + app store fees)
- Phone/SMS login (nice for Russian market but not blocking)
- AI-powered recommendations (current category-based algorithm is working)
- Complex social features (Blinkist removed these; high moderation cost, low engagement)
- SSR/SSG for SEO (large migration for marginal benefit given limited public pages)

### Architecture Approach

The architecture is client-side SPA with Supabase as the complete backend (PostgreSQL, Auth, Storage, Edge Functions). Payments must follow a strict server-authoritative pattern: Edge Functions create payments and process webhooks using the service_role key; the React client never writes subscription status directly. This is a hard constraint, not a preference — the alternative is a trivially bypassable paywall.

**Major components to build:**
1. `supabase/functions/create-payment/` — Creates YooKassa payment, returns confirmation token to client; uses YooKassa secrets from Deno env
2. `supabase/functions/yookassa-webhook/` — Receives payment events, verifies IP whitelist, processes idempotently, writes to `payments` table, updates `profiles` subscription fields
3. `payments` table — Payment history with `yookassa_payment_id UNIQUE` for idempotency; NO client-facing INSERT/UPDATE RLS policies
4. `src/hooks/usePayment.ts` — Client-side hook to initiate payment flow; polls subscription status after redirect
5. `src/pages/SubscriptionPage.tsx` — Plan selection, pricing, payment history
6. `src/components/PaywallDialog.tsx` — Triggered by `useAccessControl()` denials
7. `AudioContext.tsx` extensions — Sleep timer state + Media Session API registration
8. `offlineStorage.ts` extensions — Cover image store, key ideas store, subscription status cache, content lease timestamps

**Patterns to follow:**
- Edge Functions for all server-side logic (secrets, payment writes, subscription mutations)
- `useAccessControl()` as single source of truth for feature gating on the client
- React Query polling (every 3s) after payment redirect until subscription activates
- Content leases: store `subscriptionValidUntil` in OfflineBookMeta; check on app load; grace period 7 days post-expiry

### Critical Pitfalls

1. **RLS allows user self-promotion to Pro** — The `profiles` table has a blanket UPDATE policy; any user can write `subscription_type = 'pro'` from DevTools. Fix BEFORE payment integration by restricting the UPDATE policy to `name` and `avatar_url` only, plus a BEFORE UPDATE trigger that rejects subscription field changes from the `authenticated` role.

2. **Client-side-only access control** — All premium content (text, audio URLs) is returned to any authenticated Supabase client regardless of subscription. Fix by implementing RLS policies that join subscription status, and replacing direct audio Storage URLs with signed URLs from an Edge Function that verifies `isPro`.

3. **YooKassa webhook security and idempotency** — YooKassa retries webhooks up to 10 times. Without a `yookassa_payment_id UNIQUE` constraint checked before processing, retries extend subscriptions multiple times. Also: without IP whitelist verification, anyone can POST a fake payment.succeeded event. Fix: idempotency check + IP whitelist verification in the webhook handler from day one.

4. **Offline content persists after subscription expires** — A user can subscribe, download everything, cancel, and retain access forever. Fix by storing a `subscriptionValidUntil` lease timestamp in OfflineBookMeta and enforcing a 7-day grace period window; after grace period, show renewal prompt rather than content.

5. **YooKassa has no subscription primitive** — Unlike Stripe, YooKassa recurring payments must be manually implemented: save `payment_method_id` on first payment, then run a server-side cron job that creates new payments via the API before each billing cycle. Assuming auto-renewal happens automatically leads to subscriptions that never renew.

6. **Binary Pro/Free model is insufficient** — The `isPro` boolean doesn't capture: pending, past_due, cancelled-but-active, expired states. Implement a proper subscription state machine with at least 6 states; add `subscription_status`, `subscription_started_at`, `subscription_cancelled_at`, and `next_billing_date` columns. Design this before the first payment is processed.

## Implications for Roadmap

Based on research, the dependency graph dictates a clear phase order. Security hardening must precede payment UI. Payment infrastructure must precede payment UI. Audio and offline enhancements can run partially in parallel with later payment phases.

### Phase 1: Security Hardening + Database Foundation

**Rationale:** The RLS vulnerability (Pitfall 1) and missing payment tables must be fixed before any other work. Running payment integration on top of the existing RLS setup would make the entire monetization system security theater. This phase has no UI deliverables but is the prerequisite for everything monetization-related.

**Delivers:** Hardened database security, payment data model, subscription state machine schema

**Addresses features from FEATURES.md:** Freemium model foundation; payment integration prerequisites

**Implements architecture:** `payments` table with RLS, `profiles` UPDATE policy restriction, subscription protection trigger, subscription state machine columns

**Avoids pitfalls:** Pitfall 1 (self-promotion bypass), Pitfall 5 (binary state model), Pitfall 3 (idempotency foundation)

### Phase 2: YooKassa Payment Integration

**Rationale:** Payment is the critical path. Nothing else about the freemium model matters without real money moving. This phase is high complexity (YooKassa API + Edge Functions + webhooks + no npm package) and should be completed before any polish work. Recurring autopayments architecture must be designed here — it cannot be retrofitted.

**Delivers:** Working subscription purchase flow (monthly + annual), webhook processing, subscription activation, payment history

**Uses stack elements:** YooKassa CDN widget, Supabase Edge Functions (Deno), `fetch` with Basic Auth, `payments` table

**Implements architecture:** `create-payment` Edge Function, `yookassa-webhook` Edge Function, `usePayment` hook, SubscriptionPage, PaywallDialog

**Avoids pitfalls:** Pitfall 3 (webhook security + idempotency), Pitfall 8 (recurring payments manual implementation), Pitfall 11 (stale paywall state), Pitfall 12 (centralize pricing constants)

### Phase 3: Server-Side Content Gating

**Rationale:** With real payments now flowing, the client-side-only access control (Pitfall 2) becomes a live exploit. Premium audio URLs are currently accessible to any authenticated user. This phase closes that gap by moving enforcement to the database and Edge Functions. Also implements signed URLs for audio, which is also a prerequisite for offline signed-URL caching.

**Delivers:** RLS policies gating full content on subscription status, signed audio URLs from Edge Function, free-read counter server-side enforcement

**Avoids pitfalls:** Pitfall 2 (client-only enforcement), Pitfall 10 (gameable free read counter), Pitfall 14 (direct Storage URL exposure)

### Phase 4: Audio Player Polish

**Rationale:** Audio enhancements are independent of payment completion (sleep timer and Media Session API don't require subscription logic) and deliver high user value. Background playback is a must-have — without it, users who lock their phone lose audio, making the audio feature non-competitive with Blinkist/Smart Reading. Sleep timer is low effort with outsized perceived quality improvement.

**Delivers:** Sleep timer (15/30/45/60 min), Media Session API lock screen controls, offline audio source selection (IndexedDB-first fallback)

**Uses stack elements:** `AudioContext.tsx` extensions, Media Session API (browser built-in), `setTimeout` for sleep timer

**Avoids pitfalls:** Pitfall 7 (ObjectURL leaks — fix when adding offline audio source selection)

### Phase 5: Reader and Content Polish

**Rationale:** Table stakes reader features that users notice immediately. Groups naturally because they share the same data surface (reader settings in localStorage, markdown content) and the same component (`ReaderPage`/`BookPage`).

**Delivers:** Reader customization (font size, theme, line spacing), TOC/chapter navigation, key ideas carousel, "Continue reading" on home, reading stats in profile

**Addresses features from FEATURES.md:** Reader customization (Must), TOC (Should), Key ideas (Should), Continue reading (Should), Reading stats (Should)

**Uses stack elements:** `embla-carousel-react` (existing, for key ideas carousel), `@dnd-kit` (for admin key ideas ordering), localStorage for settings persistence

### Phase 6: Offline Hardening

**Rationale:** This phase is last because it depends on the subscription caching pattern from Phase 2 and the signed URL approach from Phase 3. It is also the most complex to test (requires simulating offline state, quota limits, large files). The existing offline architecture is well-designed; this phase extends it rather than replaces it.

**Delivers:** Subscription lease timestamps in offline storage, "My Downloads" section with storage management, chunked audio download with resumption, cover image + key ideas offline storage, multi-book download queue, offline sync conflict resolution

**Avoids pitfalls:** Pitfall 4 (offline content post-expiry), Pitfall 6 (large audio silent failure), Pitfall 9 (storage quota mismatch), Pitfall 13 (offline sync conflicts)

### Phase 7: Growth and SEO

**Rationale:** Deferred until the core monetization loop is proven. SEO (meta tags, structured data) delivers organic acquisition but requires react-helmet-async and a prerendering strategy. Collections and promo banners are admin-side content display work. A2HS install banner improves PWA adoption.

**Delivers:** SEO meta tags (react-helmet-async), curated collections display, promo banner carousel, A2HS PWA install prompt

**Needs research:** Prerendering strategy for Vite SPA (vite-plugin-ssr vs prerender-spa-plugin vs Cloudflare Pages edge rendering)

### Phase Ordering Rationale

- Security hardening is a hard prerequisite for payments; skipping it makes the paywall bypassable
- Payments before content gating prevents the awkward gap where real payments exist but enforcement is still client-only
- Audio polish is high value and independent, but placed after payment fundamentals because Phase 1-3 are time-sensitive
- Offline hardening is last because it has the most dependencies (subscription cache, signed URLs) and is hardest to test
- Growth/SEO is deferred because it has no dependencies on revenue flow and can wait for proof of monetization

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (YooKassa):** YooKassa API documentation is sparse. Verify webhook IP ranges, payment state machine values, and autopayment flow against current docs at yookassa.ru/developers before implementation. Training data confidence is MEDIUM.
- **Phase 3 (Content Gating):** Supabase RLS with function-based column checks and signed URL generation patterns — verify against current Supabase docs for any breaking changes in supabase-js 2.99.
- **Phase 7 (SEO):** Prerendering strategy for Vite SPA is an open architectural question. Options (vite-plugin-ssr, prerender-spa-plugin, Cloudflare Pages edge rendering) have different tradeoffs. Needs dedicated spike.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Database):** Standard PostgreSQL migration + Supabase RLS patterns. Well-documented.
- **Phase 4 (Audio):** Media Session API is a W3C standard with excellent MDN documentation. Sleep timer is `setTimeout`. No research needed.
- **Phase 5 (Reader/Content):** localStorage persistence, markdown heading parsing, embla-carousel — all standard React patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack confirmed from package.json. New additions (@dnd-kit, react-helmet-async) are MEDIUM — verify versions at install time. YooKassa CDN widget approach confirmed from official docs. |
| Features | MEDIUM | Competitor analysis (Blinkist, Smart Reading, Headway) based on training data — no live verification. Core feature gaps confirmed from direct codebase review (HIGH). |
| Architecture | HIGH | Existing codebase architecture confirmed by direct file inspection. YooKassa integration patterns MEDIUM (based on training data; verify webhook IP ranges and API endpoints against current docs). Supabase Edge Function patterns HIGH. |
| Pitfalls | HIGH | Critical pitfalls (Pitfalls 1, 2, 5) confirmed by direct code review of migration files, hooks, and components. YooKassa-specific pitfalls (3, 8) MEDIUM — based on training data knowledge of YooKassa's API design, confirmed directionally by lack of subscription primitive in their API. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **YooKassa recurring payment implementation:** Exact API fields for `save_payment_method`, `payment_method_id` reuse, and webhook payload structure should be verified against current YooKassa docs before Phase 2 planning. The ARCHITECTURE.md contains working example code, but YooKassa docs should be the final authority.
- **Supabase column-level security:** The recommended approach (BEFORE UPDATE trigger that reverts subscription columns for the `authenticated` role) should be validated against the current Supabase PostgreSQL version to confirm `current_setting('request.jwt.claim.role')` behavior is correct in the target environment.
- **Audio file sizes in existing catalog:** The chunked download strategy is recommended based on "possible 50-100MB files" but actual audio file sizes in the existing catalog should be measured. If all files are under 10MB, some of the chunking complexity can be deferred.
- **SEO prerendering strategy:** An open architectural question that needs a dedicated spike in Phase 7 planning. The current SPA approach is insufficient for Google indexing of book pages; the migration path is not clear.

## Sources

### Primary (HIGH confidence)
- Existing codebase (package.json, migration files, hooks, components) — confirmed stack, confirmed pitfalls 1/2/5/7/9/12
- YooKassa official developer docs (https://yookassa.ru/developers/) — widget integration, payment API, recurring payments
- Media Session API (https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API) — W3C standard, browser support
- Supabase Edge Functions (Deno patterns, service_role key usage) — established in existing codebase

### Secondary (MEDIUM confidence)
- Blinkist, Smart Reading, Headway feature analysis — training data, features may have changed since cutoff
- @dnd-kit library versions — training data; verify exact versions at install time
- react-helmet-async version — training data; verify at install time
- YooKassa webhook specifics (IP ranges, retry behavior) — training data; verify against current docs

### Tertiary (LOW confidence)
- getAbstract and Shortform competitor analysis — enterprise-focused, less relevant to Russian consumer market
- Prerendering strategy options for Vite SPA — training data, fast-moving ecosystem area

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
