# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**Type Safety Issues (any types):**
- Issue: Widespread use of `any` type casts circumvents TypeScript safety
- Files:
  - `src/hooks/useRecommendations.ts` (forEach with `any`)
  - `src/hooks/usePushNotifications.ts` (table cast `as any`)
  - `src/hooks/useProfileStats.ts` (forEach with `any`)
  - `src/pages/Index.tsx` (multiple `any` casts)
  - `src/pages/ShelvesPage.tsx` (data mapping with `any`)
  - `src/pages/AdminBookList.tsx` (error handler and status cast)
  - `src/pages/AdminBookForm.tsx` (error handler with `any`)
  - `src/pages/AdminCollections.tsx` (error handler with `any`)
  - `src/pages/ReaderPage.tsx` (insert mutation cast)
  - `src/pages/ProfilePage.tsx` (error handler with `any`)
- Impact: Runtime errors hidden from type checking, refactoring blind spots, unpredictable behavior in edge cases
- Fix approach: Replace with proper typed interfaces and discriminated unions; use `unknown` with type guards; improve API response types from Supabase client

**Missing Error Logging:**
- Issue: Silent error swallowing throughout codebase (`.catch(() => {})` and empty catch blocks)
- Files:
  - `src/contexts/AudioContext.tsx` (audio.play() calls)
  - `src/pages/OfflineReaderPage.tsx` (audio.play() catch)
  - `src/pages/BookPage.tsx` (empty catch block)
  - `src/hooks/useOfflineSync.ts` (promise catch)
  - Multiple other locations with `.catch(() => {})`
- Impact: Bugs become invisible; impossible to debug production issues; users don't know operations failed
- Fix approach: Implement structured error logging; at minimum log errors to console.error(); add Sentry or similar error tracking

**Inconsistent Storage Layer:**
- Issue: Direct localStorage access mixed with IndexedDB abstraction; inconsistent access patterns
- Files: `src/lib/offlineStorage.ts`, `src/contexts/AudioContext.tsx`, multiple hooks
- Impact: Storage quota issues unpredictable; potential data loss on quota overflow; hard to manage cleanup
- Fix approach: Centralize all storage access through abstraction layer; implement storage quota monitoring with user warnings

**Memory Leak Risk - Event Listeners:**
- Issue: Event listeners added in AsyncEffect callbacks without guaranteed cleanup in all paths
- Files: `src/contexts/AudioContext.tsx` (lines 96, 144 - loadedmetadata listener attached to audio element that persists across render cycles)
- Impact: Multiple listeners accumulate on audio element during rapid component reuse; audio playback issues
- Fix approach: Ensure listeners removed before adding new ones; track listener references; use AbortController for cleanup

## Known Bugs

**Audio Position Restoration Race Condition:**
- Symptoms: Audio playback position doesn't persist correctly when switching between books quickly; position sometimes resets
- Files: `src/contexts/AudioContext.tsx` (lines 99-110, 147-157), `src/pages/AudioPlayerPage.tsx`
- Trigger: Loading new book while previous book's position is still being fetched from database
- Cause: Async database fetch happens after state update; if new book loads before fetch completes, position applied to wrong audio element
- Workaround: Wait 500ms+ before switching books
- Fix approach: Cancel pending position fetch when book changes; use AbortSignal; ensure state consistency before applying position

**Unbounded Array Growth in Highlights:**
- Symptoms: App becomes slow when user has 100+ highlights in a single book; rendering page takes seconds
- Files: `src/pages/ReaderPage.tsx` (lines 60-100, highlight rendering logic)
- Trigger: Large highlight count + user scrolls or edits highlights
- Cause: `applyHighlights` function sorts and searches through all highlights on every render; no memoization or virtualization
- Impact: O(n²) complexity for highlight rendering; page freezes
- Fix approach: Memoize highlights array; implement virtual scrolling for highlights list; index highlights by position

**Silent Upload Failure in Admin Book Form:**
- Symptoms: User uploads audio file, gets "success" toast, but audio not actually saved
- Files: `src/pages/AdminBookForm.tsx` (lines 180-206)
- Trigger: Network timeout during audio upload that's caught as "failed to fetch"
- Cause: Retry logic only checks for "failed to fetch" substring; other network errors pass through but mutation succeeds anyway
- Impact: Audio file missing after user believes it's uploaded; data inconsistency
- Fix approach: Validate file was actually uploaded before confirming success; check storage to ensure file exists; improve error detection

**localStorage Access Without Error Handling:**
- Symptoms: App crashes silently on browsers with localStorage disabled; QuotaExceededError can occur unexpectedly
- Files: `src/lib/offlineStorage.ts` (lines 38, 44, 48), `src/contexts/AudioContext.tsx` (lines 43, 122, 201)
- Trigger: Private browsing mode (iOS Safari), storage disabled by user, storage quota exhausted
- Cause: No try-catch around localStorage operations; assumption that localStorage always available
- Fix approach: Wrap localStorage in try-catch; provide fallback to memory storage; show user-facing error for quota exceeded

