# Phase 2: Reader Enhancement - Research

**Researched:** 2026-03-19
**Domain:** React reader UI, text selection, localStorage persistence, Supabase schema
**Confidence:** HIGH

## Summary

Phase 2 targets reader experience improvements: font size, reading themes, line spacing, table of contents, text highlighting/quotes, audio player integration, and copy-to-clipboard. After thorough codebase analysis, the critical finding is that **most of these features already exist in the codebase**. The ReaderPage component (`src/pages/ReaderPage.tsx`) already implements font size control (6 sizes), theme switching (light/dark/sepia), line spacing adjustment (4 levels), TOC extraction and navigation, text highlighting with quote saving to `user_highlights` table, and a mini audio player. The SelectionToolbar currently only has a "Quote" button but lacks copy-to-clipboard.

**Primary recommendation:** This phase is primarily a **polish, gap-fill, and verification** effort rather than building features from scratch. The main work involves: (1) adding copy-to-clipboard to the SelectionToolbar, (2) mapping the existing font sizes to the required small/medium/large/XL labels, (3) ensuring all settings properly persist via localStorage, (4) verifying the TOC sheet works with real content, and (5) adding tests to prove each requirement is met.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| READ-04 | Font size (small/medium/large/XL) persisted | ALREADY IMPLEMENTED: 6 font sizes (14-24px) with localStorage persistence. May need label mapping to small/medium/large/XL if stricter naming is required. |
| READ-05 | Reading theme (light/dark/sepia) persisted | ALREADY IMPLEMENTED: Theme switcher with light/dark/sepia. CSS variables defined in index.css for all three themes. Persisted via localStorage `reader-theme`. |
| READ-06 | Line spacing persisted | ALREADY IMPLEMENTED: 4 line heights (1.4-2.0) with localStorage persistence via `reader-line-height`. |
| READ-07 | Table of contents with section navigation | ALREADY IMPLEMENTED: `extractToc()` parses markdown headings (h1-h3), renders in a Sheet sidebar, clicking scrolls to heading via `scrollIntoView`. |
| READ-08 | Highlight text and save quotes | ALREADY IMPLEMENTED: `useNativeSelection` hook + `SelectionToolbar` + `createHighlight` mutation saves to `user_highlights` table. Highlights list displayed at bottom with delete capability. |
| READ-09 | Audio player in reader view | ALREADY IMPLEMENTED: MiniAudioPlayer component shown in reader, integrated with AudioContext. Play/pause/skip/speed controls all functional. |
| READ-10 | Copy selected text to clipboard | PARTIALLY IMPLEMENTED: Selection detection exists via `useNativeSelection`, but SelectionToolbar only has "Quote" button. **Need to add "Copy" button with `navigator.clipboard.writeText()`.** |
</phase_requirements>

## Current State Analysis

### What Already Exists (with file locations)

#### Reader Settings (READ-04, READ-05, READ-06)
- **File:** `src/pages/ReaderPage.tsx` lines 127-138
- Font size: `FONT_SIZES = [14, 16, 18, 20, 22, 24]` with pixel-level selection buttons
- Font family: sans/serif toggle
- Theme: light/dark/sepia with full CSS variable sets in `src/index.css`
- Line height: `LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0]`
- All persisted to localStorage keys: `reader-theme`, `reader-font`, `reader-font-size`, `reader-line-height`
- Settings panel toggles via gear icon in header

#### Table of Contents (READ-07)
- **File:** `src/pages/ReaderPage.tsx` lines 34-56
- `extractToc()` function parses markdown `#`, `##`, `###` headings
- `slugify()` generates IDs for heading elements
- TOC rendered in `Sheet` (Radix drawer) from left side
- Each heading rendered with `id={slugify(text)}` so `scrollIntoView` works
- TOC icon only appears when `toc.length > 0`

#### Text Highlighting & Quotes (READ-08)
- **File:** `src/pages/ReaderPage.tsx` lines 269-333
- `useNativeSelection` hook detects text selection within content `ref`
- `SelectionToolbar` appears at selection position with "Quote" button
- `createHighlight` mutation saves to `user_highlights` table via Supabase
- Highlights rendered inline via `applyHighlights()` with colored underlines
- Highlights list shown at article bottom with delete capability
- Color system: 5 colors (yellow/green/blue/pink/purple) in `src/lib/highlightColors.ts`
- Access control: `canHighlight()` currently returns `true` for all users

