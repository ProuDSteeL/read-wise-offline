---
phase: 06-offline-hardening
plan: 01
subsystem: ui
tags: [react, radix-progress, offline, pwa, tailwind]

# Dependency graph
requires:
  - phase: 03-audio
    provides: useDownloads hook with activeDownloads Map and DownloadProgress type
provides:
  - Download progress bar in DownloadDialog with percentage display
  - Global OfflineBanner component for all routes
  - Pure helper functions for download display state logic
affects: [06-offline-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-logic-extraction for testable display state, fixed-position global overlay banner]

key-files:
  created:
    - src/components/OfflineBanner.tsx
    - src/lib/downloadDisplayState.ts
    - src/test/download-progress.test.ts
    - src/test/offline-banner.test.ts
  modified:
    - src/components/DownloadDialog.tsx
    - src/pages/BookPage.tsx
    - src/App.tsx

key-decisions:
  - "Extracted getDownloadDisplayState/roundProgress as pure functions for testability"
  - "OfflineBanner uses z-[60] to stay above sticky headers (z-20) and other overlays"
  - "Dialog auto-closes when download leaves activeDownloads map (1.5s after done), no manual close on download start"
  - "Kept existing per-page offline banner in DownloadsPage alongside global banner (different purposes)"

patterns-established:
  - "Pure logic extraction: extract display state logic to lib/ for unit testing without component rendering"
  - "Global overlay pattern: fixed-position components rendered at App level alongside GlobalAudioPlayer"

requirements-completed: [OFFL-05, OFFL-06]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 6 Plan 1: Download Progress & Offline Banner Summary

**Radix Progress bar with percentage in DownloadDialog for audio downloads, plus global fixed OfflineBanner using useOnlineStatus hook**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T21:53:42Z
- **Completed:** 2026-03-19T21:57:42Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- DownloadDialog shows Radix Progress bar with percentage during audio downloads instead of just a spinner
- Dialog stays open during download and auto-closes when download completes (via activeDownloads map removal)
- Global OfflineBanner renders a fixed red banner at top of viewport when offline, auto-hides when online
- All new logic extracted as pure functions with unit tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Add progress bar to DownloadDialog and keep dialog open** - `e3c489b` (feat)
2. **Task 2: Create global OfflineBanner and render in App.tsx** - `0d53ce2` (feat)

## Files Created/Modified
- `src/lib/downloadDisplayState.ts` - Pure helpers: getDownloadDisplayState, roundProgress
- `src/components/DownloadDialog.tsx` - Added Progress bar, downloadProgress/downloadStatus props, close prevention during download
- `src/pages/BookPage.tsx` - Passes progress data to DownloadDialog, removed immediate close, added auto-close useEffect
- `src/components/OfflineBanner.tsx` - Global fixed offline indicator banner with WifiOff icon
- `src/App.tsx` - Registered OfflineBanner alongside GlobalAudioPlayer
- `src/test/download-progress.test.ts` - Tests for download display state logic
- `src/test/offline-banner.test.ts` - Tests for offline banner visibility logic

## Decisions Made
- Extracted getDownloadDisplayState/roundProgress as pure functions in lib/downloadDisplayState.ts for testability
- OfflineBanner uses z-[60] to layer above sticky headers (z-20) and below modals
- Dialog auto-close uses useEffect watching activeDownloads.has(id) transition from true to false
- Kept existing per-page DownloadsPage banner (provides page-specific context "only downloads available") alongside global banner

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Download UX improved with progress feedback
- Offline state globally visible to users on all routes
- Ready for Plan 02 (remaining offline hardening tasks)

---
*Phase: 06-offline-hardening*
*Completed: 2026-03-19*

## Self-Check: PASSED
- All 7 files verified present
- Commits e3c489b and 0d53ce2 verified in git log
- 12 tests passing (9 download-progress + 3 offline-banner)
- TypeScript compiles clean
