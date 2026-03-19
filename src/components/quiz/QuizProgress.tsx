interface QuizProgressProps {
  total: number;
  current: number;
  answers: Record<number, number>;
}

const QuizProgress = ({ total, current, answers }: QuizProgressProps) => {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = i in answers;
        const isCurrent = i === current;

        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              isCurrent
                ? "bg-primary ring-2 ring-primary/30"
                : isAnswered
                  ? "bg-primary"
                  : "bg-muted-foreground/20"
            }`}
            aria-label={`Вопрос ${i + 1} из ${total}`}
          />
        );
      })}
    </div>
  );
};

export default QuizProgress;
