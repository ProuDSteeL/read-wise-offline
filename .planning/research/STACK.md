# Technology Stack: Milestone 2 Additions

**Project:** ReadWise Offline (Buks)
**Researched:** 2026-03-18
**Scope:** Payments (YooKassa), enhanced offline, polish features -- additions to existing stack only

## Existing Stack (Do Not Change)

React 18.3 + TypeScript 5.8 + Vite 5.4 + Tailwind 3.4 + shadcn/ui + Supabase (supabase-js 2.99) + vite-plugin-pwa 1.2 + localforage 1.10 + React Query 5.83 + React Router 6.30. All confirmed in package.json.

---

## Recommended Additions

### Payments: YooKassa Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| YooKassa Payment Widget (JS) | 3.x | Embedded payment form in React | YooKassa's official client-side widget. Loads via `<script>` tag from `https://yookassa.ru/checkout-widget/v1/checkout-widget.js`. No npm package -- this is by design, YooKassa distributes via CDN only. Handles PCI compliance on their side. | HIGH |
| Supabase Edge Functions (Deno) | existing | Server-side YooKassa API calls | Already have Edge Functions infrastructure (VAPID key generation). YooKassa API requires server-side calls with `shopId` + `secretKey` for creating payments, managing subscriptions. Edge Functions are the natural fit -- no separate backend needed. | HIGH |
| crypto (Node/Deno built-in) | -- | Webhook signature verification | YooKassa sends HMAC-signed webhooks. Verify with built-in crypto, no extra library needed. | HIGH |

**YooKassa Integration Pattern:**

1. **Client side:** Load YooKassa widget via script tag. Create a React wrapper component that initializes `new window.YooMoneyCheckoutWidget()` with a confirmation token.
2. **Server side (Edge Function):** `POST /create-payment` -- calls YooKassa API (`https://api.yookassa.ru/v3/payments`) with Basic Auth (`shopId:secretKey`), returns confirmation token to client.
3. **Webhook (Edge Function):** `POST /yookassa-webhook` -- receives payment status updates, verifies IP whitelist (YooKassa sends from known IPs), updates `subscriptions` table in Supabase.
4. **Recurring payments:** Use YooKassa's "autopayments" -- first payment saves `payment_method_id`, subsequent charges use `POST /v3/payments` with `payment_method_id` and `confirm: true`.

