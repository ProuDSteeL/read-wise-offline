# Phase 5: Quizzes & Learning - Research

**Researched:** 2026-03-19
**Domain:** Quiz/flashcard UI + Supabase DB schema + React state management
**Confidence:** HIGH

## Summary

Phase 5 adds a combined "Learning" page per book with multiple-choice quizzes and flip flashcards. The project already has all the building blocks: Embla carousel for flashcard navigation, shadcn Tabs for mode switching, ChevronUp/ChevronDown reorder pattern in AdminBookForm, and useProfileStats hook for stats extension. The main work is (1) four new DB tables with RLS, (2) a new LearningPage with quiz and flashcard modes, (3) extending AdminBookForm with a 4th tab, and (4) extending ProfilePage stats.

No new libraries are needed. The existing stack (React Query, Supabase, Embla carousel, shadcn/ui, Tailwind) covers everything. The 3D card flip animation is pure CSS (transform: rotateY + perspective + backface-visibility). Quiz state management is local React state -- no need for context or external state libraries since quiz flow is contained within a single page.

**Primary recommendation:** Build database tables first, then admin creation UI, then the Learning page (quiz + flashcards), then stats integration. Reuse existing patterns aggressively -- Embla for flashcard carousel, Tabs for quiz/flashcard mode switching, ChevronUp/ChevronDown for admin reordering.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Quiz accessible from two locations: "Take Quiz" button on BookPage AND CTA prompt at end of ReaderPage
- Combined "Learning" page per book -- quiz and flashcards live together (not separate pages)
- Questions presented one at a time with progress indicator (e.g. 1/5)
- Instant feedback after each answer: immediately shows correct/wrong, highlights correct answer
- Results screen shows score (e.g. 4/5) + full review of ALL questions with user's answer vs correct answer
- Unlimited retakes allowed; only best score saved to profile
- Flashcards are part of the same Learning page as quizzes (not separate)
- Tap anywhere on the card to flip with 3D rotate-Y animation
- Navigate between cards via swipe left/right (Embla carousel pattern) + Next/Previous buttons for accessibility
- Simple self-rating after flip: two buttons -- "Knew it" / "Didn't know"
- Progress tracked as cards mastered (rated "Knew it")
- New "Quiz & Flashcards" tab in AdminBookForm (4th tab alongside Info, Content, Key Ideas)
- Quiz questions: text input for question + 4 answer options + radio to mark correct answer
- 4 options per question, exactly 1 correct -- standard multiple-choice
- Flashcards: two text inputs per card -- front (question/concept) and back (answer/explanation)
- Manual creation only (no auto-generation from key ideas)
- Reorder support (same ChevronUp/ChevronDown pattern as key ideas)
- Add 2 new stat cards to ProfilePage: "Quizzes passed" and "Cards mastered"
- Total 5 stat cards in horizontal scroll alongside existing (Books read, Total time, Streak)
- BookPage shows small combined progress bar for quiz + flashcard completion per book
- No per-book text badges -- just progress bar

### Claude's Discretion
- DB table schema design (quiz_questions, flashcards, quiz_results, flashcard_progress)
- Exact 3D flip animation implementation (CSS transforms)
- Learning page layout (tabs vs scroll sections for quiz/flashcard modes)
- Color coding for correct/wrong answers
- Progress bar design on BookPage
- RLS policies for new tables
- How to compute "quizzes passed" and "cards mastered" aggregates

