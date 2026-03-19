# Phase 4: Content & Collections - Research

**Researched:** 2026-03-19
**Domain:** React UI components, Embla carousel, Supabase queries, Tailwind layout
**Confidence:** HIGH

## Summary

Phase 4 is primarily a **polish and gap-fill phase** -- most features already exist in the codebase with partial implementations. The key work involves: (1) replacing the manual CSS scroll-snap key ideas section on BookPage with the shadcn Carousel (Embla-based) component already installed, (2) verifying that "Continue Reading" and reading stats already meet requirements (they do), and (3) transforming the homepage collection rendering from promotional banner cards to horizontal scrollable book rows per COLL-02.

The codebase uses React 18 + TypeScript + Tailwind + shadcn/ui + Supabase + TanStack React Query. All necessary libraries are already installed (embla-carousel-react 8.6.0, lucide-react, etc.). No new dependencies are needed.

**Primary recommendation:** Focus on surgical edits to existing components rather than building new ones. The AdminBookForm already has reorder buttons, ProfilePage already has the 3-column stats grid, and ContinueCard is fully functional. The biggest change is refactoring the homepage collection display from BannerCarousel to per-collection horizontal book rows.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Key Ideas Carousel: Full-width snap-scroll using shadcn Carousel (Embla-based), one card visible at a time, dot indicators below, placed below book description above action buttons, hide section if no key ideas
- Admin Key Ideas: Up/down arrow buttons for reordering (no drag-and-drop library), no hard limit on card count
- Continue Reading: Already implemented -- verify completeness
- Reading Stats: Three stat cards in horizontal row, show zeros for new users
- Collections Admin: Already has full CRUD -- verify book assignment via junction table
- Collections Homepage: Title-only section headers (no cover images, no description), horizontal scrollable book rows, show all featured collections

### Claude's Discretion
- Carousel animation/transition details (Embla defaults likely fine)
- Exact card styling updates for full-width key ideas
- Stats card visual design (icons, colors, spacing)
- Any minor layout adjustments needed for existing components

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Key ideas displayed as swipeable carousel on book page (5-10 cards) | shadcn Carousel component exists at `src/components/ui/carousel.tsx`, Embla 8.6.0 installed. BookPage has keyIdeas fetch + activeIdeaIdx state. Replace manual scroll div with Carousel/CarouselContent/CarouselItem. Use Embla `onSelect` API for dot indicator sync. |
| CONT-02 | Admin can upload key ideas with title + text per card and drag-and-drop reordering | AdminBookForm already has title+content inputs AND ChevronUp/ChevronDown reorder buttons with `moveIdea()` function. Already complete -- verify visually. |
| CONT-03 | "Continue reading" section on homepage shows user's unfinished summaries with progress | Already implemented in Index.tsx lines 93-110. useUserProgress filters 0 < progress < 100%. ContinueCard shows cover, progress bar, percentage. Already complete -- verify. |
| CONT-04 | Reading statistics in profile: books read, total reading time, reading streaks | ProfilePage lines 166-178 already render 3-column grid with BookOpen/Clock/Flame icons. useProfileStats computes readCount, totalHours, streak. Already complete -- verify. |
| COLL-01 | Admin can create and manage book collections with title, description, cover | AdminCollections.tsx has full CRUD with title, description, is_featured flag, book selection via checkbox list. Note: no cover image upload exists -- requirement says "cover" but context decision says "title-only headers, no cover images". Follow context decision. |
| COLL-02 | Collections displayed on homepage as horizontal scrollable sections | GAP IDENTIFIED: Currently rendered as BannerCarousel (promo cards showing first book cover + collection title). Needs refactoring to: SectionHeader per collection + horizontal scrollable BookCard rows. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| embla-carousel-react | 8.6.0 | Carousel engine for key ideas | Already used by shadcn Carousel component |
| @tanstack/react-query | 5.83.0 | Data fetching/caching | Project standard for all Supabase queries |
| @supabase/supabase-js | 2.99.1 | Backend client | Project database layer |
| lucide-react | 0.462.0 | Icons (ChevronUp/Down, BookOpen, Clock, Flame) | Project standard icon library |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwind-merge | 2.6.0 | cn() utility for class merging | All component styling |
| class-variance-authority | 0.7.1 | Variant-based component styles | shadcn components |

### No New Dependencies Needed

All required libraries are already in package.json. Do not install anything new.