**No npm package for YooKassa.** The official approach is:
- Widget: CDN script for client-side checkout form
- API: Direct HTTP calls from server (fetch in Edge Functions) with Basic Auth
- There are unofficial npm packages (`@a2seven/yoo-checkout`, `yookassa-ts`) but they are community-maintained, Node.js-only (won't work in Deno Edge Functions), and unnecessary -- the API is simple REST with Basic Auth.

### Subscription Database Schema

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase PostgreSQL | existing | Subscription state storage | Add `subscriptions`, `payments` tables with RLS policies. Store subscription status, expiry, payment method ID for recurring. No new tech -- just SQL migrations. | HIGH |

### Enhanced Offline Support

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| localforage | 1.10.0 (existing) | IndexedDB storage for downloads | Already in use and working well. The existing `offlineStorage.ts` has proper patterns (separate stores for audio/text/meta, streaming download with progress). No reason to switch. | HIGH |
| vite-plugin-pwa | 0.22.x (upgrade) | Enhanced service worker config | Current 1.2.0 is quite old. Version 0.22+ (the versioning changed -- the package moved to `@vite-pwa/vite-plugin-pwa` at some point but `vite-plugin-pwa` on npm is the same package) brings better Workbox 7 integration, improved dev experience. However, the current config works and upgrading may introduce breaking changes. **Recommendation: Keep 1.2.0 unless specific bugs arise.** | MEDIUM |
| Workbox (via vite-plugin-pwa) | 7.x (bundled) | Runtime caching strategies | Already configured in vite.config.ts with CacheFirst for fonts/storage, StaleWhileRevalidate for API. Enhance with: (1) range request support for audio streaming, (2) background sync for offline actions, (3) better cache size limits. | HIGH |

**Enhanced Offline Additions to vite.config.ts:**

```typescript
// Add to runtimeCaching array:
{
  // Cache cover images with size limit
  urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/covers\/.*/i,
  handler: "CacheFirst",
  options: {
    cacheName: "cover-images-cache",
    expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    cacheableResponse: { statuses: [0, 200] },
  },
},
```

**Key offline enhancement is NOT in service worker config -- it's in the application layer:**
- The existing `offlineStorage.ts` handles explicit user downloads to IndexedDB (the important part for large audio files)
- Service worker caching handles navigation, API responses, and small assets
- The gap to fill: background download queue, download management UI, storage quota management

### Content Delivery & Reader Polish

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @dnd-kit/core + @dnd-kit/sortable | 6.x + 8.x | Drag-and-drop for admin key ideas ordering | Best React DnD library for 2025. Accessible, performant, works on mobile. react-beautiful-dnd is deprecated. | MEDIUM |
| embla-carousel-react | 8.6.0 (existing) | Key ideas carousel on book page | Already installed. Use for the key ideas card swiper. No new dependency needed. | HIGH |

### Audio Player Enhancements

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Web Audio API / Media Session API | browser built-in | Background playback, lock screen controls | Media Session API provides lock screen controls (play/pause/seek) and background playback on mobile. No library needed -- it's a browser API. Set `navigator.mediaSession.metadata` and action handlers. | HIGH |
| No library for sleep timer | -- | Sleep timer feature | Pure React implementation: `setTimeout` + pause audio. No library needed for this. | HIGH |

### SEO

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-helmet-async | 2.x | Dynamic meta tags per page | For setting title, description, OG tags per book page. Lightweight, works with React 18. Alternative `@tanstack/react-router` has built-in head management but would require router migration. | MEDIUM |

### Recommendations Engine (Simple)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase PostgreSQL functions | existing | Category-based recommendations | Simple SQL: "users who read books in category X also read Y". No ML, no external service. Write as a Postgres function or Edge Function querying categories + user_progress. | HIGH |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Payment widget | YooKassa CDN widget | iframe redirect | Widget provides embedded UX, stays on your domain, better conversion |
| Payment server | Supabase Edge Functions | Separate Node.js server | Adds infrastructure complexity, cost. Edge Functions already proven in codebase |
| Payment npm | Direct fetch calls | `@a2seven/yoo-checkout` | Node.js only (breaks in Deno), unnecessary abstraction over simple REST API |
| Offline storage | localforage (keep) | Dexie.js | localforage already works, migration cost not justified. Dexie adds querying but we don't need complex queries on offline data |
| Offline storage | localforage (keep) | idb | Lower-level than localforage, more code to write, no benefit for our use case |
| DnD | @dnd-kit | react-beautiful-dnd | react-beautiful-dnd deprecated, no longer maintained |
| DnD | @dnd-kit | HTML5 drag and drop | Poor mobile support, complex state management |
| SEO | react-helmet-async | Manual document.title | Doesn't handle meta/OG tags cleanly |
| Service Worker | vite-plugin-pwa (keep) | Custom SW | Working config exists, custom SW adds maintenance burden |
| Background audio | Media Session API | Howler.js | Howler adds 10KB, Media Session API is free and native. Standard HTML5 audio element + Media Session API covers all needs |

---

## What NOT to Add

| Technology | Why Not |
|------------|---------|
| Stripe | Not available for Russian individuals (YooKassa is the constraint) |
| Any YooKassa npm package | Community-maintained, Node.js-only, simple REST API doesn't need a wrapper |
| Dexie.js | localforage is already working fine, migration adds risk for no benefit |
| Howler.js | Overkill -- HTML5 audio + Media Session API covers background playback and lock screen |
| Next.js / SSR | Massive migration for SEO benefits that react-helmet-async can partially solve. SPA + dynamic meta tags is sufficient for a content app with limited public pages |
| Redux / Zustand | React Query + Context API pattern is established and working. Adding global state management adds complexity |
| Firebase | Already on Supabase, switching would be a rewrite |
| react-beautiful-dnd | Deprecated, not maintained since 2024 |

---

## Installation Plan

```bash
# Payments: No npm install needed -- widget loads from CDN
# Edge Functions: Use supabase CLI (already set up)

# Admin drag-and-drop for key ideas
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# SEO meta tags
npm install react-helmet-async

# That's it. Everything else uses existing deps or browser APIs.
```

**Total new dependencies: 4 packages** (3 dnd-kit + react-helmet-async). Minimal footprint.

---

## Edge Functions to Create

| Function | Purpose | YooKassa API |
|----------|---------|-------------|
| `create-payment` | Initialize payment, return confirmation token | `POST /v3/payments` |
| `yookassa-webhook` | Process payment notifications | Incoming webhook |
| `cancel-subscription` | Cancel recurring autopayment | `POST /v3/payments/{id}/cancel` (or disable saved method) |
| `check-subscription` | Verify active subscription status | `GET /v3/payments?status=succeeded` or check local DB |

---

## Environment Variables to Add

```bash
# Supabase Edge Functions secrets (set via supabase CLI, NOT in .env)
YOOKASSA_SHOP_ID=       # Your YooKassa shop ID
YOOKASSA_SECRET_KEY=    # Your YooKassa secret key
YOOKASSA_WEBHOOK_SECRET= # Optional: for webhook verification (or use IP whitelist)
```

---

## Version Confidence Notes

| Item | Stated Version | Confidence | Notes |
|------|---------------|------------|-------|
| vite-plugin-pwa | 1.2.0 (keep current) | HIGH | Confirmed from package.json |
| localforage | 1.10.0 | HIGH | Confirmed from package.json, mature/stable |
| @dnd-kit/core | 6.x | MEDIUM | Based on training data. Verify exact latest at install time |
| @dnd-kit/sortable | 8.x | MEDIUM | Based on training data. Verify exact latest at install time |
| react-helmet-async | 2.x | MEDIUM | Based on training data. Verify exact latest at install time |
| YooKassa Widget | v1 (CDN) | HIGH | YooKassa's widget has been v1 for years, stable |
| YooKassa API | v3 | HIGH | Well-established, documented at yookassa.ru/developers |
| Media Session API | browser built-in | HIGH | W3C standard, supported in Chrome/Safari/Firefox |

---

## Sources

- YooKassa official developer docs: https://yookassa.ru/developers/ (HIGH confidence -- official)
- YooKassa widget integration: https://yookassa.ru/developers/payment-acceptance/integration-scenarios/widget (HIGH confidence -- official)
- YooKassa autopayments: https://yookassa.ru/developers/payment-acceptance/scenario-extensions/recurring-payments (HIGH confidence -- official)
- vite-plugin-pwa: version from existing package.json (HIGH confidence)
- localforage: version from existing package.json (HIGH confidence)
- @dnd-kit: based on training data (MEDIUM confidence -- verify versions at install time)
- react-helmet-async: based on training data (MEDIUM confidence -- verify version at install time)
- Media Session API: https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API (HIGH confidence -- MDN/W3C standard)

---

*Stack research: 2026-03-18*
