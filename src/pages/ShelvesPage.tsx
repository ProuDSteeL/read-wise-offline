import { BookOpen, Heart, BookMarked, Download } from "lucide-react";

const shelves = [
  { icon: Heart, label: "Избранное", count: 0 },
  { icon: BookOpen, label: "Прочитано", count: 0 },
  { icon: BookMarked, label: "Хочу прочитать", count: 0 },
  { icon: Download, label: "Мои загрузки", count: 0 },
];

const ShelvesPage = () => {
  return (
    <div className="animate-fade-in space-y-6 px-4 pt-12">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Мои полки</h1>
      <div className="space-y-2">
        {shelves.map(({ icon: Icon, label, count }) => (
          <button
            key={label}
            className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-colors tap-highlight hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{count} книг</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShelvesPage;
