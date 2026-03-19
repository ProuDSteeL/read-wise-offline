# Phase 5: Quizzes & Learning - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users test and reinforce their understanding of book summaries through quizzes and flashcards. A combined "Learning" page per book hosts both quiz and flashcard modes. Admin creates quiz questions and flashcards via AdminBookForm. Results and progress appear in user profile stats. New DB tables needed for quizzes, flashcards, and user results.

</domain>

<decisions>
## Implementation Decisions

### Quiz Flow & Presentation
- Quiz accessible from two locations: "Take Quiz" button on BookPage AND CTA prompt at end of ReaderPage
- Combined "Learning" page per book — quiz and flashcards live together (not separate pages)
- Questions presented one at a time with progress indicator (e.g. 1/5)
- Instant feedback after each answer: immediately shows correct/wrong, highlights correct answer
- Results screen shows score (e.g. 4/5) + full review of ALL questions with user's answer vs correct answer
- Unlimited retakes allowed; only best score saved to profile

### Flashcard Interaction
- Flashcards are part of the same Learning page as quizzes (not separate)
- Tap anywhere on the card to flip with 3D rotate-Y animation
- Navigate between cards via swipe left/right (Embla carousel pattern) + Next/Previous buttons for accessibility
- Simple self-rating after flip: two buttons — "✓ Knew it" / "✗ Didn't know"
- Progress tracked as cards mastered (rated "Knew it")

### Admin Creation UX
- New "Quiz & Flashcards" tab in AdminBookForm (4th tab alongside Info, Content, Key Ideas)
- Quiz questions: text input for question + 4 answer options + radio to mark correct answer
- 4 options per question, exactly 1 correct — standard multiple-choice
- Flashcards: two text inputs per card — front (question/concept) and back (answer/explanation)
- Manual creation only (no auto-generation from key ideas)
- Reorder support (same ChevronUp/ChevronDown pattern as key ideas)

### Stats Integration
- Add 2 new stat cards to ProfilePage: "🎯 Quizzes passed" and "🧠 Cards mastered"
- Total 5 stat cards in horizontal scroll alongside existing (Books read, Total time, Streak)
- BookPage shows small combined progress bar for quiz + flashcard completion per book
- No per-book text badges — just progress bar

### Claude's Discretion
- DB table schema design (quiz_questions, flashcards, quiz_results, flashcard_progress)
- Exact 3D flip animation implementation (CSS transforms)
- Learning page layout (tabs vs scroll sections for quiz/flashcard modes)
- Color coding for correct/wrong answers
- Progress bar design on BookPage
- RLS policies for new tables
- How to compute "quizzes passed" and "cards mastered" aggregates

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Book Page & Learning Entry Points
- `src/pages/BookPage.tsx` — Book detail page, will get "Take Quiz" button. Already has key ideas carousel pattern.
- `src/pages/ReaderPage.tsx` — Reader page, will get end-of-reading CTA for quiz.

### Admin Form (extends)
- `src/pages/AdminBookForm.tsx` — Tabbed form with Info/Content/Key Ideas. Add 4th "Quiz & Flashcards" tab. Key ideas use ChevronUp/ChevronDown reorder pattern.

### Profile Stats (extends)
- `src/hooks/useProfileStats.ts` — Currently computes readCount, totalHours, streak. Extend with quizzesPassed, cardsMastered.
- `src/pages/ProfilePage.tsx` — Currently shows 3 stat cards. Extend to 5 with horizontal scroll.

### UI Components (reuse)
- `src/components/ui/carousel.tsx` — Embla-based carousel, reuse for flashcard navigation
- `src/components/KeyIdeaCard.tsx` — Card component pattern, reference for flashcard card design
- `src/components/ui/tabs.tsx` — shadcn Tabs, used in AdminBookForm and potentially on Learning page

### Database
- `src/integrations/supabase/types.ts` — Auto-generated types, will need regeneration after adding new tables
- `supabase/migrations/` — Migration pattern for new quiz/flashcard tables

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Carousel` (Embla): Already used for key ideas on BookPage — reuse for flashcard swipe navigation
- `KeyIdeaCard`: Gradient card with title/content — reference for flashcard visual design
- `ChevronUp/ChevronDown` reorder in AdminBookForm: Same pattern for quiz question and flashcard reordering
- `useProfileStats` hook: Extend with quiz/flashcard aggregation queries
- `Tabs` component: Used in AdminBookForm — add new tab for quiz/flashcard management

### Established Patterns
- React Query for all data fetching (useQuery/useMutation with Supabase)
- Supabase migrations for DB schema changes
- Toast notifications via Sonner for user feedback
- Tailwind + cn() helper for conditional styling
- Context API for global state (if quiz state needs to persist across navigation)

### Integration Points
- `BookPage.tsx`: Add "Take Quiz" / "Study" button linking to Learning page
- `ReaderPage.tsx`: Add end-of-reading CTA to quiz
- `AdminBookForm.tsx`: Add 4th tab with quiz questions + flashcards sub-sections
- `ProfilePage.tsx`: Extend stat cards from 3 to 5
- `App.tsx`: Add route for Learning page (e.g. `/book/:id/learn`)
- `useProfileStats.ts`: Add queries for quiz_results and flashcard_progress tables

</code_context>

<specifics>
## Specific Ideas

- Quiz and flashcards are part of the same "Learning" experience per book, not separate features
- Flashcard flip should feel tactile — 3D CSS transform rotation, not just show/hide
- Self-rating on flashcards ("Knew it" / "Didn't know") enables future spaced repetition if desired

</specifics>

<deferred>
## Deferred Ideas

- Auto-generation of flashcards from key ideas — future enhancement
- Spaced repetition algorithm (SM-2 or similar) — future enhancement, currently simple "knew/didn't know"
- Leaderboards / social quiz scores — v2 gamification phase

</deferred>

---

*Phase: 05-quizzes-learning*
*Context gathered: 2026-03-19*
