# Phase 8: PWA Hardening - Research

**Researched:** 2026-03-19
**Domain:** Progressive Web App — caching, install UX, offline fallback, manifest/icons
**Confidence:** HIGH

## Summary

This phase hardens the existing PWA foundation into a production-quality experience. The app already has vite-plugin-pwa 1.2.0 configured with basic Workbox caching, a `useInstallPrompt` hook with dismiss memory, an `OfflineBanner` component, and 192/512 icons. However, the current setup has several gaps: icons are purple (not matching the app's burgundy/sage theme), icon-192.png is actually 1024x1024, the `purpose: "any maskable"` declaration is an anti-pattern, there is no dedicated offline fallback page, the install prompt shows to all users (not just logged-in), and there is no visit-count gating.

**Primary recommendation:** Enhance the existing vite-plugin-pwa config with proper caching strategies, fix icon issues (separate maskable/any icons, correct colors), add a beautiful offline fallback page, and refine the install prompt with auth-gating and visit counting.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PWA-01 | Service Worker caching strategies — precache static assets, runtime cache API, cache-first covers | Existing workbox config already handles most of this; needs refinement of cache names, expiration, and separation of signed URL patterns |
| PWA-02 | Install Prompt — smart banner for logged-in users after 2-3 visits, dismiss memory | Existing `useInstallPrompt` hook has dismiss logic; needs auth-gating via `useAuth` and visit counter in localStorage |
| PWA-03 | Offline UX — beautiful offline fallback, catalog from cache, stale indicator | Current offline routing redirects to `/downloads`; needs a proper offline fallback page and stale-content indicator |
| PWA-04 | Manifest & Icons — proper manifest, all sizes, theme_color, splash screens | Current manifest has wrong name/colors, purple icons, "any maskable" anti-pattern; needs full replacement |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | 1.2.0 (installed) | PWA plugin for Vite — generates SW, manifest | Already in project, handles Workbox integration |
| workbox (via vite-plugin-pwa) | 7.x (bundled) | Service worker caching strategies | Industry standard, auto-bundled by vite-plugin-pwa |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| virtual:pwa-register | (built-in) | SW registration in app code | Already used in main.tsx |

### No New Dependencies Needed
The existing `vite-plugin-pwa` 1.2.0 provides everything required. No additional npm packages are needed for this phase.

## Architecture Patterns

### Current State (What Exists)

```
vite.config.ts          — VitePWA plugin with generateSW strategy, 4 runtimeCaching rules
src/main.tsx            — registerSW with onNeedRefresh callback
src/hooks/useInstallPrompt.ts — beforeinstallprompt handler with 7-day dismiss memory
src/pages/Index.tsx     — Install banner rendered on homepage
src/components/OfflineBanner.tsx — Fixed top banner when offline
src/hooks/useOnlineStatus.ts — navigator.onLine reactive hook
src/App.tsx             — Offline routing: redirects all routes to /downloads when offline
public/icon-192.png     — 1024x1024 PNG (wrong size!), purple book icon
public/icon-512.png     — 512x512 JPEG (should be PNG), purple book icon
```

### Target Architecture

```
vite.config.ts          — Enhanced caching strategies, proper icon entries, correct manifest
src/main.tsx            — registerSW (no changes needed)
src/hooks/useInstallPrompt.ts — Add auth-gating + visit counter (2-3 visits threshold)
src/pages/Index.tsx     — Conditional install banner (logged-in only)
src/components/OfflineBanner.tsx — Keep as-is (already works well)
src/pages/OfflineFallback.tsx — NEW: Beautiful offline page with cached catalog access
src/App.tsx             — Update offline routing to show OfflineFallback for uncached routes
public/icon-192.png     — Proper 192x192 PNG, burgundy/cream theme, purpose "any"
public/icon-512.png     — Proper 512x512 PNG, burgundy/cream theme, purpose "any"
public/icon-maskable-192.png — NEW: 192x192 maskable icon with safe zone padding
public/icon-maskable-512.png — NEW: 512x512 maskable icon with safe zone padding
public/apple-touch-icon.png  — NEW: 180x180 Apple touch icon
```

### Pattern 1: Separate Maskable and Standard Icons
**What:** Never use `purpose: "any maskable"` on a single icon. Create separate icon files.
**When to use:** Always for PWA manifests.
**Why:** Combined purpose causes incorrect rendering — too much padding on some platforms, too little on others. Chrome explicitly discourages this pattern.

```typescript
// In vite.config.ts manifest.icons
icons: [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
]
```

### Pattern 2: Caching Strategy Per Content Type
**What:** Different Workbox strategies for different URL patterns.
**When to use:** When app has mixed content types (static, API, images).

```typescript
runtimeCaching: [
  // Google Fonts — immutable, cache forever
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-stylesheets",
      expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-webfonts",
      expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  // Supabase REST API — stale-while-revalidate for catalog data
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "supabase-api-cache",
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  // Supabase Storage PUBLIC images (book covers) — cache-first
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "supabase-covers-cache",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  // Supabase Storage SIGNED URLs (audio) — DO NOT cache (signed URLs expire)
  // These are handled by localforage in useDownloads, not by SW
]
```

### Pattern 3: Visit-Gated Install Prompt
**What:** Only show install prompt after user has visited 2-3 times and is logged in.
**When to use:** To avoid annoying first-time visitors.

```typescript
const VISIT_COUNT_KEY = "pwa-visit-count";
const VISIT_THRESHOLD = 3;

// In useInstallPrompt hook:
// 1. On mount, increment visit count in localStorage
// 2. Check: user is logged in AND visitCount >= VISIT_THRESHOLD AND not dismissed
// 3. Only then capture the beforeinstallprompt event
```

### Anti-Patterns to Avoid
- **`purpose: "any maskable"` on one icon:** Causes bad rendering. Use separate icons.
- **Caching signed URLs in SW:** Signed URLs expire (24h in this app). Do not add runtime caching for Supabase signed storage URLs. Offline audio is handled by localforage via `useDownloads`.
- **Showing install prompt immediately:** Annoys users. Gate behind auth + visit count.
- **Using `confirm()` for SW updates:** Current code uses `confirm()` — it works but is not beautiful. Could be improved with a toast, but this is optional polish.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker generation | Custom SW file | vite-plugin-pwa generateSW strategy | Workbox handles precaching, versioning, and runtime caching automatically |
| Icon generation at multiple sizes | Manual Photoshop/Figma export per size | pwa-asset-generator or sharp CLI script | Need 5+ icon files at exact sizes; manual process is error-prone |
| Offline detection | Custom fetch-based ping | `useOnlineStatus` hook (already exists) | navigator.onLine + event listeners is the standard approach |
| Cache invalidation | Manual cache.delete calls | Workbox expiration plugin (configured via vite-plugin-pwa) | Workbox handles max entries, max age, and cache cleanup |

**Key insight:** vite-plugin-pwa with `generateSW` strategy already does the heavy lifting. This phase is mostly configuration refinement and UI work, not SW implementation.

## Common Pitfalls

### Pitfall 1: Icon-192.png is Actually 1024x1024
**What goes wrong:** The current `icon-192.png` is a 1024x1024 image. While browsers downscale, this wastes bandwidth and may cause rendering artifacts on some devices.
**Why it happens:** Original upload was not resized.
**How to avoid:** Generate properly sized icons at exact pixel dimensions (192x192, 512x512).
**Warning signs:** Lighthouse audit will flag oversized icons.

### Pitfall 2: Icon-512.png is JPEG, Not PNG
**What goes wrong:** The manifest declares `type: "image/png"` but icon-512.png is actually JPEG. Some platforms may reject it.
**Why it happens:** File extension does not match actual format.
**How to avoid:** Ensure all icon files are actual PNGs with correct headers.

### Pitfall 3: Caching Supabase Signed Audio URLs
**What goes wrong:** If the SW caches a signed URL response, the cached entry becomes useless after the URL's 24h expiry.
**Why it happens:** Blanket caching of `supabase.co/storage` URLs catches both public covers and signed audio.
**How to avoid:** The current regex only matches `/object/public/` paths (correct). Ensure signed URLs (which use `/object/sign/` or query params) are NOT matched. The existing regex is safe.

### Pitfall 4: Offline Routing Redirects All to /downloads
**What goes wrong:** When offline, user trying to browse catalog sees only the downloads page. There's no graceful fallback for pages that might be in the SW cache.
**Why it happens:** `App.tsx` has a blanket redirect: if `!isOnline`, only `/downloads` and `/offline/read/:id` routes are available.
**How to avoid:** For PWA-03, the offline routing should be smarter — allow cached pages to load, and show a beautiful fallback for truly uncached content. However, changing the App.tsx routing logic is risky since it affects the entire app. A safer approach: keep the current routing but make the `/downloads` page or a new `/offline` page serve as a beautiful offline hub.

### Pitfall 5: theme_color Mismatch Between manifest and meta tag
**What goes wrong:** `index.html` has `<meta name="theme-color" content="#FAFAF8">` (cream) but `vite.config.ts` manifest has `theme_color: "#551118"` (burgundy). Inconsistency causes jarring color transitions.
**Why it happens:** Set at different times by different people.
**How to avoid:** Pick one color and use it consistently. The burgundy primary (`#551118` = `hsl(350, 78%, 21%)`) is the brand color — use it for `theme_color` in both places for a cohesive status bar. Or use the background cream for a subtle look. Choose one.

### Pitfall 6: App Name Discrepancy
**What goes wrong:** The manifest says `name: "Букс — саммари книг"` and `short_name: "Букс"`, but the user requirement says the name should be "Саммари" (or the original branding).
**Why it happens:** Name may have been changed during development.
**How to avoid:** Clarify with the user. The requirement says `name: "Саммари"` — update accordingly.

## Code Examples

### Enhanced vite.config.ts PWA Configuration
```typescript
VitePWA({
  registerType: "autoUpdate",
  includeAssets: [
    "favicon.ico",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-192.png",
    "icon-maskable-512.png",
    "apple-touch-icon.png",
    "placeholder.svg",
  ],
  manifest: {
    name: "Саммари",
    short_name: "Саммари",
    description: "Саммари нон-фикшн книг на русском языке",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#551118",
    orientation: "portrait",
    lang: "ru",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/~oauth/],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "supabase-api-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "supabase-covers-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})
```

### Visit-Gated Install Prompt Hook
```typescript
// src/hooks/useInstallPrompt.ts — enhanced
const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;
const VISIT_COUNT_KEY = "pwa-visit-count";
const VISIT_THRESHOLD = 3;

export const useInstallPrompt = (isLoggedIn: boolean) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Increment visit count
    const count = Number(localStorage.getItem(VISIT_COUNT_KEY) || "0") + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_DAYS) return;
      }
      const visitCount = Number(localStorage.getItem(VISIT_COUNT_KEY) || "0");
      if (!isLoggedIn || visitCount < VISIT_THRESHOLD) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isLoggedIn]);

  // ... promptInstall and dismiss stay the same
};
```

### Offline Fallback Page
```typescript
// src/pages/OfflineFallback.tsx — beautiful offline page
const OfflineFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
    <WifiOff className="h-16 w-16 text-muted-foreground/40 mb-6" />
    <h1 className="text-2xl font-bold text-foreground mb-2">Нет подключения</h1>
    <p className="text-sm text-muted-foreground mb-8 max-w-xs">
      Эта страница недоступна офлайн. Перейдите к загруженным книгам или дождитесь подключения.
    </p>
    <a
      href="/downloads"
      className="rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground tap-highlight"
    >
      Мои загрузки
    </a>
  </div>
);
```

### Apple Touch Icon Meta Tags
```html
<!-- Add to index.html <head> -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Саммари">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `purpose: "any maskable"` | Separate icons per purpose | 2023+ Chrome guidance | Prevents incorrect icon rendering |
| Manual SW files | vite-plugin-pwa generateSW | Stable since 2022 | Zero-config precaching |
| Single icon size | Multiple sizes (192, 512) + maskable | PWA standard | Proper rendering on all devices |
| `confirm()` for SW updates | Toast/snackbar notification | UX best practice | Non-blocking update notification |

**Deprecated/outdated:**
- `purpose: "any maskable"` — explicitly discouraged by Chrome team, use separate icons
- JPEG icons in manifest — always use PNG for transparency support and correct `type` declaration

## Open Questions

1. **App Name: "Букс" vs "Саммари"**
   - What we know: Current manifest uses "Букс", user requirement says "Саммари"
   - What's unclear: Which is the final branding decision
   - Recommendation: Use "Саммари" as specified in PWA-04 requirement. Update both manifest and apple-mobile-web-app-title.

2. **Icon Design**
   - What we know: Current icons are purple with a book. App theme is burgundy (#551118) + sage (#87AB98) + cream (#FAFAF8).
   - What's unclear: Exact icon design desired
   - Recommendation: Generate new icons using the app's burgundy primary on cream background with a simple book/reading motif. Use SVG source for crisp scaling. Can use canvas/sharp to generate programmatically or create a simple SVG manually.

3. **Offline Routing Strategy**
   - What we know: Current App.tsx redirects ALL offline traffic to /downloads. The SW precaches all JS/CSS/HTML so the SPA shell loads offline.
   - What's unclear: Whether to change the App.tsx offline routing logic or keep it
   - Recommendation: Keep the current offline routing (it works and is safe), but make the offline experience more beautiful. Add an `OfflineFallback` component that can be shown instead of the current bare redirect. The key improvement is visual — show a branded page with navigation to downloads, not just dump users on the downloads page.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PWA-01 | Workbox config produces correct caching rules | manual | Lighthouse audit in browser | N/A (config-only) |
| PWA-02 | Install prompt shows only for logged-in users after 3 visits | unit | `npx vitest run src/hooks/useInstallPrompt.test.ts` | Wave 0 |
| PWA-03 | OfflineFallback renders correctly | unit | `npx vitest run src/pages/OfflineFallback.test.ts` | Wave 0 |
| PWA-04 | Manifest has correct name, icons, theme_color | manual | Lighthouse PWA audit | N/A (config-only) |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + Lighthouse PWA audit

### Wave 0 Gaps
- [ ] `src/hooks/useInstallPrompt.test.ts` — covers PWA-02 (visit gating, auth gating, dismiss logic)
- [ ] `src/pages/OfflineFallback.test.tsx` — covers PWA-03 (renders offline page)

## Sources

### Primary (HIGH confidence)
- Project source code — vite.config.ts, useInstallPrompt.ts, App.tsx, index.html, public/ directory
- [vite-pwa-org.netlify.app](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements) — PWA minimal requirements
- [vite-pwa-org.netlify.app/workbox](https://vite-pwa-org.netlify.app/workbox/generate-sw) — generateSW workbox docs

### Secondary (MEDIUM confidence)
- [MDN PWA icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons) — icon sizes and purposes
- [dev.to — why not "any maskable"](https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78) — icon purpose best practices
- [chapimaster.com — custom offline page](https://www.chapimaster.com/programming/vite/create-custom-offline-page-react-pwa) — offline fallback patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - vite-plugin-pwa 1.2.0 already installed and configured, no new deps needed
- Architecture: HIGH - direct analysis of existing code reveals exact current state and gaps
- Pitfalls: HIGH - icons verified by reading actual files, caching config inspected directly
- Icon design: MEDIUM - design is subjective, but color values are from CSS source

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, 30 days)
