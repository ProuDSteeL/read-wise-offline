import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSummary = (bookId: string) => {
  return useQuery({
    queryKey: ["summary", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("book_id", bookId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
};
