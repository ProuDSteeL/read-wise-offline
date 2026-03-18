# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `KeyIdeaCard.tsx`, `PaywallPrompt.tsx`, `SelectionToolbar.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useBooks.ts`, `useDownloads.ts`, `useOnlineStatus.ts`)
- Utilities: camelCase (e.g., `offlineStorage.ts`, `highlightColors.ts`, `utils.ts`)
- Context providers: PascalCase (e.g., `AuthContext.tsx`, `AudioContext.tsx`)
- Pages: PascalCase (e.g., `ReaderPage.tsx`, `ProfilePage.tsx`)

**Functions:**
- Named exports: PascalCase for React components and main exports
- Utility functions: camelCase (e.g., `saveTextOffline`, `getStorageLimit`, `formatBytes`, `slugify`)
- Hook functions: camelCase with "use" prefix (e.g., `useOnlineStatus`, `useBooks`)
- Custom hooks returned functions: camelCase (e.g., `play`, `togglePlay`, `seek`)

**Variables:**
- Constants: UPPER_SNAKE_CASE (e.g., `STORAGE_LIMIT_KEY`, `DEFAULT_LIMIT_MB`, `BTN_H`, `BTN_W`, `FONT_SIZES`)
- State variables: camelCase (e.g., `isOnline`, `bookId`, `downloads`, `totalUsed`)
- Regular variables: camelCase
- Type instances: camelCase (e.g., `audioRef`, `saveTimer`)

**Types:**
- Interfaces: PascalCase with "Props" or "Type" suffix (e.g., `KeyIdeaCardProps`, `PaywallPromptProps`, `AuthContextType`, `AudioContextType`, `AudioState`)
- Type aliases: PascalCase (e.g., `DownloadType`, `ReaderTheme`, `ReaderFont`)
- Generic parameters: PascalCase single letters (T, K, V) or descriptive (e.g., `Tables<"books">`)

## Code Style

**Formatting:**
- Default Vite/ESLint setup - no custom prettier config
- ESLint configuration in `eslint.config.js` uses flat config format
- ECMAScript 2020 target

**Linting:**
- ESLint ^9.32.0 with TypeScript support
- React Hooks and React Refresh plugins enabled
- Key rule: `react-refresh/only-export-components` warns on non-component exports
- `@typescript-eslint/no-unused-vars` is disabled (lax on unused imports/variables)
- No strict null checks (`strictNullChecks: false` in tsconfig)

**TypeScript Configuration:**
- `allowJs: true` - JavaScript allowed in TypeScript project
- `noImplicitAny: false` - Implicit any types permitted
- `noUnusedLocals: false` - Unused variables not enforced
- `noUnusedParameters: false` - Unused parameters not enforced
- `skipLibCheck: true` - Library type checking skipped
- Path alias: `@/*` maps to `./src/*`

## Import Organization

**Order:**
1. External libraries (React, hooks, icons, UI libraries)
2. Internal utilities and helpers (`@/lib/`)
3. Internal contexts (`@/contexts/`)
4. Internal hooks (`@/hooks/`)
5. Internal components (`@/components/`)
6. Internal pages (`./pages/`)
7. Internal services/integrations (`@/integrations/`)
8. Inline styles or assets

**Example from ReaderPage.tsx:**
```typescript
import React, { useState, useEffect, useRef, useCallback, useMemo, ReactNode } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { X, Settings2, Heart, Trash2, Headphones, List } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useBook } from "@/hooks/useBooks";
import { useAuth } from "@/contexts/AuthContext";
import { useAudio } from "@/contexts/AudioContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import MiniAudioPlayer from "@/components/MiniAudioPlayer";
import SelectionToolbar from "@/components/reader/SelectionToolbar";
import { getColor } from "@/lib/highlightColors";
```

**Path Aliases:**
- `@/` = `./src/`
- Used throughout codebase for absolute imports

## Error Handling

**Patterns:**
- Queries wrap errors and throw them: `if (error) throw error;` in `useBooks.ts`, `useDownloads.ts`
- Async functions catch errors with try/catch blocks for critical operations
- Network errors propagated to React Query which handles retry logic
- File fetch operations throw descriptive Error objects: `throw new Error("Failed to fetch audio")` in `offlineStorage.ts`
- Event handlers suppress errors with `.catch(() => {})` pattern: `audio.play().catch(() => {})` in AudioContext

