# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Client-side SPA (Single Page Application) with React + TypeScript, featuring offline-first capabilities and progressive web app (PWA) support.

**Key Characteristics:**
- React 18.3.1 with React Router v6 for client-side routing
- TanStack React Query for server state management and caching
- Context API for client state (Auth, Audio playback)
- Supabase as backend (PostgreSQL, Auth, Storage)
- IndexedDB (via localforage) for offline storage of books
- Service Worker for offline functionality and PWA features
- Vite as build tool with hot module replacement (HMR)

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render user interface using Radix UI primitives + shadcn/ui
- Location: `src/components/`
- Contains: Page components, layout wrappers, reusable UI components, reader components
- Depends on: Contexts, Hooks, UI library (Radix UI), Lucide icons
- Used by: React Router routes in `src/App.tsx`

**Page/Route Layer:**
- Purpose: Map URL routes to full-page components with data fetching
- Location: `src/pages/`
- Contains: Index.tsx, BookPage.tsx, ReaderPage.tsx, AudioPlayerPage.tsx, SearchPage.tsx, ShelvesPage.tsx, ProfilePage.tsx, AdminBookForm.tsx, AdminCollections.tsx, AdminBookList.tsx, AuthPage.tsx, OfflineReaderPage.tsx, DownloadsPage.tsx
- Depends on: Components, Hooks, Contexts, Router
- Used by: React Router in `src/App.tsx`

**State Management Layer:**
- Purpose: Manage global and semi-global state
- Location: `src/contexts/`
- Contains: AuthContext.tsx (user authentication state), AudioContext.tsx (audio player state)
- Depends on: Supabase client
- Used by: Any component within provider boundary

**Data/API Layer:**
- Purpose: Handle server state queries, mutations, caching
- Location: `src/hooks/useBooks.ts`, `src/hooks/useDownloads.ts`, other query hooks
- Contains: React Query hooks for fetching books, user progress, recommendations, etc.
- Depends on: Supabase client, React Query
- Used by: Page and component layer

**Integration Layer:**
- Purpose: Connect to external services
- Location: `src/integrations/supabase/`
- Contains: Supabase client initialization (`client.ts`), auto-generated TypeScript types (`types.ts`)
- Depends on: @supabase/supabase-js
- Used by: Query hooks, contexts, direct component calls

**Offline/Local Storage Layer:**
- Purpose: Persist book data locally for offline reading
- Location: `src/lib/offlineStorage.ts`, `src/lib/offlineSync.ts`
- Contains: LocalForage-backed IndexedDB stores for audio/text/metadata, offline sync logic
- Depends on: localforage, Supabase
- Used by: useDownloads hook, App-level sync logic

**Utilities Layer:**
- Purpose: Shared helper functions
- Location: `src/lib/`
- Contains: Highlight colors, offline storage helpers, sync utilities, UI utilities
- Depends on: None (pure functions)
- Used by: Any layer

## Data Flow

**Book Discovery & Reading:**

1. User navigates to `/` (Index.tsx)
2. Page fetches popular/new books via `usePopularBooks()` and `useNewBooks()` hooks
3. Hooks use React Query to call Supabase `books` table
4. Books render as BookCard components with metadata
5. User clicks book → navigates to `/book/:id` (BookPage.tsx)
6. BookPage fetches full book details, key ideas, similar books via query hooks
7. User clicks "Read" → navigates to `/book/:id/read` (ReaderPage.tsx)
8. ReaderPage loads markdown summary and highlight history from Supabase
9. Content renders with ReactMarkdown + custom highlight rendering logic
10. User selections tracked via `useNativeSelection` hook, stored via mutations

**Audio Playback Flow:**

1. User clicks audio button → triggers `play()` from AudioContext
2. AudioContext sets audio element `src`, loads metadata, seeks to saved position
3. If user exists, fetches last saved position from `user_progress` table
4. Audio plays with playback rate saved in localStorage
5. On time update, debounced `savePosition()` upserts progress to Supabase
6. User can skip, seek, change speed via AudioContext methods
7. Final position saved to DB on stop or navigation

**Offline Sync Flow:**

1. `App.tsx` wraps component tree with providers including `useOfflineSync()` hook
2. `useOfflineSync()` watches `useOnlineStatus()` (via online/offline events)
3. When going offline, app restricts routing to `/downloads` and `/offline/read/:id`
4. When going back online after being offline, `syncOfflineProgress()` runs
5. Syncs all locally-stored progress changes to Supabase
6. Toast notification confirms sync completion

**Download & Offline Storage:**

1. User clicks download on BookPage → shows DownloadDialog
2. Dialog allows selecting "text only", "audio only", or "both"
3. `useDownloads().download()` fetches content blobs from Supabase Storage
4. Content stored in IndexedDB via localforage stores (audio, text, meta)
5. Progress tracked as blob chunks download
6. Metadata (title, author, sizes) stored separately for offline browsing
7. Later, user can view offline books on DownloadsPage or OfflineReaderPage

**State Management:**

