import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTextOffline, getBookMeta } from "@/lib/offlineStorage";

const FREE_READS_LIMIT = 10;

export const useSummary = (bookId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["summary", bookId, user?.id],
    queryFn: async () => {
      // Offline fallback first
      if (!navigator.onLine) {
        const [text, meta] = await Promise.all([
          getTextOffline(bookId),
          getBookMeta(bookId),
        ]);
        if (text) {
          return {
            id: `offline-${bookId}`,
            book_id: bookId,
            content: text,
            audio_url: meta?.hasAudio ? `offline:${bookId}` : null,
            audio_size_bytes: meta?.audioSizeBytes ?? null,
            created_at: meta?.downloadedAt ?? new Date().toISOString(),
            updated_at: meta?.downloadedAt ?? new Date().toISOString(),
            truncated: false,
            freeReadsUsed: 0,
            freeReadsLimit: FREE_READS_LIMIT,
          };
        }
      }

      // Authenticated users: call Edge Function (server-side content gating)
      if (user) {
        const { data, error } = await supabase.functions.invoke("get-summary", {
          body: { bookId },
        });
        if (error) throw error;
        if (!data) return null;
        return data as {
          id: string;
          book_id: string;
          content: string;
          audio_url: string | null;
          audio_size_bytes: number | null;
          created_at: string;
          updated_at: string;
          truncated: boolean;
          freeReadsUsed: number;
          freeReadsLimit: number;
        };
      }

      // Not logged in: direct query, no gating (they can't do much without auth anyway)
      const { data: summary, error } = await supabase
        .from("summaries")
        .select("id, book_id, content, audio_url, audio_size_bytes, created_at, updated_at")
        .eq("book_id", bookId)
        .maybeSingle();
      if (error) throw error;
      if (!summary) return null;
      return { ...summary, truncated: false, freeReadsUsed: 0, freeReadsLimit: FREE_READS_LIMIT };
    },
    enabled: !!bookId,
  });
};
