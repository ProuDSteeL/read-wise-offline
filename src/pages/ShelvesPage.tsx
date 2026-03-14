import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, BookMarked, Download, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useShelfCounts, useDownloadCount } from "@/hooks/useUserData";

const ShelvesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: counts } = useShelfCounts();
  const { data: downloadCount } = useDownloadCount();

  const shelves = [
    { icon: Heart, label: "Избранное", count: counts?.favorite ?? 0, key: "favorite" },
    { icon: BookOpen, label: "Прочитано", count: counts?.read ?? 0, key: "read" },
    { icon: BookMarked, label: "Хочу прочитать", count: counts?.want_to_read ?? 0, key: "want_to_read" },
    { icon: Download, label: "Мои загрузки", count: downloadCount ?? 0, key: "downloads" },
  ];

  if (!user) {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 px-4 pt-32 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Войдите, чтобы сохранять книги на полки
        </p>
        <Button className="rounded-xl" onClick={() => navigate("/auth")}>
          <LogIn className="mr-2 h-4 w-4" />
          Войти
        </Button>
      </div>
    );
  }

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