#### Audio Player (READ-09)
- **File:** `src/components/MiniAudioPlayer.tsx`, `src/contexts/AudioContext.tsx`
- Full `AudioProvider` context with play/pause/seek/skip/speed/stop
- `MiniAudioPlayer` fixed at bottom of reader view
- Toggle via headphones icon in reader header
- Audio URL fetched via Supabase Edge Function `get-audio-url` (signed URLs)
- Speed persistence via localStorage `audio-speed`
- Access gated by `canListenAudio` (Pro only)

#### Copy to Clipboard (READ-10)
- **File:** `src/components/reader/SelectionToolbar.tsx`
- Selection detection works, but toolbar only has "Quote" button
- **Missing:** Copy button with `navigator.clipboard.writeText()` call

### Database Schema (from types.ts)

**Existing tables relevant to this phase:**

| Table | Columns | Usage |
|-------|---------|-------|
| `profiles` | id, display_name, avatar_url, role, subscription_type, subscription_expires_at | User profile, no reader prefs columns |
| `user_highlights` | id, user_id, book_id, text, note, color, position_start, position_end, created_at | Quotes/highlights storage |
| `user_progress` | id, user_id, book_id, progress_percent, scroll_position, audio_position_ms, last_read_at, updated_at | Reading/audio progress |
| `summaries` | id, book_id, content (markdown), audio_url, audio_size_bytes, word_count | Summary content |

**No database changes needed.** Reader preferences are stored in localStorage which is appropriate for this use case (device-specific settings like font size and theme).

### State Management Pattern
- **React Context** for cross-component state: `AuthContext`, `AudioContext`
- **TanStack Query** for server state (summaries, highlights, progress)
- **localStorage** for device-local preferences (font size, theme, audio speed)
- **No Redux/Zustand** -- simple context + hooks pattern throughout

### Content Structure
- Summary content stored as **Markdown** in `summaries.content`
- Rendered via `react-markdown` with custom component overrides for h1-h3, p, li, blockquote, etc.
- Headings used for TOC extraction via regex `^(#{1,3})\s+(.+)$`
- Content may be truncated for free users via `truncateSummary()` in `useSummary.ts`

### Offline Reader Parity
- `OfflineReaderPage.tsx` is a separate component with its own theme/audio handling
- Does NOT share the reader settings infrastructure with `ReaderPage`
- Phase 2 should NOT attempt to sync these -- keep scoped to online ReaderPage

## Standard Stack

### Core (Already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| react-markdown | ^10.1.0 | Markdown rendering in reader | In use |
| @radix-ui/react-dialog (Sheet) | ^1.1.14 | TOC sidebar drawer | In use |
| localforage | ^1.10.0 | Offline storage (IndexedDB) | In use (not needed for this phase) |
| lucide-react | ^0.462.0 | Icons (Quote, Copy, Settings, etc.) | In use |
| @tanstack/react-query | ^5.83.0 | Server state for highlights | In use |

### No New Dependencies Needed
All Phase 2 requirements can be met with existing dependencies. `navigator.clipboard` is a browser API.

## Architecture Patterns

### Current Reader Component Structure
```
ReaderPage.tsx (monolithic ~630 lines)
├── Settings state (theme, fontSize, fontFamily, lineHeight)
├── TOC extraction (extractToc, slugify)
├── Highlight rendering (applyHighlights, highlightChildren)
├── Progress tracking (scroll listener, Supabase upsert)
├── Favorites mutation
├── Highlight CRUD mutations
├── Selection handling (useNativeSelection)
├── Audio player toggle
└── Full JSX render
```

### Recommended Refactoring (Optional, for maintainability)
```
src/
├── components/reader/
│   ├── SelectionToolbar.tsx        # exists - add Copy button
│   ├── ReaderSettings.tsx          # extract settings panel
│   ├── ReaderToc.tsx               # extract TOC sheet
│   └── HighlightsList.tsx          # extract highlights section
├── hooks/
│   ├── useNativeSelection.ts       # exists
│   ├── useReaderSettings.ts        # extract localStorage logic
│   └── useReaderHighlights.ts      # extract highlight CRUD
└── pages/
    └── ReaderPage.tsx              # slim orchestrator
```

