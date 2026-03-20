import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBook } from "@/hooks/useBooks";
import { useQuiz, useSaveQuizResult } from "@/hooks/useQuiz";
import { useFlashcards, useFlashcardProgress } from "@/hooks/useFlashcards";
import QuizProgress from "@/components/quiz/QuizProgress";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizResults from "@/components/quiz/QuizResults";
import FlashCardDeck from "@/components/flashcard/FlashCardDeck";

type QuizState =
  | { phase: "ready" }
  | { phase: "in-progress"; currentIndex: number; answers: Record<number, number> }
  | { phase: "completed"; score: number; answers: Record<number, number> };

const LearningPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: book } = useBook(id!);
  const { data: questions, isLoading: quizLoading, error: quizError } = useQuiz(id!);
  const { data: flashcards, isLoading: flashcardsLoading, error: flashcardsError } = useFlashcards(id!);
  const { data: flashcardProgress } = useFlashcardProgress(id!);
  const saveQuizResult = useSaveQuizResult();

  const [quizState, setQuizState] = useState<QuizState>({ phase: "ready" });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const resultSaved = useRef(false);

  // Save quiz result when completed
  useEffect(() => {
    if (quizState.phase === "completed" && !resultSaved.current && questions) {
      saveQuizResult.mutate(
        {
          bookId: id!,
          score: quizState.score,
          totalQuestions: questions.length,
        },
        {
          onSuccess: () => {
            resultSaved.current = true;
          },
          onError: () => {
            toast({
              title: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442",
              description: "\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437",
              variant: "destructive",
            });
          },
        }
      );
    }
  }, [quizState, questions, id, saveQuizResult]);

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (quizState.phase !== "in-progress" || !questions) return;
      setSelectedAnswer(optionIndex);

      const newAnswers = { ...quizState.answers, [quizState.currentIndex]: optionIndex };

      setTimeout(() => {
        const nextIndex = quizState.currentIndex + 1;
        if (nextIndex >= questions.length) {
          // Calculate score
          const score = Object.entries(newAnswers).reduce((acc, [idx, ans]) => {
            return acc + (questions[Number(idx)].correct_option === ans ? 1 : 0);
          }, 0);
          resultSaved.current = false;
          setQuizState({ phase: "completed", score, answers: newAnswers });
        } else {
          setQuizState({ phase: "in-progress", currentIndex: nextIndex, answers: newAnswers });
        }
        setSelectedAnswer(null);
      }, 1200);
    },
    [quizState, questions]
  );

  const handleStartQuiz = () => {
    setQuizState({ phase: "in-progress", currentIndex: 0, answers: {} });
    setSelectedAnswer(null);
    resultSaved.current = false;
  };

  const handleRetake = () => {
    setQuizState({ phase: "ready" });
    setSelectedAnswer(null);
    resultSaved.current = false;
  };

  const hasError = quizError || flashcardsError;

  return (
    <div className="animate-fade-in pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 glass">
        <button onClick={() => navigate(-1)} className="tap-highlight shrink-0">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground truncate">
          {book?.title ?? ""}
        </h1>
      </div>

      {hasError ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Не удалось загрузить данные. Попробуйте обновить страницу
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4">
          <Tabs defaultValue="quiz">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quiz">Квиз</TabsTrigger>
              <TabsTrigger value="flashcards">Карточки</TabsTrigger>
            </TabsList>

            <TabsContent value="quiz" className="mt-4">
              {quizLoading ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">Загрузка...</p>
                </div>
              ) : !questions || questions.length === 0 ? (
                <div className="rounded-2xl bg-card p-6 text-center shadow-card">
                  <h3 className="text-base font-bold text-foreground mb-2">
                    Квиз пока не добавлен
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Квиз появится здесь, когда автор добавит вопросы к этой книге
                  </p>
                </div>
              ) : quizState.phase === "ready" ? (
                <div className="text-center space-y-4 py-8">
                  <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
                    {questions.length} вопросов
                  </span>
                  <div>
                    <Button
                      className="h-12 rounded-full px-8 text-sm font-bold"
                      onClick={handleStartQuiz}
                    >
                      Начать тест
                    </Button>
                  </div>
                </div>
              ) : quizState.phase === "in-progress" ? (
                <div className="space-y-6">
                  <QuizProgress
                    total={questions.length}
                    current={quizState.currentIndex}
                    answers={quizState.answers}
                  />
                  <QuizQuestion
                    question={questions[quizState.currentIndex]}
                    selectedAnswer={selectedAnswer}
                    onAnswer={handleAnswer}
                  />
                </div>
              ) : (
                <QuizResults
                  questions={questions}
                  answers={quizState.answers}
                  score={quizState.score}
                  total={questions.length}
                  onRetake={handleRetake}
                  onBack={() => navigate(-1)}
                />
              )}
            </TabsContent>

            <TabsContent value="flashcards" className="mt-4">
              {flashcardsLoading ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">Загрузка...</p>
                </div>
              ) : !flashcards || flashcards.length === 0 ? (
                <div className="rounded-2xl bg-card p-6 text-center shadow-card">
                  <h3 className="text-base font-bold text-foreground mb-2">
                    Карточек пока нет
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Карточки появятся здесь, когда автор добавит их к этой книге
                  </p>
                </div>
              ) : (
                <FlashCardDeck
                  flashcards={flashcards}
                  bookId={id!}
                  progress={flashcardProgress ?? []}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default LearningPage;
