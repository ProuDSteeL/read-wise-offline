import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "./useSubscription";

const FREE_READS_LIMIT = 10;

export const useAccessControl = () => {
  const { user } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();

  const { data: freeReadsUsed = 0, isLoading: readsLoading } = useQuery({
    queryKey: ["free_reads_count", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("book_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      const distinctBooks = new Set(data?.map((d) => d.book_id));
      return distinctBooks.size;
    },
    enabled: !!user && !isPro,
  });

  const canReadFull = (bookId: string, existingProgressBookIds?: string[]) => {
    if (isPro) return true;
    if (!user) return false;
    // If user already has progress on this book, it counts as an existing read
    if (existingProgressBookIds?.includes(bookId)) return true;
    return freeReadsUsed < FREE_READS_LIMIT;
  };

  const canListenAudio = isPro;
  const canDownload = isPro;

  const canHighlight = (_currentCount?: number) => true; // highlights unlimited for all

  return {
    isPro,
    canReadFull,
    canListenAudio,
    canDownload,
    canHighlight,
    freeReadsUsed,
    freeReadsLimit: FREE_READS_LIMIT,
    highlightLimit: Infinity,
    isLoading: subLoading || readsLoading,
  };
};