**Note:** Refactoring is optional. The existing monolithic component works. If the planner decides to refactor, it should be a separate task from feature work.

### Anti-Patterns to Avoid
- **Don't add a new Context for reader settings.** localStorage + component state is the correct pattern for device-specific UI preferences. A context would add unnecessary complexity and re-renders.
- **Don't sync reader preferences to Supabase.** Font size and theme are device-specific, not account-specific. localStorage is correct.
- **Don't modify OfflineReaderPage in this phase.** It's a separate concern with different constraints.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard access | Custom clipboard API wrapper | `navigator.clipboard.writeText()` | Browser API, universal support, async |
| Text selection detection | Custom DOM traversal | Existing `useNativeSelection` hook | Already built and working |
| Drawer/Sheet component | Custom sidebar | Existing `Sheet` from shadcn/ui | Already used for TOC |
| Toast notifications | Custom notification system | Existing `toast()` from hooks | Pattern established in codebase |

## Common Pitfalls

### Pitfall 1: Copy-to-Clipboard on iOS/Safari
**What goes wrong:** `navigator.clipboard.writeText()` requires a secure context (HTTPS) and user gesture. On some older iOS versions, it may fail silently.
**Why it happens:** Safari's clipboard API has stricter security requirements.
**How to avoid:** Always call from a click handler (user gesture). Wrap in try/catch with fallback toast message. The app is served over HTTPS (Vercel) so secure context is met.
**Warning signs:** Works in Chrome but fails silently in Safari.

### Pitfall 2: Selection Disappearing on Button Click
**What goes wrong:** Clicking "Copy" in the SelectionToolbar may clear the native selection before the text can be read.
**Why it happens:** Focus change to button clears selection in some browsers.
**How to avoid:** Read `selection.text` (from `useNativeSelection` state) rather than re-reading `window.getSelection()` at click time. The current hook already captures text in state, so this is handled.

### Pitfall 3: TOC Heading ID Collisions
**What goes wrong:** Two headings with the same text produce the same slug, breaking navigation.
**Why it happens:** `slugify()` is deterministic -- same input produces same output.
**How to avoid:** This is a minor edge case. Real summaries are unlikely to have duplicate headings. Not worth over-engineering for Phase 2.

### Pitfall 4: Font Size Label Mapping
**What goes wrong:** Requirements say "small/medium/large/XL" but implementation uses pixel values (14-24px).
**Why it happens:** Original implementation chose fine-grained control over labeled presets.
**How to avoid:** Decide whether the current 6-size pixel selector satisfies the requirement or if it needs to be simplified to 4 labeled presets. The current UX is arguably better (more control). Recommend keeping current implementation as-is since it exceeds the requirement.

## Code Examples

### Adding Copy Button to SelectionToolbar
```typescript
// In src/components/reader/SelectionToolbar.tsx
import { Quote, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  rect: DOMRect;
  text: string; // Add text prop
  onQuote: () => void;
}

export default function SelectionToolbar({ rect, text, onQuote }: Props) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Скопировано" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  // ... positioning logic unchanged ...

  return (
    <div className="fixed z-50 ..." style={{ top, left }}>
      <div className="flex items-center gap-1 rounded-xl border ...">
        <button onClick={onQuote} className="...">
          <Quote size={16} /> Цитата
        </button>
        <button onClick={handleCopy} className="...">
          <Copy size={16} /> Копировать
        </button>
      </div>
    </div>
  );
}
```

### Passing Text to SelectionToolbar (in ReaderPage)
```typescript
// Current:
{selection && <SelectionToolbar rect={selection.rect} onQuote={handleQuote} />}

// Updated:
{selection && <SelectionToolbar rect={selection.rect} text={selection.text} onQuote={handleQuote} />}
```

## Gaps Analysis

### What's Actually Missing vs Requirements

