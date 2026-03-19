import { Check, X } from "lucide-react";

interface QuizQuestionProps {
  question: {
    id: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: number;
  };
  selectedAnswer: number | null;
  onAnswer: (optionIndex: number) => void;
}

const QuizQuestion = ({ question, selectedAnswer, onAnswer }: QuizQuestionProps) => {
  const options = [question.option_a, question.option_b, question.option_c, question.option_d];
  const hasFeedback = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correct_option;

  return (
    <div>
      <h3 className="text-base font-bold leading-snug text-foreground mb-4">
        {question.question}
      </h3>

      {hasFeedback && (
        <p className={`text-sm font-bold mb-3 ${isCorrect ? "text-green-600" : "text-destructive"}`}>
          {isCorrect ? "Верно!" : "Неверно"}
        </p>
      )}

      <div className={`space-y-3 ${hasFeedback ? "pointer-events-none" : ""}`}>
        {options.map((option, index) => {
          let className =
            "w-full rounded-xl border p-4 text-left text-sm font-bold leading-snug transition-all duration-300 flex items-center justify-between gap-3";

          if (!hasFeedback) {
            className += " bg-card border-border active:scale-[0.98]";
          } else if (index === question.correct_option && index === selectedAnswer) {
            className += " bg-green-50 border-green-500";
          } else if (index === selectedAnswer && index !== question.correct_option) {
            className += " bg-red-50 border-red-500";
          } else if (index === question.correct_option) {
            className += " bg-green-50/50 border-green-300";
          } else {
            className += " bg-card border-border";
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => onAnswer(index)}
              disabled={hasFeedback}
            >
              <span>{option}</span>
              {hasFeedback && index === question.correct_option && index === selectedAnswer && (
                <Check className="h-5 w-5 shrink-0 text-green-600" />
              )}
              {hasFeedback && index === selectedAnswer && index !== question.correct_option && (
                <X className="h-5 w-5 shrink-0 text-red-600" />
              )}
              {hasFeedback && index === question.correct_option && index !== selectedAnswer && (
                <Check className="h-5 w-5 shrink-0 text-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizQuestion;
