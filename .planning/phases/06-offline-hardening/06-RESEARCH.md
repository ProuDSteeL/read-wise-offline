# Phase 6: Offline Hardening - Research

**Researched:** 2026-03-19
**Domain:** PWA offline UX, IndexedDB storage, download progress UI
**Confidence:** HIGH

## Summary

Phase 6 focuses on completing the offline experience for ReadWise Offline. The good news is that **the majority of the infrastructure already exists** -- the `useDownloads` hook, `offlineStorage.ts` (localforage/IndexedDB), `DownloadsPage`, `OfflineReaderPage`, and `useOnlineStatus` are all functional. The work is primarily UI polish and gap-filling, not new architecture.

Specifically: (1) The DownloadsPage already shows downloaded books with sizes and delete -- needs only minor review for completeness. (2) Audio downloads already use `ReadableStream` chunked reading with progress callbacks, but the `DownloadDialog` only shows a spinner instead of the actual progress bar. (3) An offline banner exists on DownloadsPage but not as a global indicator visible across all routes.

**Primary recommendation:** This phase is UI-layer work. Add a visible progress bar to the download flow, add a global offline banner component rendered in App.tsx, and verify/polish the existing DownloadsPage.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OFFL-04 | Downloads page showing list of downloaded books with storage size and delete option | DownloadsPage.tsx already implements this. Verify completeness, potentially add minor polish. |
| OFFL-05 | Chunked audio downloads with visible progress bar | Chunking infrastructure exists in offlineStorage.ts. Progress state tracked in useDownloads. Need to surface progress bar in DownloadDialog and/or BookPage UI. |
| OFFL-06 | Offline banner indicator displayed when user reads without internet connection | useOnlineStatus hook exists. Need global OfflineBanner component rendered in App.tsx for all routes. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| localforage | ^1.10.0 | IndexedDB abstraction for offline storage | Already used in offlineStorage.ts for audio/text/meta stores |
| @radix-ui/react-progress | ^1.1.7 | Progress bar component | Already installed, used on DownloadsPage for storage indicator |
| lucide-react | ^0.462.0 | Icons (WifiOff, Download, etc.) | Already used throughout the app |
| react-router-dom | ^6.30.1 | Routing | Already used, relevant for offline route handling |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite-plugin-pwa | ^1.2.0 | PWA/Service Worker setup | Already configured in vite.config.ts with Workbox |
| sonner | ^1.7.4 | Toast notifications | Already used for download success/error feedback |

### No New Dependencies Needed
This phase requires **zero new npm packages**. All required libraries are already installed and in use.

## Architecture Patterns

### Existing Architecture (Do Not Change)

The offline storage architecture is already established and should not be restructured:

```
src/
├── lib/
│   ├── offlineStorage.ts      # IndexedDB via localforage (audio/text/meta stores)
│   └── offlineSync.ts         # Sync offline progress to DB on reconnect
├── hooks/
│   ├── useDownloads.ts        # Download/delete/refresh logic + activeDownloads progress state
│   ├── useOnlineStatus.ts     # navigator.onLine + event listeners
│   └── useOfflineSync.ts      # Auto-sync when coming back online
├── components/
│   ├── DownloadDialog.tsx     # Modal for choosing text/audio/both download
│   └── GlobalAudioPlayer.tsx  # App-level audio overlay (pattern for global components)
├── pages/
│   ├── DownloadsPage.tsx      # My Downloads list page (already exists with full UI)
│   └── OfflineReaderPage.tsx  # Offline reading page (already has WifiOff icon)
└── App.tsx                    # Routes + offline-only route set
```

### Pattern 1: Global Overlay Component (for Offline Banner)
**What:** A component rendered at the App level, outside route hierarchy, that appears/disappears based on state.
**When to use:** For the offline banner (OFFL-06) -- must be visible on ALL pages.
**Example:** Follow the same pattern as `GlobalAudioPlayer` in App.tsx:
```typescript
// In App.tsx, render alongside GlobalAudioPlayer:
<AppRoutes />
<GlobalAudioPlayer />
<OfflineBanner />  // NEW -- renders when !navigator.onLine
```

The `OfflineBanner` component uses `useOnlineStatus()` internally and renders a fixed-position banner. It should appear at the **top** of the viewport so it doesn't conflict with the bottom navigation or audio player.

