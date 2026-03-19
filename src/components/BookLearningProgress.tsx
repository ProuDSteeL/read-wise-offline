import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

export const useBookLearningProgress = (bookId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["book_learning_progress", user?.id, bookId],
    queryFn: async () => {
      // Quiz: has the user completed it?
      const { data: quizResult } = await supabase
        .from("quiz_results")
        .select("score, total_questions")
        .eq("user_id", user!.id)
        .eq("book_id", bookId)
        .maybeSingle();

      // Total flashcards for this book
      const { count: totalCards } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("book_id", bookId);

      // Mastered flashcards for this user + book
      const { count: masteredCards } = await supabase
        .from("flashcard_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("book_id", bookId)
        .eq("mastered", true);

      // Has quiz questions at all?
      const { count: quizCount } = await supabase
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .eq("book_id", bookId);

      const hasQuiz = (quizCount ?? 0) > 0;
      const hasFlashcards = (totalCards ?? 0) > 0;
      const quizDone = !!quizResult;
      const flashcardPercent = totalCards ? (masteredCards ?? 0) / totalCards : 0;

      // Weight: 50% quiz + 50% flashcards (if both exist)
      // If only quiz exists: 100% quiz. If only flashcards: 100% flashcards.
      let overallPercent = 0;
      if (hasQuiz && hasFlashcards) {
        overallPercent = ((quizDone ? 0.5 : 0) + (flashcardPercent * 0.5)) * 100;
      } else if (hasQuiz) {
        overallPercent = quizDone ? 100 : 0;
      } else if (hasFlashcards) {
        overallPercent = flashcardPercent * 100;
      }

      return { hasQuiz, hasFlashcards, quizDone, flashcardPercent, overallPercent, totalCards: totalCards ?? 0, masteredCards: masteredCards ?? 0 };
    },
    enabled: !!user,
  });
};

const BookLearningProgress = ({ bookId }: { bookId: string }) => {
  const { data } = useBookLearningProgress(bookId);
  if (!data || (!data.hasQuiz && !data.hasFlashcards)) return null;
  if (data.overallPercent === 0) return null;

  return (
    <Progress
      value={data.overallPercent}
      className="h-1.5 w-full"
    />
  );
};

export default BookLearningProgress;
