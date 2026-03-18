# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript 5.8.3 - All source code and configuration files

**Secondary:**
- JavaScript - Configuration files and build tooling
- SQL - Supabase migrations in `/root/read-wise-offline/supabase/migrations/`

## Runtime

**Environment:**
- Node.js (JavaScript runtime for build tooling)
- Browser (Client-side SPA runtime)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` present
- Bun: `bun.lock` and `bun.lockb` present (alternative package manager)

## Frameworks

**Core:**
- React 18.3.1 - UI framework for building components
- Vite 5.4.19 - Build tool and dev server configured in `vite.config.ts`
- React Router DOM 6.30.1 - Client-side routing

**UI Component Library:**
- Radix UI - Comprehensive headless component library via `@radix-ui/*` packages (25+ components)
- Shadcn - UI component system built on Radix UI primitives, configured via `components.json`

**State Management:**
- TanStack Query (React Query) 5.83.0 - Server state management and caching in `src/App.tsx`
- React Context API - Local state management (AuthContext, AudioContext in `src/contexts/`)

**Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS framework configured in `tailwind.config.ts`
- PostCSS 8.5.6 - CSS preprocessing
- Tailwind Merge 2.6.0 - Merge Tailwind classes
- Tailwindcss Animate 1.0.7 - Animation utilities

**Forms:**
- React Hook Form 7.61.1 - Form state management
- Zod 3.25.76 - Schema validation and TypeScript schema inference
- @hookform/resolvers 3.10.0 - Integration between Hook Form and validation schemas

**Additional Libraries:**
- React Markdown 10.1.0 - Markdown rendering
- Rehype Raw 7.0.0 - Raw HTML support in markdown
- Date-fns 3.6.0 - Date manipulation and formatting
- Recharts 2.15.4 - Charting library
- Input OTP 1.4.2 - OTP input component
- Sonner 1.7.4 - Toast notifications
- Lucide React 0.462.0 - Icon library
- Next Themes 0.3.0 - Theme management (dark mode)
- React Resizable Panels 2.1.9 - Resizable split panes
- Embla Carousel React 8.6.0 - Carousel component
- Cmdk 1.1.1 - Command menu component
- Vaul 0.9.9 - Drawer/modal component
- Class Variance Authority 0.7.1 - Component variant management
- CLSX 2.1.1 - Class name utility

**Testing:**
- Vitest 3.2.4 - Unit testing framework configured in `vitest.config.ts`
- Playwright 1.57.0 - E2E testing configured in `playwright.config.ts`
- @testing-library/react 16.0.0 - React component testing utilities
- @testing-library/jest-dom 6.6.0 - DOM matchers
- JSDOM 20.0.3 - DOM implementation for Node.js

**Build & Dev Tools:**
- @vitejs/plugin-react-swc 3.11.0 - SWC transpiler for React in Vite
- Lovable Tagger 1.1.13 - Component tagging for Lovable development
- Lovable Agent Playwright Config - E2E testing configuration
- ESLint 9.32.0 - Code linting with TypeScript support
- TypeScript ESLint 8.38.0 - TypeScript linting rules
- ESLint Plugin React Hooks 5.2.0 - React hooks linting
- ESLint Plugin React Refresh 0.4.20 - React refresh validation
- Autoprefixer 10.4.21 - CSS vendor prefix addition
- Tailwindcss Typography 0.5.16 - Prose styling plugin
- Globals 15.15.0 - Global variable definitions

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.99.1 - Supabase client for database, auth, and real-time features
- localforage 1.10.0 - IndexedDB wrapper for offline storage of audio/text/metadata

**Infrastructure:**
- vite-plugin-pwa 1.2.0 - Progressive Web App support with service worker and caching configured in `vite.config.ts`

## Configuration

**Environment:**
- Vite environment variables via `import.meta.env`:
  - `VITE_SUPABASE_URL` - Supabase API endpoint
  - `VITE_SUPABASE_PUBLISHABLE_KEY` - Anonymous Supabase key
  - `VITE_SUPABASE_PROJECT_ID` - Supabase project identifier
- `.env` file present containing Supabase configuration (`.env` in `.gitignore`)

**Build:**
- `vite.config.ts` - Main Vite configuration with PWA setup and caching rules
- `tsconfig.json` - Base TypeScript configuration with path aliases (`@/*` → `./src/*`)
- `tsconfig.app.json` - Application TypeScript configuration
- `tsconfig.node.json` - Build tooling TypeScript configuration
- `eslint.config.js` - ESLint configuration with TypeScript support
- `postcss.config.js` - PostCSS configuration
- `components.json` - Shadcn component configuration

## Platform Requirements

**Development:**
- Node.js (version not specified in `.nvmrc` or package.json engines)
- npm or Bun package manager
- Browser with support for IndexedDB, Service Workers, and Web Push API
- Modern TypeScript 5.8+ support

**Production:**
- Web browser supporting ES2020+ JavaScript
- Service Worker support for PWA functionality
- IndexedDB for offline storage
- Supabase cloud infrastructure (PostgreSQL backend)
- Static hosting capable of serving SPA with single-page fallback

---

*Stack analysis: 2026-03-18*
