import { WifiOff, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const OfflineFallback = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sage-light">
        <WifiOff className="h-10 w-10 text-sage" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Нет подключения
      </h1>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        Эта страница недоступна без интернета. Вы можете читать загруженные книги офлайн.
      </p>

      {/* CTA to downloads */}
      <Link
        to="/downloads"
        className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground tap-highlight"
      >
        <BookOpen className="h-4 w-4" />
        Мои загрузки
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default OfflineFallback;
