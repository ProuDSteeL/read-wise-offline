import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuizResultsProps {
  questions: Array<{
    id: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: number;
  }>;
  answers: Record<number, number>;
  score: number;
  total: number;
  onRetake: () => void;
  onBack: () => void;
}

const QuizResults = ({ questions, answers, score, total, onRetake, onBack }: QuizResultsProps) => {
  const options = (q: QuizResultsProps["questions"][0]) => [q.option_a, q.option_b, q.option_c, q.option_d];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-bold">Результат</h2>
        <p className="text-2xl font-bold text-primary">
          {score} из {total}
        </p>
        <Progress value={(score / total) * 100} className="h-2" />
      </div>

      <hr className="border-border" />

      <div className="space-y-4">
        {questions.map((q, i) => {
          const userAnswer = answers[i];
          const isCorrect = userAnswer === q.correct_option;
          const opts = options(q);

          return (
            <div key={q.id} className="space-y-2">
              <p className="text-sm font-bold text-foreground">{q.question}</p>
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {isCorrect ? (
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{opts[userAnswer]}</span>
              </div>
              {!isCorrect && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50/50 px-3 py-2 text-sm text-green-700">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  <span>{opts[q.correct_option]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-2">
        <Button className="w-full rounded-full h-12" onClick={onRetake}>
          Пройти заново
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          Назад к книге
        </Button>
      </div>
    </div>
  );
};

export default QuizResults;
