# Phase 4: Content & Collections - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users discover content through key ideas on the book page, a personalized "Continue reading" homepage section, reading stats in profile, and admin-managed curated collections on the homepage. This phase polishes and completes existing features — most components, hooks, and admin pages already exist and need gap-filling and UX improvements.

</domain>

<decisions>
## Implementation Decisions

### Key Ideas Carousel (CONT-01)
- Full-width snap-scroll carousel using shadcn Carousel component (Embla-based)
- One card visible at a time (full-width), not peek-next layout
- Dot indicators below the carousel for navigation
- Placement: below book description, above action buttons (Read/Listen)
- Empty state: hide the section entirely if no key ideas exist for the book
- Existing `KeyIdeaCard.tsx` needs width update from fixed 280px to full-width responsive

### Admin Key Ideas (CONT-02)
- Up/down arrow buttons for reordering (ChevronUp/ChevronDown already imported in AdminBookForm)
- No drag-and-drop library needed — simple button-based reorder
- No hard limit on card count — admin can add as many as needed
- Existing AdminBookForm already has title+content inputs for key ideas — add reorder buttons

### Continue Reading (CONT-03)
- Already implemented in Index.tsx with ContinueCard component
- Verify: section shows user's unfinished summaries with progress percentage
- Uses useUserProgress hook to filter books with 0 < progress < 100%

### Reading Stats (CONT-04)
- Three stat cards in a horizontal row on ProfilePage
- Stats: 📚 Books read | ⏰ Total reading time | 🔥 Reading streak
- Show zeros for new users (always visible, motivates reading)
- useProfileStats hook already computes readCount, totalHours, streak
- Current ProfilePage already displays stats — verify layout matches three-card design

### Collections Admin (COLL-01)
- AdminCollections.tsx already has full CRUD for collections
- Collections have title, description, is_featured flag, display_order
- Verify: admin can manage book assignments via collection_books junction table

### Collections Homepage (COLL-02)
- Title-only section headers (no cover images, no description on homepage)
- Horizontal scrollable book rows below each collection title
- Show all featured collections (admin controls via is_featured flag)
- Already rendered in Index.tsx via useCollections + useCollectionBooks
- Verify existing implementation meets requirements

### Claude's Discretion
- Carousel animation/transition details (Embla defaults likely fine)
- Exact card styling updates for full-width key ideas
- Stats card visual design (icons, colors, spacing)
- Any minor layout adjustments needed for existing components

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Key Ideas
- `src/components/KeyIdeaCard.tsx` — Existing key idea card component (needs width update for carousel)
- `src/hooks/useBooks.ts` — `useKeyIdeas` hook fetches from key_ideas table by display_order
- `src/pages/BookPage.tsx` — Book detail page, already fetches keyIdeas with activeIdeaIdx state and ideaScrollRef

### Continue Reading
- `src/components/ContinueCard.tsx` — Continue reading card with cover, progress bar
- `src/pages/Index.tsx` — Homepage, already renders continue reading section with useUserProgress
- `src/hooks/useUserData.ts` — useUserProgress hook for reading progress data

### Reading Stats
- `src/hooks/useProfileStats.ts` — Already computes readCount, totalHours, streak from Supabase
- `src/pages/ProfilePage.tsx` — Profile page, already uses useProfileStats

### Collections
- `src/pages/AdminCollections.tsx` — Full admin CRUD for collections with book assignment
- `src/hooks/useBooks.ts` — `useCollections` hook fetches featured collections
- `src/pages/Index.tsx` — Homepage renders collection sections with useCollectionBooks

### Admin
- `src/pages/AdminBookForm.tsx` — Book creation/edit form with key idea inputs (title + content)

### UI Components
- `src/components/ui/carousel.tsx` — shadcn Carousel component (Embla-based) for swipeable carousel

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KeyIdeaCard`: Gradient card with index badge, title, content — needs width change from 280px fixed to responsive
- `ContinueCard`: Card with cover image, progress bar, "Читаю" label — ready to use
- `SectionHeader`: Section title component used on homepage — reuse for collection headers
- `BookCard`: Standard book card used in horizontal scrolls — already used for collections
- `shadcn Carousel`: Embla-based carousel with CarouselContent, CarouselItem, CarouselPrevious, CarouselNext

### Established Patterns
- React Query for all data fetching (useQuery/useMutation with Supabase client)
- Context API for global state (AuthContext, AudioContext)
- Tailwind utility classes with cn() helper for conditional styling
- Toast notifications via Sonner for user feedback
- Horizontal scroll with `overflow-x-auto scrollbar-hide` class pattern

### Integration Points
- `BookPage.tsx`: Already has keyIdeas fetch and activeIdeaIdx state — replace manual scroll with Carousel
- `Index.tsx`: Continue reading section and collections already rendered — verify completeness
- `ProfilePage.tsx`: Stats already displayed — verify three-card layout
- `AdminBookForm.tsx`: Key idea inputs exist — add reorder buttons
- `MiniAudioPlayer` (global): Ensure new homepage sections don't overlap with fixed bottom player

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

*Phase: 04-content-collections*
*Context gathered: 2026-03-19*