| Requirement | Status | Gap |
|-------------|--------|-----|
| READ-04 | DONE | None (6 sizes exceeds "small/medium/large/XL") |
| READ-05 | DONE | None |
| READ-06 | DONE | None |
| READ-07 | DONE | None |
| READ-08 | DONE | None |
| READ-09 | DONE | None |
| READ-10 | PARTIAL | Missing copy button in SelectionToolbar (~15 lines of code) |

### The Real Work

1. **Add Copy button to SelectionToolbar** -- the only actual feature gap
2. **Write tests** to verify all 7 requirements are met
3. **Mark requirements as done** in REQUIREMENTS.md
4. **Optional:** Refactor ReaderPage into smaller components for maintainability

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + jsdom + @testing-library/react 16 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| READ-04 | Font size persists to localStorage | unit | `npx vitest run src/test/reader-settings.test.ts -t "font size"` | No - Wave 0 |
| READ-05 | Theme persists to localStorage, CSS class applied | unit | `npx vitest run src/test/reader-settings.test.ts -t "theme"` | No - Wave 0 |
| READ-06 | Line height persists to localStorage | unit | `npx vitest run src/test/reader-settings.test.ts -t "line spacing"` | No - Wave 0 |
| READ-07 | extractToc parses headings, slugify generates IDs | unit | `npx vitest run src/test/reader-toc.test.ts` | No - Wave 0 |
| READ-08 | Highlight mutation saves to Supabase | integration | Manual verification (requires Supabase) | No |
| READ-09 | Audio player toggles in reader | integration | Manual verification (requires AudioContext) | No |
| READ-10 | Copy button calls clipboard API | unit | `npx vitest run src/test/reader-copy.test.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `src/test/reader-settings.test.ts` -- covers READ-04, READ-05, READ-06 (test localStorage persistence)
- [ ] `src/test/reader-toc.test.ts` -- covers READ-07 (test extractToc and slugify functions)
- [ ] `src/test/reader-copy.test.ts` -- covers READ-10 (test copy button renders and calls clipboard)

## Risks and Concerns

### Low Risk
- **Feature completeness:** 6 of 7 requirements are already fully implemented. Only READ-10 (copy) needs code.
- **Database schema:** No changes needed. All tables and columns exist.

### Medium Risk
- **ReaderPage size:** At 630 lines, the component is large but functional. Refactoring would improve maintainability but risks introducing regressions. Recommend refactoring only if explicitly planned.
- **OfflineReaderPage drift:** The offline reader has its own separate implementation of themes/settings. This phase should not attempt to unify them, but the divergence should be documented.

### No Risk
- **Dependencies:** No new packages needed.
- **Breaking changes:** Adding a Copy button to SelectionToolbar is additive.

## Open Questions

1. **Font size labels vs pixel values**
   - What we know: Current implementation uses 6 pixel values (14-24). Requirement says "small/medium/large/XL" (4 labels).
   - What's unclear: Does the requirement strictly need 4 named presets, or does the current 6-size picker satisfy it?
   - Recommendation: Keep current implementation -- it provides more granular control and the visual UX is clean. The requirement is satisfied (user CAN adjust font size and it persists).

2. **Should reader settings sync across devices?**
   - What we know: Currently localStorage only (device-specific).
   - What's unclear: Whether users expect settings to follow them across devices.
   - Recommendation: Keep localStorage for Phase 2. Cross-device sync is a separate enhancement (would need `profiles` table columns like `reader_font_size`, `reader_theme`, etc.).

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `src/pages/ReaderPage.tsx` (630 lines)
- Direct codebase analysis of `src/components/reader/SelectionToolbar.tsx`
- Direct codebase analysis of `src/hooks/useNativeSelection.ts`
- Direct codebase analysis of `src/contexts/AudioContext.tsx`
- Direct codebase analysis of `src/integrations/supabase/types.ts` (database schema)
- Direct codebase analysis of `src/index.css` (theme CSS variables)

### Secondary (MEDIUM confidence)
- `navigator.clipboard.writeText()` browser API -- widely supported, well-documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, no new dependencies
- Architecture: HIGH - existing patterns clear from codebase analysis
- Pitfalls: HIGH - pitfalls are minor since features mostly exist
- Gap analysis: HIGH - direct code reading confirms feature completeness

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no external dependencies changing)