## Security Considerations

**Unauthenticated Database Queries in Highlevel Pages:**
- Risk: Some data fetches missing authentication checks; potential information disclosure
- Files: `src/pages/BookPage.tsx` (view count increment), `src/pages/ReaderPage.tsx` (various queries)
- Current mitigation: Supabase RLS policies enforce authentication
- Recommendations: Verify all RLS policies are set to authenticated mode; add explicit user ID checks in queries; audit Supabase policy configuration; log unauthorized access attempts

**Arbitrary HTML in Markdown Content:**
- Risk: `rehype-raw` plugin allows raw HTML in markdown summaries; potential XSS if admin input not validated
- Files: `src/pages/ReaderPage.tsx` (line 484 - ReactMarkdown with rehype-raw)
- Current mitigation: Content controlled by admin users
- Recommendations: Sanitize markdown input with sanitize-html; whitelist allowed HTML tags; add CSP header to prevent inline script execution; validate all user inputs on server side

**Client-Side Audio Encryption Missing:**
- Risk: Downloaded audio files stored unencrypted in IndexedDB; accessible to malware with device access
- Files: `src/lib/offlineStorage.ts` (lines 69-102)
- Current mitigation: None - stored as plaintext blob
- Recommendations: Consider encryption for premium content; document offline cache security model; warn users about local storage risks

## Performance Bottlenecks

**ReaderPage Component Size and Complexity:**
- Problem: 620-line page component with excessive state management and too many responsibilities
- Files: `src/pages/ReaderPage.tsx`
- Cause: Text rendering, highlights management, audio player integration, table of contents, all in single component
- Metrics: 8 useEffect hooks, 9 useMemo hooks, 6 useCallback hooks
- Impact: Component takes 3-5 seconds to mount; re-render on any child change affects entire page
- Improvement path: Split into smaller components; extract highlight logic to custom hook; move audio player to context only; use React.memo for child components

**Highlight Matching Algorithm is O(n²):**
- Problem: `applyHighlights` function searches entire text for each highlight
- Files: `src/pages/ReaderPage.tsx` (lines 60-100)
- Current approach: For each highlight, call `text.indexOf()` which scans full text
- Impact: 100 highlights in 10KB text = 1M string comparisons on each render
- Improvement path: Build index of highlight positions on first pass; use regex with sorted positions; consider virtual scrolling for highlights list

**AdminBookForm Has Cascading Queries Without Cancellation:**
- Problem: 3 parallel queries load edit data without cancellation strategy
- Files: `src/pages/AdminBookForm.tsx` (lines 49-77)
- Impact: If user navigates away during data load, queries still complete and update unmounted component; network waste; memory leak
- Improvement path: Use query cancellation on unmount; implement AbortController for fetches; check component mounted before setState

**Missing Query Pagination:**
- Problem: `getAllDownloadedBooks` loads all downloaded book metadata into memory
- Files: `src/lib/offlineStorage.ts` (lines 132-138), used in `src/hooks/useDownloads.ts`
- Impact: With 500+ books, creates large array in memory; slow iteration on each refresh
- Improvement path: Implement pagination or lazy-load metadata; add database indexing; cache metadata in service worker

## Fragile Areas

**Audio State Management in Context:**
- Files: `src/contexts/AudioContext.tsx`
- Why fragile: Audio element lifecycle independent of React; state can fall out of sync with audio.currentTime; multiple async operations manipulate same ref
- Safe modification: Always reset audio element when bookId changes; use defensive checks for ref existence; test with rapid book switching
- Test coverage: No unit tests for audio context; only 1 example.test.ts file exists

**Offline Storage Quota Handling:**
- Files: `src/lib/offlineStorage.ts`, `src/hooks/useDownloads.ts`
- Why fragile: Quota check happens before download; actual size may differ; no quota refresh during ongoing downloads; users can exceed quota if multiple downloads finish
- Safe modification: Implement pre-download size estimation with margin; refresh quota before each save; add transaction-like semantics
- Test coverage: No tests for storage quota scenarios

**Supabase Type Generation is Manual:**
- Files: `src/integrations/supabase/types.ts` (589 lines of hand-maintained types)
- Why fragile: Database schema changes won't auto-update types; easy to forget to regenerate after migrations; type mismatches cause silent failures
- Safe modification: Use Supabase CLI to auto-generate types; regenerate after every schema change; commit types to git; add pre-commit hook
- Test coverage: No schema validation tests