**Toast Notifications:**
- Use `toast()` from `@/hooks/use-toast` for user-facing errors
- Example: `toast({ title: "Error", description: "...", variant: "destructive" })` in `useDownloads.ts`
- Success and info notifications also use same toast system

## Logging

**Framework:** `console` methods (native browser console)

**Patterns:**
- Minimal logging in codebase
- Errors logged to console: `console.error("Download error:", err)` in error scenarios
- No centralized logging framework; console is primary output
- Network and storage operations may silently fail with error propagation instead of logging

## Comments

**When to Comment:**
- Inline comments explain non-obvious algorithms or workarounds
- Comments placed above or inline with code they explain
- All state/method descriptions in context providers use comments for clarity

**Examples:**
- `// Save position debounced` in AudioContext
- `// Play a book's audio (or resume if same book)` in AudioContext
- `// Same book — just seek if needed and play` - inline conditional comment
- `// IndexedDB store for audio blobs` - store initialization comments
- `// Get storage limit in bytes` - function purpose comments

**JSDoc/TSDoc:**
- Not extensively used; minimal documentation comments
- TypeScript interfaces serve as inline documentation
- Return types and parameter types documented through type annotations

## Function Design

**Size:**
- No hard size limits observed
- Pages can be 600+ lines (ReaderPage.tsx, AdminBookForm.tsx)
- Hooks typically 50-250 lines
- Utility functions 10-50 lines
- Large functions are kept within single files without extraction

**Parameters:**
- Destructured parameters in React components: `({ index, title, content, className }: KeyIdeaCardProps) => {}`
- Callback functions accept event objects: `onClick={() => setShowDialog(true)}`
- Async functions accept multiple typed parameters with optional indicators: `async (bookId: string, type: DownloadType, bookData: {...}, textContent?: string | null, ...)`

**Return Values:**
- React components return JSX.Element (implicit)
- Hooks return typed values or objects: `useQuery` returns query object with `data`, `error`, `isLoading`
- Async functions return Promises: `Promise<string>`, `Promise<number>`, `Promise<void>`
- Utility functions return typed values: `string | null`, `number`, `OfflineBookMeta[]`

## Module Design

**Exports:**
- Named exports for hooks and utilities: `export const useBooks = () => {...}`, `export const saveTextOffline = async (...) => {...}`
- Default exports for React components: `export default KeyIdeaCard`
- Mixed pattern: some components exported as default, contexts export both provider and hook
- Interface/type exports: `export interface KeyIdeaCardProps {...}`, `export type Book = Tables<"books">`

**Barrel Files:**
- Not extensively used
- `src/test/setup.ts` imports testing library for global access
- Direct imports preferred over re-exports

## React Patterns

**Component Definition:**
- Functional components with hooks
- Props typed with interfaces: `interface KeyIdeaCardProps { ... }`
- Destructured props in parameters: `const Component = ({ prop }: Props) => {...}`

**State Management:**
- Local state with `useState` for component-level state
- React Query (`@tanstack/react-query`) for server state management
- Context API for global state (`AuthProvider`, `AudioProvider`)
- localStorage for persistent client state

**Hook Patterns:**
- Custom hooks prefixed with `use`
- Hooks use React Query for data fetching
- Event listeners cleaned up in `useEffect` return: `return () => { window.removeEventListener(...) }`
- Callbacks memoized with `useCallback` for performance-critical operations

## Styling

**Framework:** Tailwind CSS with shadcn/ui components

**Patterns:**
- Utility-first CSS with Tailwind class names
- Component library: shadcn/ui for accessible UI components
- Custom utility function: `cn()` in `lib/utils.ts` combines clsx and tailwind-merge
- Inline styles used sparingly for computed values: `style={{ top, left }}`

## Configuration Files Used

- `eslint.config.js` - Linting rules
- `tsconfig.json` - TypeScript settings with path aliases
- `vitest.config.ts` - Test runner configuration
- No `.prettierrc` - uses ESLint defaults
- No `.editorconfig` - relies on IDE defaults

---

*Convention analysis: 2026-03-18*
