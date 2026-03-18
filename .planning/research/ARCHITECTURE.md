# Architecture Patterns

**Domain:** Book summaries PWA with payments, freemium access, offline storage, audio player
**Researched:** 2026-03-18
**Focus:** Integration of YooKassa payments, subscription access control, enhanced offline, and audio features into existing React + Supabase architecture

## Current Architecture Snapshot

The app is a client-side SPA with:
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State:** React Query (server), Context API (auth, audio), localforage/IndexedDB (offline)
- **Offline:** Service Worker (Workbox/vite-plugin-pwa) + localforage stores (audio, text, meta)

Key existing abstractions: `useSubscription()` reads `profiles.subscription_type` + `subscription_expires_at`, `useAccessControl()` gates features (read/listen/download/highlight) based on `isPro` status. No payment tables or webhook handling exist yet.

## Recommended Architecture

### High-Level Component Map

```
                          +------------------+
                          |   YooKassa API   |
                          +--------+---------+
                                   |
                          webhook (HTTPS POST)
                                   |
                          +--------v---------+
                          | Supabase Edge    |
                          | Function:        |
                          | yookassa-webhook |
                          +--------+---------+
                                   |
                        writes to DB tables:
                        payments, subscriptions
                                   |
              +--------------------+--------------------+
              |                                         |
    +---------v----------+                   +----------v---------+
    | profiles table     |                   | payments table     |
    | (subscription_type,|                   | (amount, status,   |
    |  expires_at)       |                   |  yookassa_id)      |
    +--------------------+                   +--------------------+
              |
    React Query invalidation
    on subscription change
              |
    +---------v----------+
    | useSubscription()  |
    | useAccessControl() |
    +--------------------+
              |
    gates UI features:
    read, listen, download, highlight
```

### Component Boundaries

| Component | Responsibility | Communicates With | Location |
|-----------|---------------|-------------------|----------|
| **YooKassa Webhook Edge Function** | Validate webhook signature, process payment events, update subscription state in DB | YooKassa API (inbound), Supabase DB (writes) | `supabase/functions/yookassa-webhook/` |
| **Payment Initiation Edge Function** | Create YooKassa payment, return confirmation URL | React client (called via fetch), YooKassa API (outbound) | `supabase/functions/create-payment/` |
| **payments table** | Store payment history, idempotency keys, YooKassa payment IDs | Written by webhook function, read by admin/profile | Supabase PostgreSQL |
| **subscriptions table (or profiles extension)** | Track active subscription status, type, expiry, auto-renewal flag | Written by webhook function, read by `useSubscription()` | Supabase PostgreSQL |
| **useSubscription hook** | Query subscription state, derive `isPro` | profiles table, React Query cache | `src/hooks/useSubscription.ts` (existing, extend) |
| **useAccessControl hook** | Gate features based on subscription tier | useSubscription, user_progress table | `src/hooks/useAccessControl.ts` (existing, stable) |
| **PaymentContext or usePayment hook** | Initiate payment flow, handle redirect back, show payment status | create-payment Edge Function, React Router | `src/hooks/usePayment.ts` (new) |
| **SubscriptionPage** | Show current plan, upgrade/downgrade, payment history | useSubscription, usePayment | `src/pages/SubscriptionPage.tsx` (new) |
| **Offline Storage Layer** | Store books (text + audio blobs) in IndexedDB | localforage stores, Service Worker cache | `src/lib/offlineStorage.ts` (existing, extend) |
| **AudioContext** | Manage audio playback state, sleep timer, background play | HTMLAudioElement, user_progress table, offlineStorage | `src/contexts/AudioContext.tsx` (existing, extend) |

## Data Flow

### Payment Flow (YooKassa)