### Pattern 2: Download Progress in Active Downloads
**What:** The `useDownloads` hook already tracks `activeDownloads: Map<string, DownloadProgress>` with `progress: number` (0-100) and `status`.
**When to use:** Surface this existing data as a visual progress bar instead of the current spinner.
**Key insight:** The progress data pipeline is complete:
1. `saveAudioOffline` streams chunks and calls `onProgress(loaded, total)`
2. `useDownloads.download()` maps this to percentage and stores in `activeDownloads`
3. `BookPage` passes `activeDownloads.has(id!)` as `downloading` prop to `DownloadDialog`

The gap: `DownloadDialog` receives a boolean `downloading` prop, not the actual progress percentage. Need to pass the progress value and render a `<Progress>` bar.

### Anti-Patterns to Avoid
- **Don't create a separate download manager service:** The `useDownloads` hook already handles everything. Adding another abstraction layer adds complexity with no benefit.
- **Don't use Service Worker for download progress tracking:** The current approach of streaming via `ReadableStream` in the main thread is simpler and provides better UX control.
- **Don't store offline status in global state/context:** The `useOnlineStatus` hook is lightweight and can be called independently where needed. A context would be over-engineering.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB storage | Raw IndexedDB API | localforage (already used) | Cross-browser compat, promise-based API, automatic driver selection |
| Progress bar UI | Custom div-based progress | `@radix-ui/react-progress` (already installed) | Accessible, animated, consistent with design system |
| Online/offline detection | Custom polling/fetch checks | `navigator.onLine` + events (already in useOnlineStatus) | Browser-native, battery-efficient, sufficient for banner use case |
| Service Worker | Manual SW registration | vite-plugin-pwa + Workbox (already configured) | Auto-generates SW with caching strategies already set up |

**Key insight:** Every building block for this phase is already installed and wired. The work is purely connecting existing pieces and adding UI.

## Common Pitfalls

### Pitfall 1: Progress Bar Flicker During Fast Text Downloads
**What goes wrong:** Text downloads complete almost instantly (<100ms), causing the progress bar to flash briefly then disappear.
**Why it happens:** Text content is small (typically 10-50KB) compared to audio (5-50MB).
**How to avoid:** Only show the progress bar for audio downloads (or "both" type). For text-only downloads, the existing spinner is fine. Alternatively, use a minimum display time of ~500ms before removing the progress indicator.
**Warning signs:** Progress bar flashes 0% to 100% instantly on text downloads.

### Pitfall 2: Offline Banner Covering Content
**What goes wrong:** A fixed-position banner at the top pushes or covers page content, especially sticky headers.
**Why it happens:** Pages use `sticky top-0` headers that compete with a fixed banner.
**How to avoid:** Use a fixed-position banner at the very top with high z-index, and add body padding-top when the banner is visible. Or render it as part of the page flow (before the main content) with the understanding that it will scroll away. Given this app's mobile-first design, a **non-sticky, flow-based banner** at the top of each page layout is simpler and avoids z-index conflicts.
**Warning signs:** Content jumps when going offline/online, banner overlaps sticky headers.

### Pitfall 3: navigator.onLine False Positives
**What goes wrong:** `navigator.onLine` returns `true` even when the device has connectivity issues (e.g., connected to WiFi but no internet).
**Why it happens:** The API only detects whether the device has a network interface active, not actual internet connectivity.
**How to avoid:** For a banner indicator, `navigator.onLine` is sufficient -- it catches airplane mode, WiFi off, and most real offline scenarios. Don't over-engineer with fetch-based connectivity checks, which add latency and battery drain. The existing `useOnlineStatus` hook is the right approach.
**Warning signs:** Users report seeing the banner when they have internet, or not seeing it when they don't.

### Pitfall 4: DownloadDialog Closes Before Progress Shows
**What goes wrong:** In BookPage, `setShowDownloadDialog(false)` is called immediately after `downloadBook()`, which means the dialog closes before the user sees progress.
**Why it happens:** Current code in BookPage.tsx line 411 calls `setShowDownloadDialog(false)` right after triggering the download.
**How to avoid:** Either (a) keep the dialog open during download and close it on completion, or (b) show progress outside the dialog (e.g., inline on BookPage or as a toast-style notification). Option (b) is better UX since users want to continue browsing while downloading.
**Warning signs:** User clicks download and sees no visual feedback.

## Code Examples

### Example 1: OfflineBanner Component
```typescript
// src/components/OfflineBanner.tsx
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground">
      <WifiOff className="h-3.5 w-3.5" />
      Нет подключения к интернету
    </div>
  );
};

export default OfflineBanner;
```

