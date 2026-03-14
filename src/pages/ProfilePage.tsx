import { User, Settings, LogIn, LogOut, BookOpen, Clock, Flame, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const ProfilePage = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="animate-fade-in space-y-6 px-4 pt-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Профиль</h1>
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-8 shadow-card text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Войдите в аккаунт</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Сохраняйте прогресс и синхронизируйте между устройствами
            </p>
          </div>
          <Button className="w-full rounded-xl" onClick={() => navigate("/auth")}>
            <LogIn className="mr-2 h-4 w-4" />
            Войти
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 px-4 pt-12">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Профиль</h1>

      <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">Бесплатный план</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "0", label: "Прочитано", icon: BookOpen },
          { value: "0 ч", label: "Время", icon: Clock },
          { value: "0", label: "Серия дней", icon: Flame },
        ].map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-4 shadow-card"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xl font-bold text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {isAdmin && (
        <Button
          variant="outline"
          className="w-full justify-start gap-3 rounded-xl"
          onClick={() => navigate("/admin/book/new")}
        >
          <Shield className="h-4 w-4" />
          Добавить книгу
        </Button>
      )}

      <Button
        variant="ghost"
        className="w-full justify-start gap-3 rounded-xl text-destructive"
        onClick={signOut}
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </Button>
    </div>
  );
};

export default ProfilePage;