```
User clicks "Subscribe"
  |
  v
[React Client] --POST--> [create-payment Edge Function]
  |                              |
  |                     Creates payment via YooKassa API
  |                     Returns confirmation_url
  |
  v
[Redirect to YooKassa payment page]
  |
  v
[User completes payment on YooKassa]
  |
  v
[YooKassa sends webhook] --POST--> [yookassa-webhook Edge Function]
                                          |
                                   1. Verify IP whitelist + idempotency key
                                   2. Parse event (payment.succeeded / refund.succeeded)
                                   3. INSERT into payments table
                                   4. UPDATE profiles: subscription_type, subscription_expires_at
                                   5. Return 200 OK
  |
  v
[User redirected back to app] --> [SubscriptionPage]
  |
  v
[useSubscription() re-fetches] --> sees updated subscription_type
  |
  v
[useAccessControl()] --> isPro = true --> all features unlocked
```

**Critical design decision:** The webhook Edge Function is the single source of truth for subscription activation. The client never writes subscription state directly. This prevents payment bypass.

### Subscription Access Control Flow

```
Any protected action (read full book, listen, download)
  |
  v
useAccessControl() checks:
  1. isPro? --> allow everything
  2. Not Pro + canReadFull? --> check freeReadsUsed < 5
  3. Not Pro + canListenAudio? --> false (Pro only)
  4. Not Pro + canDownload? --> false (Pro only)
  |
  v
If denied --> show PaywallDialog with pricing + CTA
  |
  v
User clicks Subscribe --> usePayment().initiate() --> redirect to YooKassa
```

**Existing pattern is solid.** The `useAccessControl` hook already has the right gates. The only addition needed is a `PaywallDialog` component that triggers when access is denied, and linking it to the payment initiation flow.

### Enhanced Offline Storage Flow

```
User clicks "Download" on BookPage (Pro only)
  |
  v
useAccessControl().canDownload --> true
  |
  v
DownloadDialog: choose text / audio / both
  |
  v
useDownloads().download():
  1. Fetch text content from Supabase (summaries table)
  2. Fetch audio blob from Supabase Storage
  3. Store in IndexedDB via localforage (existing stores)
  4. Save metadata (OfflineBookMeta) with sizes
  5. Record in user_downloads table (server-side tracking)
  |
  v
DownloadsPage shows all offline books
  |
  v
Offline mode (no internet):
  - App routes redirect to /downloads
  - User reads from IndexedDB text store
  - User listens from IndexedDB audio blob (createObjectURL)
  - Progress saved to localStorage (offline-audio-pos-{bookId})
  |
  v
Back online:
  - syncOfflineProgress() upserts positions to user_progress
```

**The existing offline architecture is well-designed.** Key enhancements needed:
1. Storage quota management UI (show used/available, allow clearing)
2. Download queue for multiple books
3. Cover image caching in IndexedDB (currently not stored offline)
4. Key ideas stored alongside text for offline access

### Audio Player Enhancement Flow

```
AudioContext (extended):
  |
  +-- Sleep timer: setTimeout that calls stop() after N minutes
  |     Stored in AudioContext state, UI in AudioPlayerPage
  |
  +-- Background playback: Media Session API integration
  |     navigator.mediaSession.metadata = { title, artist, artwork }
  |     navigator.mediaSession.setActionHandler('play', ...)
  |     Enables lock screen controls on mobile
  |
  +-- Offline audio: check offlineStorage first, fall back to URL
        play() method:
          1. getAudioOffline(bookId) --> blob URL if available
          2. If null, use audioUrl from Supabase Storage
          3. Set audioRef.current.src = chosen URL
```

## Patterns to Follow

### Pattern 1: Edge Functions for Server-Side Logic

**What:** All payment and subscription mutation logic runs in Supabase Edge Functions (Deno), never on the client.

**When:** Any operation that requires secrets (YooKassa shop_id, secret_key), writes financial data, or modifies subscription status.

**Why:** The client has only the Supabase anon key. Payment secrets must stay server-side. Edge Functions have access to service_role key for privileged writes.