### Deferred Ideas (OUT OF SCOPE)
- Auto-generation of flashcards from key ideas -- future enhancement
- Spaced repetition algorithm (SM-2 or similar) -- future enhancement, currently simple "knew/didn't know"
- Leaderboards / social quiz scores -- v2 gamification phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUIZ-01 | Multiple-choice quiz with 3-5 questions per summary, accessible after reading | DB schema for quiz_questions, LearningPage quiz mode with one-at-a-time presentation, entry points from BookPage + ReaderPage |
| QUIZ-02 | Flashcards for key concepts -- front shows question/concept, flip reveals answer | DB schema for flashcards, Embla carousel + CSS 3D flip animation, self-rating buttons |
| QUIZ-03 | Admin can create quiz questions and flashcards per book in admin form | 4th tab in AdminBookForm with quiz question editor (4 options + correct marker) and flashcard editor (front/back), reorder support |
| QUIZ-04 | Quiz results and flashcard progress saved and displayed in user profile stats | DB tables quiz_results + flashcard_progress, useProfileStats extension, ProfilePage 5-card horizontal scroll, BookPage progress bar |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.83.0 | Data fetching for quiz/flashcard CRUD | Already used everywhere |
| embla-carousel-react | ^8.6.0 | Flashcard swipe navigation | Already used for key ideas carousel |
| @radix-ui/react-tabs | (via shadcn) | Quiz/flashcard mode tabs on Learning page | Already used in AdminBookForm |
| @supabase/supabase-js | (installed) | DB queries for new tables | Project standard |
| lucide-react | ^0.462.0 | Icons (Target, Brain, ChevronUp/Down, Check, X) | Already used everywhere |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwind-merge | ^2.6.0 | Conditional class merging for flip animation states | cn() helper |
| react-router-dom | ^6.30.1 | Route for /book/:id/learn | Already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local state for quiz | Zustand/Context | Overkill -- quiz state is page-scoped, useState is sufficient |
| Custom flip animation | framer-motion | Extra dependency -- CSS transform is simpler and lighter for a single animation |
| Custom carousel | Swiper.js | Already have Embla via shadcn -- reuse it |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── LearningPage.tsx        # Combined quiz + flashcard page
├── components/
│   ├── quiz/
│   │   ├── QuizQuestion.tsx     # Single question with 4 options
│   │   ├── QuizResults.tsx      # Score + full review
│   │   └── QuizProgress.tsx     # Progress indicator (1/5)
│   ├── flashcard/
│   │   ├── FlashCard.tsx        # 3D flip card component
│   │   └── FlashCardDeck.tsx    # Carousel wrapper + rating buttons
│   └── BookLearningProgress.tsx # Progress bar for BookPage
├── hooks/
│   ├── useQuiz.ts               # Fetch quiz questions + submit results
│   ├── useFlashcards.ts         # Fetch flashcards + track progress
│   └── useProfileStats.ts      # Extended with quiz/flashcard stats
└── pages/
    └── AdminBookForm.tsx        # Extended with 4th tab
```

### Pattern 1: Quiz State Machine (Local useState)
**What:** Quiz flow managed as a simple state machine: "ready" -> "in-progress" -> "completed"
**When to use:** For the quiz taking experience on LearningPage
**Example:**
```typescript
type QuizState =
  | { phase: "ready" }
  | { phase: "in-progress"; currentIndex: number; answers: Record<string, string> }
  | { phase: "completed"; score: number; answers: Record<string, string> };

const [quizState, setQuizState] = useState<QuizState>({ phase: "ready" });