- **Auth State:** Managed by AuthContext, synced with Supabase auth state changes
- **Audio State:** Managed by AudioContext, persisted in audioRef and localStorage for speed preference
- **Server State:** Managed by React Query, cached with queryKey patterns, revalidated on mutation
- **Form State:** Managed locally with useState in components (e.g., AdminBookForm)
- **UI State:** Brief local state in components (modals, dropdowns, selections)

## Key Abstractions

**useBooks Hook Family:**
- Purpose: Query interfaces for book data
- Examples: `usePublishedBooks()`, `usePopularBooks()`, `useNewBooks()`, `useBook()`, `useKeyIdeas()`, `useCollectionBooks()`
- Pattern: React Query `useQuery` wrappers around Supabase `.select().eq().order()` chains
- Location: `src/hooks/useBooks.ts`

**AudioContext:**
- Purpose: Centralized audio player state and control
- Examples: Provides `play()`, `togglePlay()`, `seek()`, `skip()`, `setSpeed()`, `stop()`
- Pattern: React Context with ref to HTMLAudioElement and debounced save of progress
- Location: `src/contexts/AudioContext.tsx`

**Offline Storage Abstraction:**
- Purpose: Hide IndexedDB complexity behind high-level save/load functions
- Examples: `saveTextOffline()`, `saveAudioOffline()`, `saveBookMeta()`, `deleteBookOffline()`
- Pattern: LocalForage instances with metadata tracking and storage quota enforcement
- Location: `src/lib/offlineStorage.ts`

**Component Composition:**
- Purpose: Reusable UI building blocks from Radix UI + shadcn/ui
- Examples: Button, Dialog, Sheet, Tabs, Skeleton, Input, Textarea
- Pattern: Accessible, styled React components with CSS-in-JS (Tailwind)
- Location: `src/components/ui/`

## Entry Points

**Application Entry:**
- Location: `src/main.tsx`
- Triggers: Browser navigation to app URL
- Responsibilities:
  - Register PWA service worker
  - Mount React root to `#root` div
  - Confirm update prompts from SW

**Root App Component:**
- Location: `src/App.tsx`
- Triggers: Render entry point
- Responsibilities:
  - Initialize React Query QueryClient
  - Wrap with providers: QueryClientProvider, TooltipProvider, BrowserRouter, AuthProvider, AudioProvider
  - Define all routes via `<Routes>` and `AppRoutes` component
  - Handle offline/online routing logic
  - Render UI for Sonner and default toasters

**AppLayout Wrapper:**
- Location: `src/components/layout/AppLayout.tsx`
- Triggers: Applied to routes using `<AppLayout />` element
- Responsibilities:
  - Provide consistent max-width and responsive container
  - Render `<Outlet />` for nested route content
  - Include persistent BottomNav for mobile navigation

**Index (Home):**
- Location: `src/pages/Index.tsx`
- Route: `/`
- Responsibilities:
  - Display featured, popular, and new books
  - Show personalized recommendations if logged in
  - Render collections
  - Handle install prompt for PWA

## Error Handling

**Strategy:** Combination of React error boundaries (not visible in code), try-catch in async operations, React Query error states, and user-facing toast notifications.

**Patterns:**

- **API Errors:** React Query catches errors in `queryFn`, exposed as `error` property. Components check `if (error)` and render error UI or toast.

  Example from `useBooks.ts`:
  ```typescript
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("status", "published");
  if (error) throw error;  // React Query catches this
  ```

- **Mutation Errors:** Mutations in components (e.g., favorite book, write note) catch errors and show toast:

  Example from BookPage.tsx:
  ```typescript
  const { error } = await supabase.from("user_favorites").insert(...);
  if (error) {
    toast({ title: "Error", description: error.message });
  }
  ```

- **Offline Errors:** When offline, routes redirect to `/downloads`. Sync errors on reconnect are logged but don't block app.

- **Audio Errors:** Audio playback errors caught by `.catch(() => {})` to prevent unhandled promise rejections.

## Cross-Cutting Concerns

**Logging:** Console logging only; no external logging service detected. Some debug logging in offline sync.

**Validation:** Client-side validation via:
- Zod schemas (imported in dependencies but not visible in sample files)
- React Hook Form for form validation (used in admin forms)
- Manual prop checks (e.g., `if (!id) return`)

**Authentication:**
- Supabase Auth handles session persistence via localStorage
- AuthContext wraps auth state and provides signUp, signIn, signOut methods
- Routes check `useAuth().user` to determine access (e.g., admin checks)
- `useIsAdmin()` and `useAccessControl()` hooks encapsulate permission logic

**Offline Detection:**
- `useOnlineStatus()` hook uses browser online/offline events
- App routing switches based on `isOnline` state
- Sync triggered automatically on reconnection

**Styling:**
- Tailwind CSS for utility classes
- Radix UI for unstyled, accessible component primitives
- shadcn/ui for pre-styled Radix components
- Custom CSS in `src/App.css` and `src/index.css` for global styles

**Performance:**
- React Query caching reduces redundant API calls
- Lazy loading of book covers from Supabase Storage (CDN cached)
- PWA caching via Workbox: fonts, API responses, storage blobs
- Debounced audio position saves (3 second delay)

---

*Architecture analysis: 2026-03-18*