**Example:**
```typescript
// supabase/functions/yookassa-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Verify request comes from YooKassa (IP whitelist or signature)
  const body = await req.json();
  const event = body.event; // "payment.succeeded", "payment.canceled", "refund.succeeded"
  const payment = body.object;

  // 2. Idempotency: check if payment.id already processed
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role for privileged writes
  );

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("yookassa_payment_id", payment.id)
    .maybeSingle();

  if (existing) return new Response("OK", { status: 200 }); // Already processed

  // 3. Record payment and update subscription
  if (event === "payment.succeeded") {
    const userId = payment.metadata.user_id;
    const plan = payment.metadata.plan; // "pro_monthly" | "pro_yearly"

    await supabase.from("payments").insert({
      user_id: userId,
      yookassa_payment_id: payment.id,
      amount: payment.amount.value,
      currency: payment.amount.currency,
      status: "succeeded",
      plan,
    });

    const expiresAt = plan === "pro_yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await supabase
      .from("profiles")
      .update({
        subscription_type: plan,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId);
  }

  return new Response("OK", { status: 200 });
});
```

### Pattern 2: Client-Side Access Control via Hooks

**What:** All feature gating happens through the existing `useAccessControl()` hook. No new permission system needed.

**When:** Any component needs to check if user can access a feature.

**Why:** Centralized, already tested, React Query-cached. Adding new gates is trivial.

**Example:**
```typescript
// In BookPage.tsx - showing paywall when user can't listen
const { canListenAudio, isPro } = useAccessControl();

const handleListenClick = () => {
  if (canListenAudio) {
    navigate(`/book/${id}/listen`);
  } else {
    setShowPaywall(true); // Show PaywallDialog
  }
};
```

### Pattern 3: Optimistic UI with Server Verification

**What:** After payment redirect back to app, show "processing" state and poll subscription status.

**When:** User returns from YooKassa payment page.

**Why:** Webhook may arrive before or after redirect. Polling with React Query ensures UI updates as soon as subscription is active.

**Example:**
```typescript
// After redirect back from YooKassa
const { isPro, isLoading } = useSubscription();

// React Query will refetch on window focus
// Add explicit refetch with interval while payment is pending
const { refetch } = useQuery({
  queryKey: ["subscription", user?.id],
  refetchInterval: isPro ? false : 3000, // Poll every 3s until active
});
```

### Pattern 4: Media Session API for Background Audio

**What:** Register with Media Session API so OS shows playback controls on lock screen / notification shade.

**When:** Audio is playing in the PWA.

**Why:** Without this, audio pauses when user locks phone or switches apps. Media Session keeps playback alive and provides native-feeling controls.

