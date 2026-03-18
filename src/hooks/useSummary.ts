import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "./useAccessControl";

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
  const { isPro, freeReadsUsed } = useAccessControl();

  return useQuery({
    queryKey: ["summary", bookId, isPro, freeReadsUsed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("book_id", bookId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Pro users get full content
      if (isPro) {
        return { ...data, truncated: false, freeReadsUsed: 0, freeReadsLimit: FREE_READS_LIMIT };
      }

      // Check if user already has progress on this book
      let hasExistingProgress = false;
      if (user) {
        const { data: progress } = await supabase
          .from("user_progress")
          .select("book_id")
          .eq("user_id", user.id)
          .eq("book_id", bookId)
          .maybeSingle();
        hasExistingProgress = !!progress;
      }

      // Within limit or already reading this book
      if (freeReadsUsed < FREE_READS_LIMIT || hasExistingProgress) {
        return { ...data, truncated: false, freeReadsUsed, freeReadsLimit: FREE_READS_LIMIT };
      }

      // Exceeded limit: truncate
      return {
        ...data,
        content: truncateSummary(data.content),
        truncated: true,
        freeReadsUsed,
        freeReadsLimit: FREE_READS_LIMIT,
      };
    },
    enabled: !!bookId,
  });
};
