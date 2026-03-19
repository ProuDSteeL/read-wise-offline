interface FlashCardProps {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
}

const FlashCard = ({ front, back, flipped, onFlip }: FlashCardProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div
      className="perspective-[1000px] h-64 w-full cursor-pointer"
      onClick={onFlip}
      role="button"
      aria-label="Flip card"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front face */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card p-6 shadow-elevated [backface-visibility:hidden]">
          <p className="text-center text-base font-bold text-foreground">{front}</p>
        </div>

        {/* Back face */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl gradient-primary p-6 shadow-elevated [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-center text-sm leading-relaxed text-primary-foreground font-normal">
            {back}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;
