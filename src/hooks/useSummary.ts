import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SummaryResponse {
  id: string;
  book_id: string;
  content: string | null;
  audio_url: string | null;
  audio_size_bytes: number | null;
  published_at: string | null;
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
      const { data, error } = await supabase.functions.invoke<SummaryResponse>("get-summary", {
        body: { bookId },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
};
