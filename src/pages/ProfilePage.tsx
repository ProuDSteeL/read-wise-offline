import { User, Settings, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProfilePage = () => {
  return (
    <div className="animate-fade-in space-y-6 px-4 pt-12">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Профиль</h1>

      {/* Unauthenticated state */}
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
        <Button className="w-full rounded-xl">
          <LogIn className="mr-2 h-4 w-4" />
          Войти
        </Button>
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "0", label: "Прочитано" },
          { value: "0 ч", label: "Время" },
          { value: "0", label: "Серия дней" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl bg-card p-4 shadow-card"
          >
            <span className="text-xl font-bold text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
