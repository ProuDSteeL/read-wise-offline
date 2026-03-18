# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
read-wise-offline/
├── src/                          # Main source code
│   ├── main.tsx                  # Entry point (React root mount + PWA registration)
│   ├── App.tsx                   # Root component (routing, providers)
│   ├── App.css                   # Root styles
│   ├── index.css                 # Global styles (Tailwind imports, custom utilities)
│   ├── vite-env.d.ts             # Vite type definitions
│   ├── components/               # Reusable and page-level components
│   │   ├── layout/               # Layout components (app shell, nav)
│   │   ├── reader/               # Reader-specific components (selection toolbar)
│   │   ├── ui/                   # shadcn/ui + Radix UI primitive components (~50 files)
│   │   ├── BookCard.tsx          # Book display card
│   │   ├── ContinueCard.tsx      # "Continue reading" card
│   │   ├── DownloadDialog.tsx    # Download modal
│   │   ├── KeyIdeaCard.tsx       # Key idea display card
│   │   ├── MiniAudioPlayer.tsx   # Inline audio player widget
│   │   ├── NavLink.tsx           # Styled navigation link
│   │   ├── PaywallPrompt.tsx     # Subscription upsell dialog
│   │   └── SectionHeader.tsx     # Section title component
│   ├── contexts/                 # Global state providers
│   │   ├── AuthContext.tsx       # User authentication state
│   │   └── AudioContext.tsx      # Audio player state & controls
│   ├── hooks/                    # Custom React hooks
│   │   ├── useBooks.ts           # Book data queries (published, popular, new, single, key ideas, collections)
│   │   ├── useDownloads.ts       # Offline download logic
│   │   ├── useOfflineSync.ts     # Sync progress when going back online
│   │   ├── useOnlineStatus.ts    # Detect online/offline status
│   │   ├── useAccessControl.ts   # Permission checks (premium, download limits)
│   │   ├── useIsAdmin.ts         # Admin role check
│   │   ├── usePushNotifications.ts # Push notification setup
│   │   ├── useRecommendations.ts # Personalized book recommendations
│   │   ├── useSimilarBooks.ts    # Similar books query
│   │   ├── useUserData.ts        # User profile and progress queries
│   │   ├── useSummary.ts         # Book summary query
│   │   ├── useSubscription.ts    # User subscription status
│   │   ├── useProfileStats.ts    # Reading stats aggregation
│   │   ├── useNativeSelection.ts # Text selection tracking for highlights
│   │   ├── useInstallPrompt.ts   # PWA install prompt
│   │   ├── use-toast.ts          # Toast notification hook
│   │   └── use-mobile.tsx        # Mobile viewport detection
│   ├── integrations/             # External service integrations
│   │   └── supabase/             # Supabase backend
│   │       ├── client.ts         # Supabase client initialization
│   │       └── types.ts          # Auto-generated TypeScript types (Database schema)
│   ├── lib/                      # Utility functions & helpers
│   │   ├── offlineStorage.ts     # IndexedDB wrapper (save/load/delete books offline)
│   │   ├── offlineSync.ts        # Sync offline changes to server
│   │   ├── highlightColors.ts    # Highlight color mappings
│   │   └── utils.ts              # General utilities (cn function for Tailwind merge)
│   ├── pages/                    # Page components (full-page routes)
│   │   ├── Index.tsx             # Home page (featured books, collections)
│   │   ├── BookPage.tsx          # Book detail page
│   │   ├── ReaderPage.tsx        # Text reader with markdown, highlights, notes
│   │   ├── AudioPlayerPage.tsx   # Audio player page
│   │   ├── SearchPage.tsx        # Search & filter books
│   │   ├── ShelvesPage.tsx       # User's custom shelves
│   │   ├── ProfilePage.tsx       # User profile & stats
│   │   ├── DownloadsPage.tsx     # Downloaded books browser
│   │   ├── OfflineReaderPage.tsx # Offline text reader
│   │   ├── AdminBookForm.tsx     # Create/edit book (admin)
│   │   ├── AdminBookList.tsx     # Manage books (admin)
│   │   ├── AdminCollections.tsx  # Manage collections (admin)
│   │   ├── AuthPage.tsx          # Login/signup form
│   │   ├── ResetPasswordPage.tsx # Password reset flow
│   │   └── NotFound.tsx          # 404 page
│   └── test/                     # Test utilities & examples
│       ├── setup.ts              # Vitest setup (matchMedia mock)
│       └── example.test.ts       # Example test file
├── public/                       # Static assets served as-is
│   ├── favicon.ico               # App icon
│   ├── icon-192.png              # PWA icon (small)
│   ├── icon-512.png              # PWA icon (large)
│   └── placeholder.svg           # Placeholder image
├── supabase/                     # Supabase configuration
│   ├── migrations/               # SQL migration files
│   └── functions/                # Supabase Edge Functions (serverless)
│       ├── generate-vapid-keys/  # Generate push notification keys
│       └── send-notifications/   # Send push notifications
├── flutter_app/                  # Flutter mobile app (separate)
│   └── lib/                      # Flutter source code
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite build config (PWA plugin, aliases)
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript root config
├── tsconfig.app.json             # TypeScript app-specific config
├── tsconfig.node.json            # TypeScript build tool config
├── eslint.config.js              # ESLint configuration
├── postcss.config.js             # PostCSS config (Tailwind)
├── playwright.config.ts          # Playwright E2E test config
├── playwright-fixture.ts         # Playwright test utilities
├── components.json               # shadcn/ui config (component paths)
├── package.json                  # Project manifest & dependencies
├── package-lock.json             # Dependency lock file
├── .env                          # Environment variables (not tracked)
├── .gitignore                    # Git ignore patterns
├── .github/workflows/            # GitHub Actions CI/CD
├── .planning/                    # GSD planning documents
│   └── codebase/                 # Codebase analysis docs
└── README.md                     # Project documentation
```

## Directory Purposes

**src/:**
- Purpose: All TypeScript/React source code
- Contains: Components, hooks, contexts, pages, utilities, integrations
- Key files: `main.tsx`, `App.tsx`

**src/components/:**
- Purpose: Reusable and page-level React components
- Contains: Layout wrappers, UI primitives, feature-specific components
- Key files: `BookCard.tsx`, `MiniAudioPlayer.tsx`, `DownloadDialog.tsx`, `ui/*`

**src/components/layout/:**
- Purpose: App shell and navigation components
- Contains: AppLayout (responsive container), BottomNav (mobile nav bar)
- Used by: Main app routes wrapped with `<AppLayout />`

**src/components/reader/:**
- Purpose: Text reader-specific components
- Contains: SelectionToolbar (highlight selection controls)
- Used by: ReaderPage.tsx

**src/components/ui/:**
- Purpose: Pre-styled shadcn/ui components based on Radix UI
- Contains: ~50 files (Button, Dialog, Sheet, Tabs, Skeleton, Input, Textarea, etc.)
- Pattern: Each file exports one or more components with Tailwind styling

**src/contexts/:**
- Purpose: Global state providers
- Contains: AuthContext (user auth), AudioContext (audio player)
- Wrap: Root App component via provider chain in App.tsx

**src/hooks/:**
- Purpose: Custom React hooks for data fetching, state management, browser APIs
- Contains: useBooks, useDownloads, useAuth, useAudio, etc.
- Pattern: Most are React Query `useQuery` wrappers; some manage side effects

**src/integrations/supabase/:**
- Purpose: Supabase backend configuration
- Contains: Supabase client (initialized with env vars), auto-generated DB types
- Pattern: Single client instance exported for use across app

**src/lib/:**
- Purpose: Utility functions and helper libraries
- Contains: Offline storage API, sync logic, styling utilities
- Pattern: Pure functions and configurations, no React components

**src/pages/:**
- Purpose: Full-page components matched to routes
- Contains: Index, BookPage, ReaderPage, AudioPlayerPage, SearchPage, ShelvesPage, ProfilePage, DownloadsPage, OfflineReaderPage, Admin pages, Auth pages
- Pattern: Use hooks for data, compose components, handle page-level logic

**src/test/:**
- Purpose: Test utilities and examples
- Contains: Vitest setup configuration, example test file
- Pattern: ESM imports, Jest-compatible assertions via @testing-library/jest-dom

**public/:**
- Purpose: Static assets copied to dist/ during build
- Contains: Icons (favicon, PWA icons), placeholders

**supabase/:**
- Purpose: Backend infrastructure configuration
- Contains: SQL migrations, serverless functions for notifications

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React root mount, PWA registration
- `src/App.tsx`: Root component, routing, providers, offline detection
- `index.html`: HTML shell with `<div id="root">` for React

**Configuration:**
- `vite.config.ts`: Build config (PWA plugin, path aliases, HMR settings)
- `tailwind.config.ts`: Tailwind design tokens and plugin configuration
- `tsconfig.json`: TypeScript compiler options
- `.env`: Supabase URL and API keys (not committed)

**Core Logic:**
- `src/contexts/AuthContext.tsx`: Authentication state, session management
- `src/contexts/AudioContext.tsx`: Audio playback state and controls
- `src/lib/offlineStorage.ts`: IndexedDB-backed offline data persistence
- `src/lib/offlineSync.ts`: Sync offline progress changes to server
- `src/hooks/useBooks.ts`: All book data queries

**Testing:**
- `src/test/setup.ts`: Vitest/Jest environment setup
- `src/test/example.test.ts`: Example test structure
- `playwright.config.ts`: E2E test framework config
- `playwright-fixture.ts`: Custom test utilities

## Naming Conventions

**Files:**
- React components: PascalCase (`BookCard.tsx`, `ReaderPage.tsx`)
- Hooks: camelCase with `use` prefix (`useBooks.ts`, `useDownloads.ts`)
- Utilities: camelCase (`offlineStorage.ts`, `highlightColors.ts`)
- Context: PascalCase (`AuthContext.tsx`)
- Tests: `*.test.ts` or `*.spec.ts`

**Directories:**
- Feature directories: plural nouns (`components/`, `hooks/`, `pages/`, `contexts/`)
- UI subdirectories: descriptive (`ui/`, `layout/`, `reader/`)
- Supabase paths: `integrations/supabase/`

**Imports:**
- Path alias: `@/` resolves to `src/`
- Example: `import { Button } from "@/components/ui/button";`

**Variables & Functions:**
- camelCase for variables and functions
- UPPER_CASE for constants (e.g., `DEFAULT_LIMIT_MB`, `FONT_SIZES`)
- Prefix hooks with `use` (e.g., `useBooks`, `useOfflineSync`)

## Where to Add New Code

**New Feature (e.g., bookmarks):**
- Primary code: `src/pages/BookmarksPage.tsx` (new page)
- Hook for data: `src/hooks/useBookmarks.ts` (new hook for queries)
- Components: `src/components/BookmarkCard.tsx` if reusable
- Context: if global state needed, extend `src/contexts/`
- Routes: Add route in `src/App.tsx`
- Tests: `src/test/bookmarks.test.ts`

**New Component/Module:**
- Implementation: `src/components/YourComponent.tsx` (if UI), or `src/lib/yourModule.ts` (if utility)
- If complex: Create subdirectory (e.g., `src/components/bookmarks/`)
- Export from parent: `src/components/index.ts` (barrel file) if creating barrel
- Use: Import via path alias `import YourComponent from "@/components/YourComponent";`

**Utilities:**
- Shared helpers: `src/lib/utilities.ts`
- Specific domain: `src/lib/domainName.ts` (e.g., `offlineStorage.ts`)
- Type definitions: Co-locate with usage or in `src/integrations/supabase/types.ts`

**Hooks:**
- Data fetching: `src/hooks/useData.ts` (React Query wrapper)
- Side effects: `src/hooks/useSideEffect.ts` (useEffect + state)
- Browser APIs: `src/hooks/useBrowser.ts` (e.g., useOnlineStatus)

## Special Directories

**src/components/ui/:**
- Purpose: Pre-styled Radix UI components
- Generated by: shadcn/ui CLI
- Pattern: Each component is a thin wrapper around Radix primitive + Tailwind classes
- Committed: Yes (tracked in git)
- Do not edit: Generally, but safe to customize Tailwind classes
- Add new: Use `npx shadcn-ui@latest add ComponentName`

**public/:**
- Purpose: Static assets copied as-is to build output
- Generated: No
- Committed: Yes
- Usage: Favicon, PWA icons, public images

**.planning/:**
- Purpose: GSD codebase analysis and planning documents
- Generated by: GSD analysis tools
- Committed: Yes
- Do not edit: Generated files, but may be referenced in reviews

**supabase/migrations/:**
- Purpose: SQL schema version control
- Generated: Manual creation
- Committed: Yes
- Usage: Applied in order to initialize/upgrade database

**supabase/functions/:**
- Purpose: Serverless backend functions (Edge Functions)
- Generated: Manual or via Supabase CLI
- Deployed: To Supabase
- Usage: Send notifications, generate keys, etc.

---

*Structure analysis: 2026-03-18*