### Example 2: Enhanced DownloadDialog with Progress Bar
```typescript
// Key change: pass progress percentage instead of boolean
interface DownloadDialogProps {
  // ... existing props
  downloadProgress?: number; // 0-100, undefined when not downloading
}

// Inside the dialog, replace the Loader2 spinner:
{downloadProgress != null ? (
  <div className="space-y-1">
    <Progress value={downloadProgress} className="h-2" />
    <p className="text-xs text-muted-foreground text-center">{Math.round(downloadProgress)}%</p>
  </div>
) : (
  <opt.icon className="h-5 w-5 text-foreground" />
)}
```

### Example 3: Passing Progress from useDownloads to UI
```typescript
// In BookPage.tsx, extract progress for current book:
const currentProgress = activeDownloads.get(id!);

// Pass to DownloadDialog:
<DownloadDialog
  downloadProgress={currentProgress?.progress}
  downloading={activeDownloads.has(id!)}
  // ... other props
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Service Worker background fetch | ReadableStream in main thread | 2023+ | Background Fetch API still has limited browser support; main thread streaming is more reliable for PWAs |
| Custom IndexedDB wrappers | localforage | Stable since 2020 | Already in use, provides fallback to WebSQL/localStorage |
| Manual offline detection polling | navigator.onLine events | Browser standard | Used by useOnlineStatus hook, sufficient for UI indicators |

**Note on Background Fetch API:** The Background Fetch API would allow downloads to continue when the app is backgrounded, but it requires Service Worker integration and has limited support (Chrome/Edge only, no Safari/Firefox). The current `ReadableStream` approach in the main thread is appropriate for this app since audio files are typically 5-50MB and download quickly.

## Open Questions

1. **Should progress be shown in-dialog or inline on BookPage?**
   - What we know: Current flow closes dialog immediately after triggering download. Progress data exists in `activeDownloads`.
   - What's unclear: Best UX pattern -- keep dialog open with progress, or show inline progress on BookPage/Downloads page.
   - Recommendation: Show progress inline on BookPage (small progress bar under the download icon) and also on DownloadsPage if the user navigates there. Close the dialog after triggering download. This matches app store download UX patterns.

2. **Should the offline banner push content down or overlay?**
   - What we know: Pages have sticky headers at `top-0`. DownloadsPage already has a non-sticky offline banner.
   - What's unclear: Whether a global fixed banner will conflict with per-page sticky headers.
   - Recommendation: Use a fixed banner at `top-0` with `z-[60]` (above all other sticky elements). Pages with sticky headers already use `z-20`. Content may be slightly covered but this is acceptable since offline mode is a temporary, attention-worthy state. The existing offline-only route redirect (App.tsx) already handles the extreme case.

3. **Is OFFL-04 already complete?**
   - What we know: DownloadsPage.tsx has the full UI: book list, per-book size display, delete with confirmation, storage indicator, storage limit settings.
   - What's unclear: Whether there are specific gaps the user expects beyond what's already built.
   - Recommendation: Treat OFFL-04 as "verify and polish" rather than "build from scratch." Review against success criteria and add any missing touches.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + jsdom |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/test/offline-downloads.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OFFL-04 | Downloads page shows books with sizes, delete works | unit | `npx vitest run src/test/downloads-page.test.ts -x` | No -- Wave 0 |
| OFFL-05 | Audio download shows progress bar, chunked download works | unit | `npx vitest run src/test/download-progress.test.ts -x` | No -- Wave 0 |
| OFFL-06 | Offline banner renders when navigator.onLine is false | unit | `npx vitest run src/test/offline-banner.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/test/offline-*.test.ts src/test/download-*.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/test/offline-banner.test.ts` -- covers OFFL-06 (banner renders when offline, hides when online)
- [ ] `src/test/download-progress.test.ts` -- covers OFFL-05 (progress calculation, chunked download logic)
- [ ] `src/test/downloads-page.test.ts` -- covers OFFL-04 (renders book list, delete, storage info)

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `src/hooks/useDownloads.ts`, `src/lib/offlineStorage.ts`, `src/pages/DownloadsPage.tsx`, `src/pages/OfflineReaderPage.tsx`, `src/hooks/useOnlineStatus.ts`, `src/App.tsx`
- `package.json` -- verified all dependencies already installed
- `vite.config.ts` -- verified PWA/Workbox configuration

### Secondary (MEDIUM confidence)
- localforage API patterns -- well-established library, stable since v1.10

### Tertiary (LOW confidence)
- None -- this phase is entirely about existing code patterns, no external research needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in active use in codebase
- Architecture: HIGH -- existing patterns are clear from code inspection, no new architecture needed
- Pitfalls: HIGH -- identified from direct code analysis (e.g., dialog closing on line 411 of BookPage.tsx)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no moving targets, all dependencies locked)
