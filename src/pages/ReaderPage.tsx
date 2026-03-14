import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useKeyIdeas } from "@/hooks/useBooks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const ReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: keyIdeas, isLoading } = useKeyIdeas(id!);
  const [currentIndex, setCurrentIndex] = useState(0);
  const savedRef = useRef(false);

  // Load saved position
  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("user_progress")
      .select("last_position, progress_percent")
      .eq("user_id", user.id)
      .eq("book_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.last_position) {
          const idx = parseInt(data.last_position);
          if (!isNaN(idx)) setCurrentIndex(idx);
        }
      });
  }, [user, id]);

  // Save position
  const saveProgress = useCallback(
    async (idx: number) => {
      if (!user || !id || !keyIdeas?.length) return;
      const percent = Math.round(((idx + 1) / keyIdeas.length) * 100);
      await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          book_id: id,
          last_position: String(idx),
          progress_percent: percent,
        },
        { onConflict: "user_id,book_id" }
      );
    },
    [user, id, keyIdeas]
  );

  // Auto-save on index change
  useEffect(() => {
    if (savedRef.current) {
      saveProgress(currentIndex);
    }
    savedRef.current = true;
  }, [currentIndex, saveProgress]);

  const goNext = () => {
    if (keyIdeas && currentIndex < keyIdeas.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  // Swipe support
  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 60) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!keyIdeas?.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-muted-foreground">Контент пока не добавлен</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    );
  }

  const idea = keyIdeas[currentIndex];
  const progress = ((currentIndex + 1) / keyIdeas.length) * 100;

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="tap-highlight">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            {currentIndex + 1} / {keyIdeas.length}
          </span>
          <div className="w-5" />
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center px-6 py-8">
        <div className="animate-fade-in space-y-4" key={currentIndex}>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Идея {currentIndex + 1}
          </span>
          <h2 className="text-xl font-bold leading-tight text-foreground">
            {idea.title}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground font-serif whitespace-pre-line">
            {idea.content}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 border-t bg-background/90 backdrop-blur-xl safe-bottom">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIndex === 0}
            onClick={goPrev}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Назад
          </Button>

          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {keyIdeas.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? "w-4 bg-primary"
                    : i < currentIndex
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-secondary"
                }`}
              />
            ))}
          </div>

          {currentIndex === keyIdeas.length - 1 ? (
            <Button size="sm" onClick={() => navigate(-1)} className="gap-1 rounded-xl">
              Готово
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              className="gap-1"
            >
              Далее <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReaderPage;