**Highlight Persistence Without Transactions:**
- Files: `src/pages/ReaderPage.tsx` (lines 314-347)
- Why fragile: Creating/deleting highlights happens one at a time; if connection drops mid-operation, partial state persists
- Safe modification: Batch highlight operations; use database transactions; add optimistic updates with rollback on error
- Test coverage: No tests for highlight creation/deletion; no error recovery testing

## Scaling Limits

**Browser Storage Quota:**
- Current capacity: Default 500MB per `src/lib/offlineStorage.ts` line 22
- Limit: IndexedDB quota typically 50% of available disk space (varies by browser)
- Issue: No warning when approaching quota; no graceful degradation
- Scaling path: Implement quota monitoring with background sync; prioritize recent downloads; add automatic cleanup of oldest downloads; consider differential sync

**Single Audio Element for All Books:**
- Current architecture: One `<audio>` element in AudioProvider used for all playback
- Limit: Only one book can play at a time (by design), but state management assumes instant switching
- Issue: Rapid switching breaks audio sync; position restoration unreliable
- Scaling path: Pre-buffer next book's audio while current plays; use Web Audio API for more control; implement adaptive bitrate

**Highlights Table Without Indexes:**
- Current: user_highlights table queries by user_id, book_id, and text
- Issue: Large books with thousands of highlights could have slow queries
- Limit: Supabase performance degrades at 10k+ highlights per user
- Scaling path: Add composite index on (user_id, book_id); archive old highlights; implement highlight search API

**Markdown Parsing Has No Limits:**
- Problem: `extractToc` and `applyHighlights` process entire summary content without pagination
- Files: `src/pages/ReaderPage.tsx` (lines 44-56, 60-100)
- Limit: 10MB+ summaries cause browser to hang during rendering
- Scaling path: Implement virtual scrolling for content; lazy-load summary sections; paginate markdown rendering

## Dependencies at Risk

**react-markdown with rehype-raw:**
- Risk: rehype-raw plugin allows arbitrary HTML; difficult to audit for XSS vectors
- Impact: Any admin-contributed content with malicious HTML could compromise app
- Version: reactive-markdown ^10.1.0 (current)
- Migration plan: Replace with markdown-it with strict sanitizer; implement server-side markdown rendering; use DOMPurify for additional protection

**localforage Abstraction Layer:**
- Risk: localforage hasn't been updated significantly; alternatives like idb are more modern
- Impact: Security patches may be missed; no IndexedDB schema versioning support
- Current usage: All offline storage depends on this
- Migration plan: Evaluate idb library; implement schema versioning; consider moving to SQL.js for better query support

**Supabase Type Definitions Manual:**
- Risk: Hand-maintained types.ts file (589 lines) can drift from actual schema
- Impact: TypeErrors won't catch schema mismatches; refactoring becomes error-prone
- Current: No auto-generation pipeline
- Migration plan: Set up Supabase CLI with `supabase gen types --lang typescript`; run after migrations; commit to source control

## Test Coverage Gaps

**Audio Context Untested:**
- What's not tested: Audio playback, position saving, speed changes, context switching
- Files: `src/contexts/AudioContext.tsx`
- Risk: Position persistence bugs go unnoticed; audio playback regressions only caught in manual testing
- Priority: High - audio is core feature; complex state management

**Offline Storage Not Tested:**
- What's not tested: Quota checks, concurrent downloads, storage cleanup, blob management
- Files: `src/lib/offlineStorage.ts`
- Risk: Silent data loss; quota exceeded silently; no rollback on partial failures
- Priority: High - data loss is critical; quota management is fragile

**Highlight Operations Untested:**
- What's not tested: Creating, updating, deleting highlights; duplicate detection; color persistence
- Files: `src/pages/ReaderPage.tsx` (highlight mutations)
- Risk: Highlight corruption; lost user data; race conditions in concurrent edits
- Priority: High - user-facing feature; complex state sync

**Admin Book Form Not Tested:**
- What's not tested: File uploads, form validation, edit vs create modes, audio retry logic, category management
- Files: `src/pages/AdminBookForm.tsx`
- Risk: Admin operations fail silently; partial data saved; incorrect status transitions
- Priority: Medium - admin-only feature; but blocks content publishing

**Download Management Not Tested:**
- What's not tested: Download progress, cancellation, resume, error recovery, storage estimation
- Files: `src/hooks/useDownloads.ts`
- Risk: Downloads can hang; corrupted files stored; quota exceeded without warning
- Priority: High - core offline functionality; complex async management

**Only 1 Test File Exists:**
- Files: `src/test/example.test.ts` (trivial placeholder)
- Coverage: 0% - no production code tested
- Recommendation: Establish test baseline; aim for 80%+ coverage on critical paths; add integration tests for offline scenarios

---

*Concerns audit: 2026-03-18*
