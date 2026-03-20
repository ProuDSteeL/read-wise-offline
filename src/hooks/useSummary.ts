import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTextOffline, getBookMeta } from "@/lib/offlineStorage";

const FREE_READS_LIMIT = 10;

function truncateSummary(content: string): string {
  if (!content) return "";
  const lines = content.split(/\n/);
  const sections: string[] = [];
  let current = "";
  for (const line of lines) {
    if (line.startsWith("#") && current.trim()) {
      sections.push(current.trim());
      current = line + "\n";
    } else {
      current += line + "\n";
    }
  }
  if (current.trim()) sections.push(current.trim());
  if (sections.length <= 1) return sections[0]?.slice(0, 200) ?? "";
  return sections.slice(0, 2).join("\n\n");
}

export const useSummary = (bookId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["summary", bookId],
    queryFn: async () => {
      // Try Supabase first
      try {
        const { data: summary, error } = await supabase
          .from("summaries")
          .select("id, book_id, content, audio_url, audio_size_bytes, created_at, updated_at")
          .eq("book_id", bookId)
          .maybeSingle();
        if (error) throw error;
        if (!summary) return null;

        // TODO: re-enable content gating before launch
        return { ...summary, truncated: false, freeReadsUsed: 0, freeReadsLimit: FREE_READS_LIMIT };
      } catch (e) {
        // Offline fallback: try localforage
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
        throw e;
      }
    },
    enabled: !!bookId,
  });
};
