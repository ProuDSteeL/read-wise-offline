import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // TODO: restore auth + Pro checks after testing
    // For now, skip auth to allow testing without subscription

    // Parse request body
    const { bookId } = await req.json();
    if (!bookId) {
      return new Response(
        JSON.stringify({ error: "bookId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch audio_url path from summaries
    const { data: summary, error: summaryError } = await adminClient
      .from("summaries")
      .select("audio_url")
      .eq("book_id", bookId)
      .single();

    if (summaryError || !summary) {
      return new Response(
        JSON.stringify({ error: "Summary not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioPath = summary.audio_url;
    if (!audioPath) {
      return new Response(
        JSON.stringify({ error: "No audio available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL (24 hours = 86400 seconds)
    const { data, error: signError } = await adminClient.storage
      .from("audio-files")
      .createSignedUrl(audioPath, 86400);

    if (signError || !data?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl, expiresIn: 86400 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