## Architecture Patterns

### Existing Project Structure (Relevant Files)
```
src/
  components/
    ui/carousel.tsx        # shadcn Carousel (Embla wrapper) -- use for CONT-01
    KeyIdeaCard.tsx         # Gradient card -- update width from 280px to full
    ContinueCard.tsx        # Continue reading card -- already complete
    SectionHeader.tsx       # Section title + "See all" link -- reuse for COLL-02
    BookCard.tsx            # Standard book card -- use in collection rows
  hooks/
    useBooks.ts             # useKeyIdeas, useCollections -- already complete
    useProfileStats.ts      # readCount, totalHours, streak -- already complete
    useUserData.ts          # useUserProgress -- already complete
  pages/
    BookPage.tsx            # Key ideas section needs Carousel refactor
    Index.tsx               # Collections need refactor from BannerCarousel to book rows
    ProfilePage.tsx         # Stats already in 3-column grid
    AdminBookForm.tsx       # Key idea reordering already implemented
    AdminCollections.tsx    # Full CRUD already exists
```

### Pattern 1: Embla Carousel with Dot Indicators
**What:** Replace manual scroll-snap div with shadcn Carousel + custom dot indicators using Embla API
**When to use:** CONT-01 key ideas on BookPage
**Example:**
```typescript
// Use shadcn Carousel with Embla API for active slide tracking
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const [api, setApi] = useState<CarouselApi>();
const [activeIdx, setActiveIdx] = useState(0);

useEffect(() => {
  if (!api) return;
  const onSelect = () => setActiveIdx(api.selectedScrollSnap());
  api.on("select", onSelect);
  return () => { api.off("select", onSelect); };
}, [api]);

<Carousel setApi={setApi} className="w-full">
  <CarouselContent>
    {keyIdeas.map((idea) => (
      <CarouselItem key={idea.id}>
        <KeyIdeaCard index={idea.display_order + 1} title={idea.title} content={idea.content} />
      </CarouselItem>
    ))}
  </CarouselContent>
</Carousel>
{/* Dot indicators */}
<div className="mt-3 flex justify-center gap-1.5">
  {keyIdeas.map((_, i) => (
    <div key={i} className={`h-1.5 rounded-full transition-all ${
      i === activeIdx ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/20"
    }`} />
  ))}
</div>
```

### Pattern 2: Collection Book Rows on Homepage
**What:** Replace BannerCarousel with per-collection sections using SectionHeader + horizontal BookCard scroll
**When to use:** COLL-02 homepage collections
**Example:**
```typescript
// For each featured collection, render a section with title + horizontal book row
{collections?.map((col) => (
  <CollectionSection key={col.id} collection={col} />
))}

// CollectionSection component fetches its books via useCollectionBooks
const CollectionSection = ({ collection }) => {
  const { data: books } = useCollectionBooks(collection.id);
  if (!books?.length) return null;
  return (
    <section className="space-y-3">
      <SectionHeader title={collection.title} />
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {books.map((book) => (
          <BookCard key={book.id} ... />
        ))}
      </div>
    </section>
  );
};
```

### Anti-Patterns to Avoid
- **Don't remove BannerCarousel entirely without checking:** The BannerCarousel is well-implemented and could be kept for a different purpose later. But per COLL-02, collections on homepage should be horizontal book rows, not banner cards. Replace the collection rendering, but the BannerCarousel component itself can remain.
- **Don't add drag-and-drop library:** User explicitly chose up/down arrow buttons for reordering. The moveIdea() function already exists in AdminBookForm.
- **Don't add cover image upload to collections:** CONTEXT.md says "title-only section headers, no cover images" even though REQUIREMENTS.md mentions "cover." Follow CONTEXT.md as it represents the user's explicit decision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Swipeable carousel | Manual scroll-snap with scroll event listeners | shadcn Carousel (Embla) | Already installed, handles touch/mouse/keyboard, provides API for slide tracking |
| Dot indicators | Custom scroll position math | Embla's `selectedScrollSnap()` API | Accurate, handles edge cases, no manual calculation needed |
| Data fetching | Manual fetch/useState | TanStack React Query useQuery | Project standard, handles caching/refetching/loading states |

## Common Pitfalls

