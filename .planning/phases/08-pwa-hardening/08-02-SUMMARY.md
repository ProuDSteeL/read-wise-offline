---
phase: 08-pwa-hardening
plan: 02
subsystem: ui
tags: [pwa, install-prompt, offline, react, localStorage]

requires:
  - phase: 06-offline-hardening
    provides: offline routing infrastructure in App.tsx
provides:
  - auth-gated install prompt with visit counting
  - branded offline fallback page
  - pure shouldShowInstallPrompt function for testing
affects: []

tech-stack:
  added: []
  patterns:
    - "Pure function extraction for testable hook logic (shouldShowInstallPrompt)"
    - "localStorage visit counting with threshold gating"

key-files:
  created:
    - src/pages/OfflineFallback.tsx
    - src/hooks/__tests__/useInstallPrompt.test.ts
  modified:
    - src/hooks/useInstallPrompt.ts
    - src/pages/Index.tsx
    - src/App.tsx

key-decisions:
  - "Extracted shouldShowInstallPrompt as pure function for unit testing without mocking React hooks"
  - "Visit count increments on hook mount (not page load) to track actual app usage"

patterns-established:
  - "Pure function extraction: complex hook logic extracted as exported pure functions for direct unit testing"

requirements-completed: [PWA-02, PWA-03]

duration: 13min
completed: 2026-03-19
---

# Phase 08 Plan 02: Install Prompt Gating & Offline Fallback Summary

**Auth-gated install prompt with 3-visit threshold and branded offline fallback page with sage green WifiOff icon**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-19T22:21:50Z
- **Completed:** 2026-03-19T22:35:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Install prompt gated behind login status AND 3+ visit threshold
- 7-day dismiss memory preserved from existing implementation
- Pure shouldShowInstallPrompt function extracted with 8 passing unit tests
- Branded OfflineFallback page replaces bare redirect with Russian copy and CTA to downloads

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for gating logic** - `5bf430f` (test)
2. **Task 1 (GREEN): Auth-gating and visit-count implementation** - `4f3819c` (feat)
3. **Task 2: Offline fallback page and routing** - `ca4e80e` (feat)

_TDD task had separate RED and GREEN commits_

## Files Created/Modified
- `src/hooks/__tests__/useInstallPrompt.test.ts` - 8 unit tests for gating pure functions
- `src/hooks/useInstallPrompt.ts` - Added isLoggedIn param, visit counting, shouldShowInstallPrompt pure function
- `src/pages/Index.tsx` - Pass !!user to useInstallPrompt hook
- `src/pages/OfflineFallback.tsx` - Branded offline page with WifiOff icon and CTA
- `src/App.tsx` - Offline catch-all route uses OfflineFallback, removed Navigate import

## Decisions Made
- Extracted shouldShowInstallPrompt as pure function for direct unit testing without mocking React hooks or localStorage
- Visit count increments on hook mount rather than page load to track actual app usage patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Install prompt gating complete, ready for production
- Offline fallback page provides branded experience for uncached routes

---
*Phase: 08-pwa-hardening*
*Completed: 2026-03-19*
