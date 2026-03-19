import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFlashcards = (bookId: string) => {
  return useQuery({
    queryKey: ["flashcards", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("book_id", bookId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
};

export const useFlashcardProgress = (bookId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["flashcard_progress", user?.id, bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcard_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("book_id", bookId);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!bookId,
  });
};

export const useUpdateFlashcardProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flashcardId,
      bookId,
      mastered,
    }: {
      flashcardId: string;
      bookId: string;
      mastered: boolean;
    }) => {
      const { data, error } = await supabase
        .from("flashcard_progress")
        .upsert(
          {
            user_id: user!.id,
            flashcard_id: flashcardId,
            book_id: bookId,
            mastered,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,flashcard_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["flashcard_progress", user?.id, vars.bookId],
      });
      queryClient.invalidateQueries({ queryKey: ["profile_stats"] });
      queryClient.invalidateQueries({
        queryKey: ["book_learning_progress"],
      });
    },
  });
};