// On answer selection -- show instant feedback, then advance after delay
const handleAnswer = (questionId: string, optionId: string) => {
  setSelectedAnswer(optionId);  // triggers visual feedback
  setTimeout(() => {
    setQuizState(prev => {
      if (prev.phase !== "in-progress") return prev;
      const newAnswers = { ...prev.answers, [questionId]: optionId };
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= totalQuestions) {
        return { phase: "completed", score: calculateScore(newAnswers), answers: newAnswers };
      }
      return { ...prev, currentIndex: nextIndex, answers: newAnswers };
    });
    setSelectedAnswer(null);
  }, 1200);  // show feedback for 1.2s
};
```

### Pattern 2: CSS 3D Flip Card
**What:** Pure CSS card flip with rotateY transform
**When to use:** Flashcard component
**Example:**
```typescript
const FlashCard = ({ front, back }: { front: string; back: string }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="perspective-[1000px] h-64 w-full cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={cn(
        "relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
        flipped && "[transform:rotateY(180deg)]"
      )}>
        {/* Front */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card p-6 shadow-elevated [backface-visibility:hidden]">
          <p className="text-center text-lg font-semibold">{front}</p>
        </div>
        {/* Back */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl gradient-primary p-6 shadow-elevated [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-center text-sm leading-relaxed text-primary-foreground">{back}</p>
        </div>
      </div>
    </div>
  );
};
```

### Pattern 3: Admin Reorder (existing pattern from key ideas)
**What:** ChevronUp/ChevronDown swap pattern already in AdminBookForm
**When to use:** Reordering quiz questions and flashcards
**Example:**
```typescript
// Already exists in AdminBookForm line 144-148
const moveItem = (from: number, to: number) => {
  const updated = [...items];
  [updated[from], updated[to]] = [updated[to], updated[from]];
  setItems(updated);
};
```

### Pattern 4: Best Score Upsert
**What:** Save quiz result, keeping only the best score per user per book
**When to use:** After quiz completion
**Example:**
```typescript
const saveQuizResult = useMutation({
  mutationFn: async ({ bookId, score, totalQuestions }: { bookId: string; score: number; totalQuestions: number }) => {
    // Check existing best score
    const { data: existing } = await supabase
      .from("quiz_results")
      .select("id, score")
      .eq("user_id", user!.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (existing && existing.score >= score) return; // keep best

    const { error } = await supabase.from("quiz_results").upsert(
      { user_id: user!.id, book_id: bookId, score, total_questions: totalQuestions },
      { onConflict: "user_id,book_id" }
    );
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["profile_stats"] });
    queryClient.invalidateQueries({ queryKey: ["book_learning_progress"] });
  },
});
```

### Anti-Patterns to Avoid
- **Storing answers in URL params:** Quiz state is ephemeral -- keep in useState, not URL
- **Fetching all questions then filtering:** This project has 3-5 questions per book -- fetch all at once, no pagination needed
- **Using Context for quiz state:** The quiz flow exists entirely within LearningPage -- no cross-component state sharing needed
- **Re-fetching on each card flip:** Fetch all flashcards once, manage flip state locally

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card swipe navigation | Custom touch handlers | Embla carousel (already installed) | Touch/mouse/keyboard handling, momentum, snap points |
| Tab navigation | Custom tab state | shadcn Tabs (@radix-ui/react-tabs) | Accessibility (ARIA), keyboard nav, focus management |
| 3D flip animation | JavaScript animation library | CSS transforms (rotateY + perspective) | No dependencies, GPU-accelerated, simpler code |
| Form reorder | Drag-and-drop library | ChevronUp/ChevronDown swap (existing pattern) | Already proven in key ideas admin, simple and consistent |

**Key insight:** This phase adds no new dependencies. Every UI need maps to an existing component or CSS pattern in the project.

## Common Pitfalls

### Pitfall 1: Flashcard Carousel Interfering with Flip
**What goes wrong:** Tap to flip the card triggers carousel scroll, or swipe to navigate flips the card
**Why it happens:** Both click and swipe events originate from the same card element
**How to avoid:** Use Embla's `watchDrag` option or a clear gesture distinction -- tap flips, horizontal swipe navigates. Alternatively, keep flip button separate from the card swipe area, but user decision says "tap anywhere to flip" so need to carefully distinguish tap vs swipe. Embla handles this: a short tap (no drag) fires onClick, while a drag fires Embla's scroll.
**Warning signs:** Cards flip during swipe attempts, or swipe doesn't work because tap handler captures the event

### Pitfall 2: RLS Without WITH CHECK
**What goes wrong:** Insert/upsert operations silently fail
**Why it happens:** Project-specific: RLS policies with `USING` but no `WITH CHECK` cause silent insert failures (documented in project memory)
**How to avoid:** Always include both `USING (...)` and `WITH CHECK (...)` in RLS policies. For user-owned rows: `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
**Warning signs:** Quiz results or flashcard progress not saving, no error in console

### Pitfall 3: Supabase Types Not Updated After Migration
**What goes wrong:** TypeScript errors when querying new tables -- "Property does not exist on type Database"
**Why it happens:** `src/integrations/supabase/types.ts` is auto-generated and needs regeneration after adding new tables
**How to avoid:** After deploying migration, run `npx supabase gen types typescript` or manually add types. Given this project's history of schema mismatches (see project memory), manually adding types matching the migration is safer.
**Warning signs:** Red squiggles on `.from("quiz_questions")` etc.

### Pitfall 4: Stats Grid Layout Breaking with 5 Cards
**What goes wrong:** ProfilePage stats go from 3-column grid to needing horizontal scroll for 5 cards
**Why it happens:** Current layout is `grid grid-cols-3 gap-3` -- adding 2 more cards won't fit
**How to avoid:** Switch from grid to horizontal scroll container (`flex gap-3 overflow-x-auto`) matching existing scrollable patterns in the project
**Warning signs:** Stats cards wrap to second row or overflow the container

### Pitfall 5: Best Score Logic Race Condition
**What goes wrong:** Two rapid quiz completions could both check existing score, both find it lower, and both write
**Why it happens:** Check-then-update is not atomic
**How to avoid:** Use upsert with a GREATEST function or a DB trigger, OR accept the minor race (quiz retakes are user-initiated, not concurrent). Simplest: use `ON CONFLICT ... DO UPDATE SET score = GREATEST(quiz_results.score, EXCLUDED.score)` if Supabase supports it in the upsert, otherwise handle in application code since concurrent quiz submissions by the same user are effectively impossible.
**Warning signs:** Best score being overwritten by lower score

## Code Examples

