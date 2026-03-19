---
phase: 3
slug: audio-player-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | AUDIO-03 | unit | `npx vitest run src/test/media-session.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | AUDIO-03 | unit | `npx vitest run src/test/media-session.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | AUDIO-03 | unit | `npx vitest run src/test/media-session.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | AUDIO-04 | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | AUDIO-04 | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | AUDIO-04 | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | AUDIO-04 | unit | `npx vitest run src/test/sleep-timer.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 1 | AUDIO-03 | manual-only | N/A -- requires real browser | N/A | ⬜ pending |
| 03-03-02 | 03 | 1 | AUDIO-03 | manual-only | N/A -- requires real device | N/A | ⬜ pending |
| 03-03-03 | 03 | 1 | AUDIO-03 | manual-only | N/A -- requires hardware | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/sleep-timer.test.ts` — stubs for AUDIO-04 timer logic (countdown, fade-out, stop, volume reset)
- [ ] `src/test/media-session.test.ts` — stubs for AUDIO-03 Media Session setup (metadata, action handlers, position state)
- [ ] Mock for `navigator.mediaSession` in jsdom (jsdom does not implement Media Session API)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Background playback continues when tab backgrounded | AUDIO-03 | Requires real browser with tab switching | Play audio, switch to another tab/app, verify audio continues |
| Lock screen controls visible and functional | AUDIO-03 | Requires real device with lock screen | Play audio, lock phone, verify controls appear and respond |
| Headphone disconnect pauses playback | AUDIO-03 | Requires hardware headphones | Play audio with headphones, disconnect them, verify pause |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
