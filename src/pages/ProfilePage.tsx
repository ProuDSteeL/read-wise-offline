import { User, LogIn, LogOut, BookOpen, Clock, Flame, Shield, ChevronRight, Pencil, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useProfileStats } from "@/hooks/useProfileStats";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Switch } from "@/components/ui/switch";

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
        <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">Профиль</h1>
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-card p-8 shadow-card text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-light">
            <User className="h-10 w-10 text-sage" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Войдите в аккаунт</p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Сохраняйте прогресс и синхронизируйте между устройствами
            </p>
          </div>
          <Button className="w-full rounded-full h-12 text-sm font-bold" onClick={() => navigate("/auth")}>
            <LogIn className="mr-2 h-4 w-4" />
            Войти
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 px-4 pt-14 pb-6">
      <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">Настройки</h1>

      {/* Subscription */}
      <div className="rounded-2xl bg-card p-4 shadow-card space-y-4">
        <p className="text-sm font-bold text-foreground">Подписка</p>
        <div className="flex items-center rounded-xl border border-border overflow-hidden">
          <div className="flex-1 bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">
            Не активна
          </div>
          <button className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-sage">
            Подписаться <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Profile info */}
      <div className="rounded-2xl bg-card shadow-card divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-xs text-muted-foreground">Имя</p>
            <p className="text-sm font-medium text-foreground">{user.user_metadata?.name || "—"}</p>
          </div>
          <Pencil className="h-4 w-4 text-sage" />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-xs text-muted-foreground">Почта</p>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-xs text-muted-foreground">Пароль</p>
            <p className="text-sm font-medium text-foreground">●●●●●●</p>
          </div>
          <Pencil className="h-4 w-4 text-sage" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: String(stats?.readCount ?? 0), label: "Прочитано", icon: BookOpen },
          { value: `${stats?.totalHours ?? 0} ч`, label: "Время", icon: Clock },
          { value: String(stats?.streak ?? 0), label: "Серия дней", icon: Flame },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-4 shadow-card">
            <Icon className="h-4 w-4 text-sage" />
            <span className="text-xl font-extrabold text-foreground">{value}</span>
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {isAdmin && (
        <button
          onClick={() => navigate("/admin/books")}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-colors tap-highlight"
        >
          <Shield className="h-5 w-5 text-sage" />
          <span className="flex-1 text-left text-sm font-medium text-foreground">Управление книгами</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <button
        onClick={signOut}
        className="flex w-full items-center gap-3 rounded-2xl p-4 transition-colors tap-highlight"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="flex-1 text-left text-sm font-medium text-destructive">Выйти</span>
      </button>
    </div>
  );
};

export default ProfilePage;