### DB Migration: New Tables
```sql
-- quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',  -- [{id, text}] array of 4 options
  correct_option_id TEXT NOT NULL,       -- id of correct option from options array
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- quiz_results table (one row per user per book, best score only)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- flashcard_progress table (one row per user per flashcard)
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  mastered BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;

-- quiz_questions: anyone can read, admins can write
CREATE POLICY "Anyone can read quiz_questions"
  ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins can insert quiz_questions"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update quiz_questions"
  ON public.quiz_questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete quiz_questions"
  ON public.quiz_questions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- flashcards: anyone can read, admins can write
CREATE POLICY "Anyone can read flashcards"
  ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "Admins can insert flashcards"
  ON public.flashcards FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update flashcards"
  ON public.flashcards FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete flashcards"
  ON public.flashcards FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- quiz_results: users can read/write own
CREATE POLICY "Users can read own quiz_results"
  ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz_results"
  ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz_results"
  ON public.quiz_results FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- flashcard_progress: users can read/write own
CREATE POLICY "Users can read own flashcard_progress"
  ON public.flashcard_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcard_progress"
  ON public.flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcard_progress"
  ON public.flashcard_progress FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- GRANTs for service_role (project requirement)
GRANT ALL ON public.quiz_questions TO service_role;
GRANT ALL ON public.flashcards TO service_role;
GRANT ALL ON public.quiz_results TO service_role;
GRANT ALL ON public.flashcard_progress TO service_role;
```

**Design notes on quiz_questions.options:**
- JSONB array: `[{"id": "a", "text": "Option text"}, {"id": "b", "text": "..."}, ...]`
- Using JSONB instead of separate `option_a/b/c/d` columns is more flexible and avoids 4 separate text columns
- The `correct_option_id` references the `id` field within the JSONB array
- Alternative: 4 columns (option_a, option_b, option_c, option_d, correct_index INT) -- simpler to query but less flexible. Either approach works for exactly-4-options.

**Recommendation: Use 4 explicit columns** (`option_a`, `option_b`, `option_c`, `option_d`, `correct_option` INT 0-3) because:
1. Supabase types.ts auto-generation handles flat columns better than JSONB
2. No JSON parsing needed on the client
3. Exactly 4 options is a locked decision -- no flexibility needed

### Extended useProfileStats
```typescript
// Add to existing useProfileStats hook
// Quizzes passed: count of quiz_results rows (one per book completed)
const { count: quizzesPassed } = await supabase
  .from("quiz_results")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user!.id);

// Cards mastered: count of flashcard_progress rows where mastered = true
const { count: cardsMastered } = await supabase
  .from("flashcard_progress")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user!.id)
  .eq("mastered", true);

return { readCount, totalHours, streak, quizzesPassed: quizzesPassed ?? 0, cardsMastered: cardsMastered ?? 0 };
```

### ProfilePage Stats: Grid to Horizontal Scroll
```typescript
// Current: grid grid-cols-3 (3 cards)
// New: horizontal scroll (5 cards)
<div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
  {[
    { value: String(stats?.readCount ?? 0), label: "Прочитано", icon: BookOpen },
    { value: `${stats?.totalHours ?? 0} ч`, label: "Время", icon: Clock },
    { value: String(stats?.streak ?? 0), label: "Серия дней", icon: Flame },
    { value: String(stats?.quizzesPassed ?? 0), label: "Квизы", icon: Target },
    { value: String(stats?.cardsMastered ?? 0), label: "Карточки", icon: Brain },
  ].map(({ value, label, icon: Icon }) => (
    <div key={label} className="flex min-w-[100px] flex-col items-center gap-1.5 rounded-2xl bg-card p-4 shadow-card">
      <Icon className="h-4 w-4 text-sage" />
      <span className="text-xl font-extrabold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  ))}
</div>
```

### BookPage Progress Bar
```typescript
// Small progress bar showing combined quiz + flashcard completion
const useBookLearningProgress = (bookId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["book_learning_progress", user?.id, bookId],
    queryFn: async () => {
      // Quiz: has the user completed it?
      const { data: quizResult } = await supabase
        .from("quiz_results")
        .select("score, total_questions")
        .eq("user_id", user!.id)
        .eq("book_id", bookId)
        .maybeSingle();

      // Flashcards: how many mastered out of total?
      const { count: totalCards } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("book_id", bookId);

      const { count: masteredCards } = await supabase
        .from("flashcard_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("mastered", true);
        // Note: need to join through flashcard_id -> flashcards.book_id
        // Alternative: add book_id to flashcard_progress for simpler queries

      const quizDone = !!quizResult;
      const flashcardPercent = totalCards ? (masteredCards ?? 0) / totalCards : 0;
      const overallPercent = ((quizDone ? 0.5 : 0) + (flashcardPercent * 0.5)) * 100;

      return { quizDone, flashcardPercent, overallPercent, totalCards: totalCards ?? 0, masteredCards: masteredCards ?? 0 };
    },
    enabled: !!user,
  });
};
```