### Pitfall 1: CarouselItem Default Width
**What goes wrong:** CarouselItem defaults to `basis-full` which is correct for one-card-at-a-time, but the inner KeyIdeaCard has `w-[280px]` fixed width that will conflict.
**Why it happens:** KeyIdeaCard was designed for horizontal scroll layout, not carousel.
**How to avoid:** Remove the `w-[280px]` from KeyIdeaCard (or pass className override) and let it fill CarouselItem width. The CarouselItem already sets `basis-full` for full-width slides.
**Warning signs:** Cards appear narrow with empty space on sides.

### Pitfall 2: Embla Carousel Re-render Loop
**What goes wrong:** Setting state inside Embla's `onSelect` callback can cause unnecessary re-renders.
**Why it happens:** React state update triggers re-render, which can re-initialize Embla.
**How to avoid:** Use the `setApi` prop pattern from shadcn Carousel to get stable API reference. Only subscribe to events once via useEffect with api dependency.

### Pitfall 3: Multiple useCollectionBooks Queries
**What goes wrong:** If there are N featured collections, rendering N CollectionSection components triggers N separate Supabase queries.
**Why it happens:** Each CollectionSection independently calls useCollectionBooks.
**How to avoid:** This is acceptable for small N (typical: 3-5 collections). TanStack React Query caches results. If N grows large, could batch into a single query, but premature optimization for now.

### Pitfall 4: MiniAudioPlayer Overlap
**What goes wrong:** New homepage sections or carousel content gets hidden behind the fixed bottom mini audio player.
**Why it happens:** The mini player is fixed at the bottom with z-50.
**How to avoid:** The page already has `pb-28` on the container (BookPage line 165, Index.tsx line 70 has `pb-6`). Ensure Index.tsx has enough bottom padding. BookPage is fine with pb-28.

### Pitfall 5: Key Ideas Section Placement
**What goes wrong:** Key ideas carousel placed in wrong position on BookPage.
**Why it happens:** CONTEXT.md says "below book description, above action buttons" but current code has key ideas AFTER "Why read" and "About author" sections.
**How to avoid:** Key ideas section is currently at line 273 of BookPage.tsx, after about_author. The decision says "below book description" -- the current position is arguably below description content. Verify with context that current position is acceptable or move it.

## Code Examples

### Current Key Ideas Implementation (BookPage.tsx lines 272-302)
The existing implementation uses manual CSS scroll-snap:
```typescript
// CURRENT (to be replaced):
<div ref={ideaScrollRef} onScroll={handleIdeaScroll}
  className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-5 px-5">
  {keyIdeas.map((idea) => (
    <div key={idea.id} className="w-full shrink-0 snap-center">
      <p className="text-sm font-semibold text-foreground mb-1">{idea.title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{idea.content}</p>
    </div>
  ))}
</div>
```
Note: This doesn't even use KeyIdeaCard component. The refactor should use the Carousel + KeyIdeaCard.

### Current Admin Reorder Implementation (AdminBookForm.tsx lines 144-148, 517-529)
Already complete with ChevronUp/ChevronDown buttons:
```typescript
const moveIdea = (from: number, to: number) => {
  const updated = [...keyIdeas];
  [updated[from], updated[to]] = [updated[to], updated[from]];
  setKeyIdeas(updated);
};
// Buttons with disabled state at boundaries
<button disabled={i === 0} onClick={() => moveIdea(i, i - 1)}>
  <ChevronUp className="h-3.5 w-3.5" />
</button>
```

