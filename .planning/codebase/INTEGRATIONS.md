# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Supabase:**
- Supabase Cloud Platform - Primary backend providing database, authentication, real-time features, and file storage
  - SDK/Client: @supabase/supabase-js 2.99.1
  - Auth: `VITE_SUPABASE_PUBLISHABLE_KEY` (anonymous public key)
  - URL: `VITE_SUPABASE_URL` (endpoints like `https://zouwipenozdyquvfyjzi.supabase.co`)
  - Implementation: `src/integrations/supabase/client.ts` with localStorage persistence and auto token refresh

**Cloudflare R2:**
- Cloudflare R2 object storage - Referenced in Open Graph image URLs
  - Used for: Static asset storage (e.g., preview images at `https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/`)

## Data Storage

**Databases:**
- PostgreSQL 14.4 - Hosted on Supabase
  - Client: @supabase/supabase-js with TypeScript types generated from schema
  - Connection: Supabase REST API via authenticated HTTP requests
  - Migrations: Stored in `supabase/migrations/` with database schema

**Tables:**
- `books` - Book metadata, title, author, cover_url, description, categories, tags, ratings, read/listen times
- `summaries` - Text summaries and audio URLs for each book
- `key_ideas` - Key takeaways organized by book
- `user_progress` - Reading/listening position tracking per user
- `user_ratings` - User book ratings and reviews
- `user_shelves` - User book collections (favorite, read, want_to_read)
- `highlights` - User text highlighting and bookmarks
- `user_subscriptions` - Subscription tier tracking
- `push_subscriptions` - Web Push API subscription endpoints
- `categories` - Book category taxonomy
- Collections - Admin-managed book collections

**File Storage:**
- Supabase Storage - File hosting for cover images and audio files
  - Access: Public via `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`
  - Used for: Book covers, summary audio files
  - PWA Caching: Configured in vite.config.ts with CacheFirst strategy for storage objects

**Local Storage:**
- IndexedDB via localforage - Offline-first data persistence
  - Audio files: `audioStore` instance - Downloaded summary audio blobs
  - Text content: `textStore` instance - Cached summary text
  - Metadata: `metaStore` instance - Book cover URLs and metadata
  - Size tracking: Up to 500MB default configurable via localStorage key "offline-storage-limit-mb"
  - Implementation: `src/lib/offlineStorage.ts` with size limits and cleanup

**Browser Storage:**
- localStorage - Session and user preference data
  - Used for: Offline progress tracking (OFFLINE_PROGRESS_KEY + bookId), storage limits, auth session
  - Implementation: Direct API and context-based access throughout app

**Caching:**
- Service Worker (Workbox) via vite-plugin-pwa - Progressive Web App caching
  - Google Fonts: CacheFirst strategy with 1-year expiration
  - Gstatic fonts: CacheFirst strategy with 1-year expiration
  - Supabase REST API: StaleWhileRevalidate strategy with 24-hour expiration (max 50 entries)
  - Supabase Storage: CacheFirst strategy with 30-day expiration (max 100 entries)
  - Configuration: `vite.config.ts` VitePWA workbox settings

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Built-in authentication system
  - Implementation: Email/password authentication via supabase.auth
  - Features: Password reset, user profile management, session persistence
  - Storage: localStorage for session tokens with auto-refresh
  - Methods used in codebase:
    - `supabase.auth.signUp()` - User registration
    - `supabase.auth.signInWithPassword()` - Login
    - `supabase.auth.signOut()` - Logout
    - `supabase.auth.updateUser()` - Profile/password updates
    - `supabase.auth.resetPasswordForEmail()` - Password reset flow
    - `supabase.auth.onAuthStateChange()` - Auth state subscriptions

**User Profile:**
- User metadata stored in Supabase auth.users table
  - Custom fields: name, email via auth.updateUser()
  - Row-level security policies on all tables

## Monitoring & Observability

**Error Tracking:**
- None detected - No error tracking service integrated (Sentry, Rollbar, etc.)

**Logs:**
- Browser console logging and custom in-app logging only
- No centralized logging service detected

## CI/CD & Deployment

**Hosting:**
- Vercel or similar - Inferred from git history mentioning Lovable deployment
- Static SPA deployment with service worker support

**CI Pipeline:**
- Lovable Agent - Development and deployment orchestration
- GitHub integration via git history and `.github/` directory
- Playwright E2E tests configured but CI runner not specified

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (e.g., https://zouwipenozdyquvfyjzi.supabase.co)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Anonymous API key for client-side operations
- `VITE_SUPABASE_PROJECT_ID` - Project identifier (optional, for reference)

**Secrets location:**
- `.env` file in project root (added to `.gitignore`, not committed)
- Loaded at build time via Vite's import.meta.env mechanism
- Never exposed in client code as they're public anon keys

## Webhooks & Callbacks

**Incoming:**
- OAuth callback: `http://localhost:8080/~oauth` - Handled by Supabase auth flow
- Configured in PWA navigateFallbackDenylist to prevent redirect caching

**Outgoing:**
- Web Push Notifications via browser Push API:
  - Endpoint: Supabase Edge Function at `supabase/functions/send-notifications/`
  - VAPID keys: Public key hardcoded in `src/hooks/usePushNotifications.ts`
  - Implementation: Standard Web Push Protocol with ECDSA P-256 signatures
  - Storage: `push_subscriptions` table for subscription endpoints
- Supabase Functions:
  - `generate-vapid-keys` - Utility for generating Web Push VAPID keys
  - `send-notifications` - Endpoint for broadcasting push notifications
  - Implemented in TypeScript, uses Web Crypto API for signing

## Font Loading

**External Resources:**
- Google Fonts (fonts.googleapis.com and fonts.gstatic.com)
  - Families: Inter (400, 500, 600, 700), Literata (400, 500, 600, 700 with italics)
  - Preconnect links in HTML head with crossorigin for CORS
  - Cached via Service Worker

---

*Integration audit: 2026-03-18*
