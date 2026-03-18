import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SummaryResponse {
  id: string;
  book_id: string;
  content: string | null;
  audio_url: string | null;
  audio_size_bytes: number | null;
  created_at: string;
  updated_at: string;
  truncated: boolean;
  freeReadsUsed: number;
  freeReadsLimit: number;
}

export const useSummary = (bookId: string) => {
  return useQuery({
    queryKey: ["summary", bookId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke<SummaryResponse>("get-summary", {
          body: { bookId },
        });
        if (error) throw error;
        return data;
      } catch {
        // Fallback: direct table query if Edge Function fails
        const { data, error } = await supabase
          .from("summaries")
          .select("*")
          .eq("book_id", bookId)
          .maybeSingle();
        if (error) throw error;
        return data ? { ...data, truncated: false, freeReadsUsed: 0, freeReadsLimit: 10 } : null;
      }
    },
    enabled: !!bookId,
  });
};