**Important schema note for flashcard_progress queries:** The `flashcard_progress` table links to `flashcards` via `flashcard_id`, but to query "mastered cards for a specific book" requires joining through `flashcards.book_id`. Two options:
1. **Add `book_id` to `flashcard_progress`** (denormalized but simpler queries)
2. **Join through flashcards table** using Supabase's relation syntax: `.select("id, flashcards!inner(book_id)").eq("flashcards.book_id", bookId)`

**Recommendation: Add `book_id` to `flashcard_progress`** for simpler, faster queries. The denormalization is minimal and the table is write-infrequent.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `transform` with vendor prefixes | Tailwind arbitrary values `[transform:rotateY(180deg)]` | Tailwind 3.x | No need for custom CSS file |
| Custom swipe detection | Embla carousel 8.x handles touch/pointer events | Current | Reliable swipe handling with momentum |
| Separate quiz/flashcard pages | Combined learning page with tabs | User decision | Single route, tabbed experience |

**Deprecated/outdated:**
- None relevant -- this phase uses stable, well-established patterns (CSS transforms, Embla, React Query)

## Open Questions

1. **Admin RLS: profiles.role vs user_roles table**
   - What we know: Project memory says `profiles` has `role` as text (not separate user_roles table). But the categories migration references `user_roles` table.
   - What's unclear: Which admin check pattern is canonical -- `profiles.role = 'admin'` or `user_roles.role = 'admin'`?
   - Recommendation: Check what the categories migration uses (it references `user_roles`). Use the same pattern for consistency. If both exist, prefer `user_roles` as it matches the most recent migration.

2. **Flashcard progress: book-level vs card-level tracking for BookPage progress bar**
   - What we know: User wants per-book progress bar on BookPage showing combined quiz + flashcard completion
   - What's unclear: Whether to denormalize `book_id` into `flashcard_progress` or use Supabase joins
   - Recommendation: Add `book_id` to `flashcard_progress` for query simplicity. The denormalization cost is minimal.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.0 |
| Config file | `vitest.config.ts` (uses jsdom, @/ alias) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUIZ-01 | Quiz renders questions one-at-a-time, computes score correctly | unit | `npx vitest run src/test/quiz-logic.test.ts -x` | Wave 0 |
| QUIZ-02 | Flashcard flip state toggles, self-rating updates | unit | `npx vitest run src/test/flashcard-logic.test.ts -x` | Wave 0 |
| QUIZ-03 | Admin quiz/flashcard form validation (4 options, correct marked, front/back filled) | unit | `npx vitest run src/test/admin-quiz-form.test.ts -x` | Wave 0 |
| QUIZ-04 | Stats computation returns correct quizzesPassed and cardsMastered | unit | `npx vitest run src/test/profile-stats-quiz.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/test/quiz-logic.test.ts` -- covers QUIZ-01 (score calculation, state transitions)
- [ ] `src/test/flashcard-logic.test.ts` -- covers QUIZ-02 (flip state, mastery tracking)
- [ ] `src/test/admin-quiz-form.test.ts` -- covers QUIZ-03 (form validation rules)
- [ ] `src/test/profile-stats-quiz.test.ts` -- covers QUIZ-04 (aggregate stat queries)

## Sources

### Primary (HIGH confidence)
- Project codebase: AdminBookForm.tsx, BookPage.tsx, ProfilePage.tsx, useProfileStats.ts, types.ts -- verified existing patterns
- Project memory: project_supabase_grants.md, project_db_schema.md -- verified RLS/schema requirements
- supabase/migrations/ -- verified table creation and RLS policy patterns

### Secondary (MEDIUM confidence)
- CSS 3D transforms: `perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`, `rotateY(180deg)` -- well-established CSS spec, verified by Tailwind arbitrary value support

### Tertiary (LOW confidence)
- None -- all recommendations based on existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all patterns verified in codebase
- Architecture: HIGH - DB schema follows existing patterns (key_ideas, user_progress), UI reuses existing components
- Pitfalls: HIGH - identified from project memory (RLS WITH CHECK, schema mismatches) and mechanical analysis (carousel + flip interaction)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no fast-moving dependencies)
