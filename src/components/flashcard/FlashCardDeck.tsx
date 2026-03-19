import { useState, useEffect, useCallback } from "react";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import FlashCard from "./FlashCard";
import { useUpdateFlashcardProgress } from "@/hooks/useFlashcards";

interface FlashCardDeckProps {
  flashcards: Array<{ id: string; front: string; back: string }>;
  bookId: string;
  progress: Array<{ flashcard_id: string; mastered: boolean }>;
}

const FlashCardDeck = ({ flashcards, bookId, progress }: FlashCardDeckProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const updateProgress = useUpdateFlashcardProgress();

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const handleFlip = useCallback((index: number) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const handleRate = useCallback(
    (mastered: boolean) => {
      const card = flashcards[currentIndex];
      if (!card) return;

      updateProgress.mutate(
        { flashcardId: card.id, bookId, mastered },
        {
          onSuccess: () => {
            // Reset flip and advance to next card
            setFlippedCards((prev) => ({ ...prev, [currentIndex]: false }));
            if (currentIndex < flashcards.length - 1) {
              api?.scrollNext();
            }
          },
        }
      );
    },
    [currentIndex, flashcards, bookId, updateProgress, api]
  );

  const masteredCount = progress.filter((p) => p.mastered).length;
  const isCurrentFlipped = flippedCards[currentIndex] ?? false;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        {currentIndex + 1} / {flashcards.length}
      </p>

      <Carousel setApi={setApi} opts={{ watchDrag: !isCurrentFlipped }}>
        <CarouselContent>
          {flashcards.map((card, index) => (
            <CarouselItem key={card.id}>
              <FlashCard
                front={card.front}
                back={card.back}
                flipped={flippedCards[index] ?? false}
                onFlip={() => handleFlip(index)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Rating buttons - visible when current card is flipped */}
      {isCurrentFlipped && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full border-sage text-sage"
            onClick={() => handleRate(true)}
            disabled={updateProgress.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Знал
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full border-muted-foreground text-muted-foreground"
            onClick={() => handleRate(false)}
            disabled={updateProgress.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Не знал
          </Button>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => api?.scrollPrev()}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => api?.scrollNext()}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {masteredCount} из {flashcards.length} изучено
      </p>
    </div>
  );
};

export default FlashCardDeck;