### Current Stats Implementation (ProfilePage.tsx lines 166-178)
Already complete 3-column grid:
```typescript
<div className="grid grid-cols-3 gap-3">
  {[
    { value: String(stats?.readCount ?? 0), label: "Прочитано", icon: BookOpen },
    { value: `${stats?.totalHours ?? 0} ч`, label: "Время", icon: Clock },
    { value: String(stats?.streak ?? 0), label: "Серия дней", icon: Flame },
  ].map(({ value, label, icon: Icon }) => (
    <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-4 shadow-card">
      <Icon className="h-4 w-4 text-sage" />
      <span className="text-xl font-extrabold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  ))}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual scroll-snap + onScroll | Embla Carousel via shadcn | Already available | Better touch handling, API for slide tracking |
| Inline key idea divs in BookPage | Should use KeyIdeaCard component | This phase | Consistent styling, reusable |
| BannerCarousel for collections | Per-collection book rows | This phase | Matches COLL-02 requirement |

## Gap Analysis

### What Already Works (Verify Only)
| Feature | Requirement | Status | Files |
|---------|-------------|--------|-------|
| Continue Reading section | CONT-03 | Complete | Index.tsx, ContinueCard.tsx, useUserData.ts |
| Reading Stats display | CONT-04 | Complete | ProfilePage.tsx, useProfileStats.ts |
| Admin key idea inputs | CONT-02 (partial) | Complete | AdminBookForm.tsx |
| Admin key idea reorder | CONT-02 (partial) | Complete | AdminBookForm.tsx moveIdea() |
| Admin collections CRUD | COLL-01 | Complete | AdminCollections.tsx |

### What Needs Change
| Feature | Requirement | Current State | Needed Change |
|---------|-------------|---------------|---------------|
| Key ideas carousel | CONT-01 | Manual scroll-snap with plain divs | Replace with shadcn Carousel + KeyIdeaCard |
| KeyIdeaCard width | CONT-01 | Fixed w-[280px] | Change to w-full or remove width |
| Homepage collections | COLL-02 | BannerCarousel promo cards | SectionHeader + horizontal BookCard rows |
| Key ideas dot sync | CONT-01 | handleIdeaScroll with manual math | Use Embla API selectedScrollSnap() |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + jsdom |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Key ideas render in carousel with dot indicators | unit (component) | `npx vitest run src/test/key-ideas-carousel.test.tsx -x` | No -- Wave 0 |
| CONT-02 | Admin can reorder key ideas with up/down buttons | unit (component) | `npx vitest run src/test/admin-key-ideas.test.tsx -x` | No -- Wave 0 |
| CONT-03 | Continue reading shows unfinished books with progress | manual-only | N/A -- data-dependent, requires auth state | N/A |
| CONT-04 | Profile stats display books read, time, streaks | manual-only | N/A -- requires Supabase auth + data | N/A |
| COLL-01 | Admin can create/edit/delete collections | manual-only | N/A -- full page interaction with Supabase | N/A |
| COLL-02 | Collections render as horizontal book rows on homepage | unit (component) | `npx vitest run src/test/collection-sections.test.tsx -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/test/key-ideas-carousel.test.tsx` -- covers CONT-01 (carousel renders, dot indicators sync)
- [ ] `src/test/admin-key-ideas.test.tsx` -- covers CONT-02 (reorder logic)
- [ ] `src/test/collection-sections.test.tsx` -- covers COLL-02 (renders per-collection rows)

Note: CONT-03, CONT-04, COLL-01 are manual-only because they require authenticated Supabase sessions and real data. The existing implementations are already working and just need visual verification.

## Open Questions

1. **Key Ideas Section Placement on BookPage**
   - What we know: CONTEXT.md says "below book description, above action buttons." Current code places key ideas after "Why Read" and "About Author" sections (line 273).
   - What's unclear: Whether "below book description" means immediately after the description paragraph or after all book info sections.
   - Recommendation: Keep current placement (after about_author, before related books). This is the natural content flow and the user likely meant "in the book detail area" rather than strictly after the description paragraph. The "above action buttons" constraint is met since the sticky bottom bar with Read/Listen is always below.

2. **BannerCarousel Removal vs Retention**
   - What we know: COLL-02 requires horizontal book rows, not banner cards. Current BannerCarousel serves as collection display.
   - What's unclear: Whether to keep BannerCarousel component for future GROW-03 (promotional banners) or remove it entirely.
   - Recommendation: Replace BannerCarousel usage for collections with book rows, but keep the component code since GROW-03 (Phase 7) needs "promotional banners carousel" and BannerCarousel is already built for that purpose.

## Sources

### Primary (HIGH confidence)
- Codebase inspection of all referenced files (BookPage.tsx, Index.tsx, ProfilePage.tsx, AdminBookForm.tsx, AdminCollections.tsx, carousel.tsx, KeyIdeaCard.tsx, ContinueCard.tsx, SectionHeader.tsx, useBooks.ts, useProfileStats.ts, useUserData.ts)
- package.json for verified dependency versions
- vitest.config.ts for test infrastructure

### Secondary (MEDIUM confidence)
- shadcn/ui Carousel component pattern (Embla API usage for selectedScrollSnap)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified in package.json
- Architecture: HIGH - all patterns derived from existing codebase inspection
- Pitfalls: HIGH - identified from actual code analysis of current implementations
- Gap analysis: HIGH - line-by-line comparison of existing code vs requirements

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no external API changes expected)
