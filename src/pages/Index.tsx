import BookCard from "@/components/BookCard";

const mockBooks = [
  { id: "1", title: "Атомные привычки", author: "Джеймс Клир", coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop", readTimeMin: 15 },
  { id: "2", title: "Думай медленно, решай быстро", author: "Даниэль Канеман", coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=400&fit=crop", readTimeMin: 20 },
  { id: "3", title: "Начни с почему", author: "Саймон Синек", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop", readTimeMin: 12 },
  { id: "4", title: "Сила воли", author: "Келли Макгонигал", coverUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop", readTimeMin: 18 },
  { id: "5", title: "Эмоциональный интеллект", author: "Дэниел Гоулман", coverUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop", readTimeMin: 22 },
];

const categories = ["Бизнес", "Психология", "Продуктивность", "Здоровье", "Лидерство", "Финансы"];

const Index = () => {
  return (
    <div className="animate-fade-in space-y-6 pb-4">
      {/* Header */}
      <div className="px-4 pt-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Букс
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ключевые идеи лучших книг за 15 минут
        </p>
      </div>

      {/* Categories chips */}
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            className="shrink-0 rounded-chip bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground tap-highlight"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Popular section */}
      <section className="space-y-3">
        <h2 className="px-4 text-lg font-semibold text-foreground">Популярное</h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {mockBooks.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl}
              readTimeMin={book.readTimeMin}
            />
          ))}
        </div>
      </section>

      {/* New section */}
      <section className="space-y-3">
        <h2 className="px-4 text-lg font-semibold text-foreground">Новинки</h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {[...mockBooks].reverse().map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl}
              readTimeMin={book.readTimeMin}
            />
          ))}
        </div>
      </section>

      {/* Continue reading */}
      <section className="space-y-3">
        <h2 className="px-4 text-lg font-semibold text-foreground">Продолжить</h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {mockBooks.slice(0, 3).map((book, i) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl}
              readTimeMin={book.readTimeMin}
              progress={[35, 68, 12][i]}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