**Example:**
```typescript
// In AudioContext, when play() is called:
if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: bookTitle,
    artist: "ReadWise",
    artwork: [{ src: coverUrl, sizes: "512x512", type: "image/png" }],
  });
  navigator.mediaSession.setActionHandler("play", () => togglePlay());
  navigator.mediaSession.setActionHandler("pause", () => togglePlay());
  navigator.mediaSession.setActionHandler("seekforward", () => skip(15));
  navigator.mediaSession.setActionHandler("seekbackward", () => skip(-15));
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Subscription Activation

**What:** Setting `subscription_type = 'pro'` from the React client after payment redirect.

**Why bad:** Any user can open DevTools and call `supabase.from('profiles').update(...)` with the anon key. RLS policies on profiles typically allow users to update their own row. If subscription_type is writable by the user, the entire paywall is bypassable.

**Instead:** Only the webhook Edge Function (using service_role key) writes subscription status. Add RLS policy: `subscription_type` and `subscription_expires_at` columns are NOT updatable by the user role. Use a separate `subscriptions` table with RLS that denies all client writes, or add column-level security via a trigger that rejects user-initiated changes to these fields.

### Anti-Pattern 2: Storing Payment Secrets in Environment Variables Accessible to Client

**What:** Putting YooKassa `secret_key` in `VITE_` prefixed env vars.

**Why bad:** Vite exposes all `VITE_` prefixed variables to the client bundle. Payment secrets would be visible in the browser.

**Instead:** Store secrets in Supabase Edge Function secrets (`supabase secrets set YOOKASSA_SECRET_KEY=xxx`). Access via `Deno.env.get("YOOKASSA_SECRET_KEY")` in Edge Functions only.

### Anti-Pattern 3: Blocking Offline Mode on Subscription Check

**What:** Checking `useSubscription()` (which requires network) before allowing offline reading.

**Why bad:** When offline, Supabase queries fail. User who paid and downloaded content should still access it.

**Instead:** Cache subscription status in localStorage/IndexedDB alongside downloaded content. On download, record `isPro: true` in OfflineBookMeta. Offline reader trusts local cache. Online mode re-verifies. If subscription expired, prevent new downloads but allow reading already-downloaded content until next online check.

### Anti-Pattern 4: Single Large IndexedDB Transaction for Audio

**What:** Downloading a 50MB+ audio file and storing it in one IndexedDB write.

**Why bad:** Can trigger quota prompts, memory pressure on low-end devices, and leave user with nothing if interrupted.

**Instead:** The existing chunked download in `saveAudioOffline()` is good. Ensure progress is recoverable: if download interrupts, allow resume by storing partial blob and byte offset. Consider splitting very large files into 5MB chunks keyed as `{bookId}_chunk_{n}`.

## New Database Schema Additions

### payments table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  yookassa_payment_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  status TEXT NOT NULL, -- 'pending', 'succeeded', 'canceled', 'refunded'
  plan TEXT NOT NULL,   -- 'pro_monthly', 'pro_yearly'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can read own payments, no client writes
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policies = only service_role can write
```

### profiles table modifications

The existing `profiles` table already has `subscription_type` and `subscription_expires_at`. Add RLS to prevent client-side modification of these columns:

```sql
-- Add trigger to prevent client updates to subscription columns
CREATE OR REPLACE FUNCTION prevent_subscription_self_update()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
    -- If user is updating their own profile, preserve subscription fields
    IF NEW.user_id = auth.uid() THEN
      NEW.subscription_type := OLD.subscription_type;
      NEW.subscription_expires_at := OLD.subscription_expires_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_subscription_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_subscription_self_update();
```

## Component Integration Points

### Where New Components Touch Existing Code

| Existing Component | New Integration | Change Type |
|-------------------|-----------------|-------------|
| `App.tsx` routes | Add `/subscription`, `/payment/success`, `/payment/cancel` routes | Add routes |
| `useSubscription.ts` | Add `refetchInterval` when payment pending; cache in localStorage for offline | Extend |
| `useAccessControl.ts` | Add `showPaywall` state trigger; no logic changes needed | Minimal |
| `ProfilePage.tsx` | Add subscription status card, link to SubscriptionPage | Add section |
| `AudioContext.tsx` | Add sleep timer state + Media Session API registration | Extend |
| `offlineStorage.ts` | Add cover image store, key ideas store, subscription status cache | Extend |
| `BookPage.tsx` | Add PaywallDialog trigger on restricted actions | Add dialog |

### New Components to Build

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| `supabase/functions/create-payment/` | Create YooKassa payment, return redirect URL | YooKassa API, Supabase service_role |
| `supabase/functions/yookassa-webhook/` | Process payment webhooks, update subscription | YooKassa secrets, Supabase service_role |
| `src/hooks/usePayment.ts` | Initiate payment flow from client | create-payment Edge Function |
| `src/pages/SubscriptionPage.tsx` | Show plans, pricing, payment history | useSubscription, usePayment |
| `src/components/PaywallDialog.tsx` | Modal shown when free user hits limit | useAccessControl, usePayment |
| `src/components/SleepTimerDialog.tsx` | Sleep timer UI in audio player | AudioContext |

