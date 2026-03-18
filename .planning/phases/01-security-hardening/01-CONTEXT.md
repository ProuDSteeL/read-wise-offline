# Phase 1: Security Hardening - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock down RLS policies so users can't self-promote to Pro, add server-side content gating for summaries, and implement signed audio URLs. This phase builds the security foundation that all access-controlled features depend on (offline downloads in Phase 6, future payments in v2).

</domain>

<decisions>
## Implementation Decisions

### RLS Policy Protection
- Column-level database trigger on `profiles` table
- Trigger silently resets `subscription_type`, `subscription_expires_at`, and `role` fields to OLD values when modified by non-service_role
- UPDATE succeeds but protected fields remain unchanged — non-disruptive to legitimate profile updates (name, avatar, etc.)
- Only service_role (Edge Functions, admin operations) can modify these fields

### Content Gating Model
- Server-side truncation: Edge Function returns only first 20-30% of summary text for non-Pro users
- Full text never reaches the client for gated content
- Paywall UX: gradient fade effect at truncation point with centered subscribe CTA button below
- Free users who haven't exhausted their limit still see full content (gating kicks in after limit or for audio-only content)

### Audio URL Strategy
- Claude's Discretion: signed URLs via Edge Function or Supabase Storage signed URL feature — Claude picks best approach
- Signed URLs valid for 24 hours — allows pause/resume without re-requesting
- Pro-only access: Edge Function checks subscription before generating signed URL
- Free users cannot access audio at all (existing `canListenAudio = isPro` logic stays)

### Free Tier Limits
- Increase free reads from 5 to 10 full summaries
- After 10 reads exhausted: new summaries show truncated text with gradient fade paywall (same as non-read gated content)
- Show counter: "3 of 10 free reads used" visible in profile and/or reader
- Highlights: unlimited for all users (remove current 10-highlight limit)
- Audio: Pro-only (no change)
- Downloads: Pro-only (no change)

### Claude's Discretion
- Exact Edge Function implementation pattern (reuse existing generate-vapid-keys/send-notifications patterns)
- Summary truncation algorithm (word boundary, paragraph boundary, etc.)
- Audio URL signing mechanism (Supabase Storage built-in vs custom)
- Counter display placement and design
- Error handling for expired signed URLs

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `supabase/migrations/20260314171856_f287bfe4-000f-43ee-9b8e-5d09fc995d4f.sql` — Profiles table schema, current RLS policies (blanket UPDATE), subscription_type enum, trigger patterns
- `supabase/migrations/20260314183207_6f2fb0cc-c086-47df-b1d0-39cbba3783a7.sql` — Additional RLS policies
- `supabase/migrations/20260315000000_add_highlight_update_policy.sql` — Example of adding targeted RLS policies

### Access Control
- `src/hooks/useAccessControl.ts` — Current client-side access gating (FREE_READS_LIMIT, canReadFull, canListenAudio, canDownload, canHighlight)
- `src/hooks/useSubscription.ts` — Current subscription status check from profiles table

### Existing Edge Functions
- `supabase/functions/generate-vapid-keys/` — Example Edge Function pattern for this project
- `supabase/functions/send-notifications/` — Another Edge Function example with auth handling

### Audio Access
- `src/pages/AdminBookForm.tsx` — Current audio upload using getPublicUrl (public URLs, no signing)
- `src/contexts/AudioContext.tsx` — Audio playback context, needs to consume signed URLs

### Research
- `.planning/research/PITFALLS.md` — Security pitfalls identified (RLS vulnerability, client-side-only gating)
- `.planning/research/ARCHITECTURE.md` — Recommended architecture for payments/gating integration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAccessControl` hook: Already implements gating logic (canReadFull, canListenAudio, canDownload) — needs update to consume server-side gating responses instead of client-only checks
- `useSubscription` hook: Reads subscription from profiles — can stay as-is for UI state, but server must be source of truth for content access
- Edge Functions infrastructure: `generate-vapid-keys` and `send-notifications` establish the pattern for new functions
- `supabase/migrations/` directory: Migration pattern established, new migrations follow same convention

### Established Patterns
- React Query for data fetching: All hooks use `useQuery`/`useMutation` with Supabase client
- Auth context: `useAuth()` provides current user throughout the app
- Toast notifications: Sonner used for user-facing messages
- Supabase client initialized in `src/integrations/supabase/client.ts`

### Integration Points
- `ReaderPage.tsx`: Currently fetches full summary content directly from Supabase — needs to route through gating Edge Function
- `AudioContext.tsx`: Currently plays from public URLs — needs to request signed URLs before playback
- `BookPage.tsx`: Audio play button triggers AudioContext — needs to check access and get signed URL first
- `ProfilePage.tsx`: Should display free reads counter

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for implementation.

</specifics>

<deferred>
## Deferred Ideas

- YooMoney/YooKassa payment integration — v2 feature, will use the subscription infrastructure built in this phase
- Subscription management page — v2, depends on payment integration
- Offline content expiry after subscription cancellation — Phase 6 (Offline Hardening)

</deferred>

---

*Phase: 01-security-hardening*
*Context gathered: 2026-03-18*
