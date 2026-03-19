# Phase 3: Audio Player Polish - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Background audio playback with lock screen controls (Media Session API) and sleep timer with configurable duration. This phase polishes the existing audio player — no new audio features (playlists, bookmarks, etc.).

</domain>

<decisions>
## Implementation Decisions

### Lock Screen Controls
- Use Media Session API for lock screen / notification bar integration
- Controls: Play/Pause (center), Skip back 15s (left), Skip forward 15s (right) — matches in-app controls
- Metadata: Book cover as artwork, book title as track name, author as artist
- Show position state (current time, duration, progress bar) on supported devices
- Media Session handlers must sync with AudioContext state bidirectionally

### Background Playback
- Audio always continues playing when user navigates away, switches tabs, or locks phone
- No conditional background playback (always on when audio is playing)
- Headphone disconnect pauses playback (prevent unexpected speaker output)
- On audio interruption (incoming call, other app): pause playback, user must manually resume (no auto-resume)

### Sleep Timer
- Preset options: 15 / 30 / 45 / 60 minutes + custom duration input
- Remove existing 5-minute option, add 45-minute option per AUDIO-04 requirements
- Gradual fade-out over 10-15 seconds before stopping (volume ramp down, not hard stop)
- Timer countdown visible in both full AudioPlayerPage AND MiniAudioPlayer bar
- Timer is in-app only — not exposed through lock screen controls
- Timer set before locking phone continues to work in background

### Consolidation
- Move sleep timer logic from AudioPlayerPage and OfflineReaderPage INTO AudioContext — single source of truth
- Timer survives page navigation (persisted in context, not component state)
- Unify OfflineReaderPage audio: switch from standalone audio handling to AudioContext
- AudioContext gains ability to load audio from IndexedDB (offline) through same interface
- One audio system for the entire app — online and offline use same context

### Claude's Discretion
- Fade-out curve (linear vs exponential volume decrease)
- Custom duration input UI design (number picker, slider, or text input)
- Sleep timer indicator design on MiniAudioPlayer (icon, text, or both)
- How to detect headphone disconnect in PWA context
- Whether to use Web Audio API for fade-out or HTML5 audio volume property
- Error handling for Media Session API on unsupported browsers

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audio Implementation
- `src/contexts/AudioContext.tsx` — Central audio state management, HTML5 audio ref, position saving, speed control. This is the file being extended.
- `src/components/MiniAudioPlayer.tsx` — Mini player bar at bottom of app. Needs sleep timer indicator.
- `src/pages/AudioPlayerPage.tsx` — Full player page with existing sleep timer implementation (to be removed after centralization).
- `src/pages/OfflineReaderPage.tsx` — Offline reader with duplicated audio + sleep timer implementation (to be unified with AudioContext).

### Audio Access (Phase 1)
- `src/hooks/useAccessControl.ts` — Client-side access gating (canListenAudio = isPro)
- Phase 1 decision: AudioContext fetches signed URLs internally, callers only pass bookId
- Phase 1 decision: 24h signed URL expiry

### Offline Audio
- `src/lib/offlineStorage.ts` — IndexedDB audio storage via localforage. AudioContext needs to support loading from this source.

### PWA / Service Worker
- `vite.config.ts` — vite-plugin-pwa configuration. Audio caching patterns may need updating.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AudioContext.tsx`: Already has play/pause/seek/skip/setSpeed/stop. Extend with sleepTimer state, setSleepTimer, and Media Session setup.
- `MiniAudioPlayer.tsx`: Fixed bottom bar with progress. Add sleep timer countdown indicator.
- `SLEEP_OPTIONS` constant: Currently defined in AudioPlayerPage — move to shared location and update options.
- `offlineStorage.ts` / `getAudioOffline()`: Existing IndexedDB audio retrieval — AudioContext can import and use this.

### Established Patterns
- React Context API for global state (AuthContext, AudioContext)
- HTML5 Audio element via ref in AudioContext
- Debounced position saving (3s interval) to Supabase user_progress table
- Speed stored in localStorage
- Toast notifications via Sonner for user feedback

### Integration Points
- `AudioContext` wraps entire app in App.tsx — any state added here is globally available
- `OfflineReaderPage` currently creates its own audio element — needs refactor to use AudioContext
- Media Session API setup should happen in AudioContext when audio starts playing
- Sleep timer indicator connects MiniAudioPlayer to new context state

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-audio-player-polish*
*Context gathered: 2026-03-19*
