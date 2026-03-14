import { User, LogIn, LogOut, BookOpen, Clock, Flame, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useProfileStats } from "@/hooks/useProfileStats";

const ProfilePage = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const { data: stats } = useProfileStats();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="animate-fade-in space-y-6 px-4 pt-14">
        <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">Профиль</h1>
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-card p-8 shadow-card text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Войдите в аккаунт</p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Сохраняйте прогресс и синхронизируйте между устройствами
            </p>
          </div>
          <Button className="w-full rounded-xl h-12 text-sm font-semibold" onClick={() => navigate("/auth")}>
            <LogIn className="mr-2 h-4 w-4" />
            Войти
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 px-4 pt-14">
      <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">Профиль</h1>

      <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
          <User className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Бесплатный план</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { value: String(stats?.readCount ?? 0), label: "Прочитано", icon: BookOpen },
          { value: `${stats?.totalHours ?? 0} ч`, label: "Время", icon: Clock },
          { value: String(stats?.streak ?? 0), label: "Серия дней", icon: Flame },
        ].map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-4 shadow-card"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-extrabold text-foreground">{value}</span>
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {isAdmin && (
          <button
            onClick={() => navigate("/admin/books")}
            className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-colors tap-highlight hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-foreground">Управление книгами</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-2xl p-4 transition-colors tap-highlight hover:bg-destructive/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/8">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <span className="flex-1 text-left text-sm font-medium text-destructive">Выйти</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
