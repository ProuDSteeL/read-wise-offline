import { useState } from "react";
import { User, LogIn, LogOut, BookOpen, Clock, Flame, Shield, ChevronRight, Pencil, Bell, Crown, Target, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useProfileStats } from "@/hooks/useProfileStats";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSubscription } from "@/hooks/useSubscription";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const ProfilePage = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const { data: stats } = useProfileStats();
  const push = usePushNotifications();
  const { isPro, subscriptionType, expiresAt } = useSubscription();
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [editField, setEditField] = useState<"name" | "email" | "password" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (field: "name" | "email" | "password") => {
    setEditField(field);
    setEditValue(field === "name" ? (user?.user_metadata?.name || "") : field === "email" ? (user?.email || "") : "");
    setEditPassword("");
    setEditSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!editField) return;
    setEditSaving(true);
    try {
      if (editField === "name") {
        const { error } = await supabase.auth.updateUser({ data: { name: editValue.trim() } });
        if (error) throw error;
        toast({ title: "Имя обновлено" });
      } else if (editField === "email") {
        const { error } = await supabase.auth.updateUser({ email: editValue.trim() });
        if (error) throw error;
        toast({ title: "Письмо для подтверждения отправлено", description: "Проверьте новую почту" });
      } else if (editField === "password") {
        if (editValue.length < 6) {
          toast({ title: "Минимум 6 символов", variant: "destructive" });
          setEditSaving(false);
          return;
        }
        if (editValue !== editPassword) {
          toast({ title: "Пароли не совпадают", variant: "destructive" });
          setEditSaving(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: editValue });
        if (error) throw error;
        toast({ title: "Пароль обновлён" });
      }
      setEditField(null);
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

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
      <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
        <p className="text-sm font-bold text-foreground">Подписка</p>
        {isPro ? (
          <div className="flex items-center gap-3 rounded-xl bg-sage-light p-3">
            <Crown className="h-5 w-5 text-sage" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                Pro {subscriptionType === "pro_yearly" ? "(год)" : "(месяц)"}
              </p>
              {expiresAt && (
                <p className="text-[11px] text-muted-foreground">
                  до {format(expiresAt, "d MMMM yyyy", { locale: ru })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center rounded-xl border border-border overflow-hidden">
            <div className="flex-1 bg-secondary px-4 py-2.5 text-xs font-bold text-foreground">
              Бесплатный план
            </div>
            <button
              onClick={() => setShowSubDialog(true)}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-sage"
            >
              Подписаться <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="rounded-2xl bg-card shadow-card divide-y divide-border">
        <button onClick={() => openEdit("name")} className="flex w-full items-center justify-between px-4 py-3.5 tap-highlight text-left">
          <div>
            <p className="text-xs text-muted-foreground">Имя</p>
            <p className="text-sm font-medium text-foreground">{user.user_metadata?.name || "—"}</p>
          </div>
          <Pencil className="h-4 w-4 text-sage" />
        </button>
        <button onClick={() => openEdit("email")} className="flex w-full items-center justify-between px-4 py-3.5 tap-highlight text-left">
          <div>
            <p className="text-xs text-muted-foreground">Почта</p>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>
          <Pencil className="h-4 w-4 text-sage" />
        </button>
        <button onClick={() => openEdit("password")} className="flex w-full items-center justify-between px-4 py-3.5 tap-highlight text-left">
          <div>
            <p className="text-xs text-muted-foreground">Пароль</p>
            <p className="text-sm font-medium text-foreground">●●●●●●</p>
          </div>
          <Pencil className="h-4 w-4 text-sage" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
        {[
          { value: String(stats?.readCount ?? 0), label: "Прочитано", icon: BookOpen },
          { value: `${stats?.totalHours ?? 0} ч`, label: "Время", icon: Clock },
          { value: String(stats?.streak ?? 0), label: "Серия дней", icon: Flame },
          { value: String(stats?.quizzesPassed ?? 0), label: "Квизы", icon: Target },
          { value: String(stats?.cardsMastered ?? 0), label: "Карточки", icon: Brain },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="flex min-w-[100px] flex-col items-center gap-1.5 rounded-2xl bg-card p-4 shadow-card">
            <Icon className="h-4 w-4 text-sage" />
            <span className="text-xl font-extrabold text-foreground">{value}</span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>

      {/* Notifications */}
      {push.isSupported && (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <Bell className="h-5 w-5 text-sage" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Push-уведомления</p>
            <p className="text-[11px] text-muted-foreground">Напоминания о чтении раз в 3 дня</p>
          </div>
          <Switch
            checked={push.isSubscribed}
            onCheckedChange={() => push.toggle()}
            disabled={push.loading}
          />
        </div>
      )}
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

      {/* Edit profile dialog */}
      <Dialog open={!!editField} onOpenChange={(open) => { if (!open) setEditField(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              {editField === "name" ? "Изменить имя" : editField === "email" ? "Изменить почту" : "Изменить пароль"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editField === "password" ? (
              <>
                <Input
                  type="password"
                  placeholder="Новый пароль"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                />
                <Input
                  type="password"
                  placeholder="Повторите пароль"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </>
            ) : (
              <Input
                type={editField === "email" ? "email" : "text"}
                placeholder={editField === "name" ? "Ваше имя" : "Новая почта"}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
            )}
            {editField === "email" && (
              <p className="text-xs text-muted-foreground">
                На новую почту придёт письмо для подтверждения
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setEditField(null)}>
                Отмена
              </Button>
              <Button className="flex-1 rounded-full" onClick={handleSaveEdit} disabled={editSaving || !editValue.trim()}>
                {editSaving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription dialog */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">Подписка Pro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {[
                { label: "Месяц", price: "299 р/мес", sub: "Отменить в любой момент" },
                { label: "Год", price: "1 990 р/год", sub: "Экономия 60%" },
              ].map((plan) => (
                <div key={plan.label} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{plan.label}</p>
                      <p className="text-xs text-muted-foreground">{plan.sub}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{plan.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Оплата будет доступна в следующем обновлении
            </p>
            <Button variant="outline" className="w-full rounded-full" onClick={() => setShowSubDialog(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
