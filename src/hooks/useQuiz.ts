import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useQuiz = (bookId: string) => {
  return useQuery({
    queryKey: ["quiz_questions", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("book_id", bookId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });
};

export const useQuizResult = (bookId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quiz_result", user?.id, bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", user!.id)
        .eq("book_id", bookId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!bookId,
  });
};

export const useSaveQuizResult = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      score,
      totalQuestions,
    }: {
      bookId: string;
      score: number;
      totalQuestions: number;
    }) => {
      // Check existing best score
      const { data: existing } = await supabase
        .from("quiz_results")
        .select("id, score")
        .eq("user_id", user!.id)
        .eq("book_id", bookId)
        .maybeSingle();

      if (existing && existing.score >= score) return existing; // keep best

      const { data, error } = await supabase
        .from("quiz_results")
        .upsert(
          {
            user_id: user!.id,
            book_id: bookId,
            score,
            total_questions: totalQuestions,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,book_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["quiz_result", user?.id, vars.bookId],
      });
      queryClient.invalidateQueries({ queryKey: ["profile_stats"] });
      queryClient.invalidateQueries({
        queryKey: ["book_learning_progress"],
      });
    },
  });
};
