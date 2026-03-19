import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_READS_LIMIT = 10;

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

export const useSummary = (bookId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["summary", bookId],
    queryFn: async () => {
      // Fetch summary directly
      const { data: summary, error } = await supabase
        .from("summaries")
        .select("id, book_id, content, audio_url, audio_size_bytes, created_at, updated_at")
        .eq("book_id", bookId)
        .maybeSingle();
      if (error) throw error;
      if (!summary) return null;

      // Track this book open
      if (user) {
        await supabase.from("user_progress").upsert(
          { user_id: user.id, book_id: bookId, progress_percent: 0, scroll_position: 0 },
          { onConflict: "user_id,book_id" }
        );
      }

      // Check subscription
      let isPro = false;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_type, subscription_expires_at")
          .eq("id", user.id)
          .maybeSingle();
        const subType = profile?.subscription_type;
        const expires = profile?.subscription_expires_at;
        isPro = (subType === "pro_monthly" || subType === "pro_yearly") &&
          (!expires || new Date(expires) > new Date());
      }

      if (isPro || !user) {
        return { ...summary, truncated: false, freeReadsUsed: 0, freeReadsLimit: FREE_READS_LIMIT };
      }

      // Count free reads
      const { data: progressRows } = await supabase
        .from("user_progress")
        .select("book_id")
        .eq("user_id", user.id);

      const freeReadsUsed = progressRows?.length ?? 0;

      if (freeReadsUsed <= FREE_READS_LIMIT) {
        return { ...summary, truncated: false, freeReadsUsed, freeReadsLimit: FREE_READS_LIMIT };
      }

      // Exceeded limit: truncate
      return {
        ...summary,
        content: truncateSummary(summary.content ?? ""),
        truncated: true,
        freeReadsUsed,
        freeReadsLimit: FREE_READS_LIMIT,
      };
    },
    enabled: !!bookId,
  });
};