## Suggested Build Order

The build order is driven by dependencies between components:

```
Phase 1: Database + Edge Functions (no UI dependency)
  1a. Create payments table + RLS policies
  1b. Add subscription protection trigger on profiles
  1c. Build create-payment Edge Function
  1d. Build yookassa-webhook Edge Function
  1e. Test with YooKassa test mode

Phase 2: Payment UI (depends on Phase 1)
  2a. Build usePayment hook (calls create-payment function)
  2b. Build SubscriptionPage (plan selection, pricing)
  2c. Build PaywallDialog (triggered by useAccessControl denials)
  2d. Add payment success/cancel redirect pages
  2e. Integrate paywall triggers into BookPage, ReaderPage, AudioPlayerPage

Phase 3: Enhanced Audio (independent of payments)
  3a. Add sleep timer to AudioContext + SleepTimerDialog
  3b. Add Media Session API for background playback
  3c. Add offline audio source selection (IndexedDB first, URL fallback)

Phase 4: Enhanced Offline (partially depends on Phase 2 for access control)
  4a. Cache subscription status locally for offline access decisions
  4b. Add cover image + key ideas to offline stores
  4c. Build download queue (multiple book downloads)
  4d. Add storage management UI (used/available/clear)
  4e. Resumable downloads for large audio files
```

**Phase ordering rationale:**
- Database schema and Edge Functions come first because all payment UI depends on them, and they can be tested independently via curl/Postman.
- Payment UI comes second because the paywall dialog is needed before any monetization works.
- Audio enhancements are independent of payments and can run in parallel with Phase 2.
- Offline enhancements come last because they depend on the subscription caching pattern from Phase 2, and are the most complex to test properly.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Webhook processing | Single Edge Function, no queue needed | Same, YooKassa sends sequentially per shop | Add webhook event queue (pg_cron or external) |
| Subscription checks | React Query cache, 1 query per session | Same, stale-while-revalidate | Add Redis/edge cache layer |
| Offline storage | 500MB limit per device is fine | Same | Same (client-side concern) |
| Audio streaming | Direct Supabase Storage URLs | Add CDN (Cloudflare R2 or similar) | Dedicated media CDN |
| Payment history | Direct DB queries | Index on user_id + created_at | Pagination, archival |

## Security Considerations

1. **Webhook verification:** YooKassa webhooks should be verified by checking the source IP against YooKassa's IP whitelist (185.71.76.0/27, 185.71.77.0/27, 77.75.153.0/25, 77.75.156.11, 77.75.156.35, 77.75.154.128/25, 2a02:5180::/32). Alternative: use the notification_url secret token approach.

2. **Idempotency:** Always check `yookassa_payment_id` uniqueness before processing. YooKassa may retry webhooks up to 10 times.

3. **RLS enforcement:** The `payments` table must have NO client-side INSERT/UPDATE policies. Only service_role can write.

4. **Subscription field protection:** The trigger on `profiles` prevents users from self-upgrading via DevTools.

5. **Offline access after expiry:** Downloaded content remains accessible offline even after subscription expires. This is acceptable -- the user paid for it when they downloaded. New downloads are blocked on next online check when `isPro` returns false.

## Sources

- Existing codebase analysis (HIGH confidence): `src/hooks/useSubscription.ts`, `src/hooks/useAccessControl.ts`, `src/lib/offlineStorage.ts`, `src/contexts/AudioContext.tsx`, `src/integrations/supabase/types.ts`
- YooKassa API documentation (MEDIUM confidence, based on training data -- verify webhook IP ranges and API endpoints against current docs at https://yookassa.ru/developers/api)
- Media Session API (HIGH confidence, W3C standard): `navigator.mediaSession` for background audio controls
- Supabase Edge Functions patterns (HIGH confidence): Deno-based, `Deno.env.get()` for secrets, service_role key for privileged writes

---

*Architecture research: 2026-03-18*
