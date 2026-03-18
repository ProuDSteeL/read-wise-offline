import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_READS_LIMIT = 10;

/**
 * Truncate summary content to approximately targetPercent at paragraph boundaries.
 * Duplicated from src/lib/truncateSummary.ts for Deno Edge Function runtime.
 */
function truncateSummary(content: string, targetPercent: number = 0.25): string {
  if (!content) return "";
  const paragraphs = content.split(/\n\n+/);
  if (paragraphs.length <= 1) return content;

  const totalLength = content.length;
  const targetLength = totalLength * targetPercent;

  let accumulated = 0;
  const kept: string[] = [];

  for (const p of paragraphs) {
    kept.push(p);
    accumulated += p.length + 2;
    if (accumulated >= targetLength) break;
  }

  return kept.join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user via Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const bookId = body.bookId;
    if (!bookId) {
      return new Response(
        JSON.stringify({ error: "bookId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for data queries (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch summary
    const { data: summary, error: summaryError } = await adminClient
      .from("summaries")
      .select("*")
      .eq("book_id", bookId)
      .maybeSingle();

    if (summaryError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch summary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!summary) {
      return new Response(
        JSON.stringify({ error: "Summary not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user profile for subscription info
    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_type, subscription_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    // Determine if user is Pro
    const subscriptionType = profile?.subscription_type;
    const expiresAt = profile?.subscription_expires_at;
    const isPro =
      (subscriptionType === "pro_monthly" || subscriptionType === "pro_yearly") &&
      (!expiresAt || new Date(expiresAt) > new Date());

    if (isPro) {
      return new Response(
        JSON.stringify({ ...summary, truncated: false, freeReadsUsed: 0, freeReadsLimit: FREE_READS_LIMIT }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count user_progress rows for this user
    const { data: progressRows, error: progressError } = await adminClient
      .from("user_progress")
      .select("book_id")
      .eq("user_id", user.id);

    if (progressError) {
      return new Response(
        JSON.stringify({ error: "Failed to check user progress" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const freeReadsUsed = progressRows?.length ?? 0;
    const hasExistingProgress = progressRows?.some((row) => row.book_id === bookId) ?? false;

    // User within free reads limit OR already has progress on this book
    if (freeReadsUsed < FREE_READS_LIMIT || hasExistingProgress) {
      return new Response(
        JSON.stringify({ ...summary, truncated: false, freeReadsUsed, freeReadsLimit: FREE_READS_LIMIT }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Non-Pro, exceeded free reads, no existing progress on this book: truncate
    return new Response(
      JSON.stringify({
        ...summary,
        content: truncateSummary(summary.content),
        truncated: true,
        freeReadsUsed,
        freeReadsLimit: FREE_READS_LIMIT,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
