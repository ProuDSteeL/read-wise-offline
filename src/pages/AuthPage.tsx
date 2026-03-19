import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup" | "forgot";

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: error.message, variant: "destructive" });
      } else {
        toast({ title: "Письмо для сброса пароля отправлено на вашу почту" });
      }
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast({ title: error.message, variant: "destructive" });
      } else {
        toast({ title: "Проверьте почту для подтверждения аккаунта" });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Неверный email или пароль", variant: "destructive" });
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in min-h-screen px-4 pt-14">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground tap-highlight"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>

      <h1 className="text-[26px] font-extrabold text-foreground">
        {mode === "signup" ? "Создать аккаунт" : mode === "forgot" ? "Сброс пароля" : "Войти"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signup"
          ? "Зарегистрируйтесь, чтобы сохранять прогресс"
          : mode === "forgot"
          ? "Введите email, и мы отправим ссылку для сброса"
          : "Войдите в свой аккаунт"}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="pl-10 rounded-xl border-0 bg-card shadow-card"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="pl-10 rounded-xl border-0 bg-card shadow-card"
            />
          </div>
        </div>

        {mode !== "forgot" && (
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
                className="pl-10 rounded-xl border-0 bg-card shadow-card"
              />
            </div>
          </div>
        )}

        {mode === "login" && (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="block text-sm font-medium text-sage tap-highlight"
          >
            Забыли пароль?
          </button>
        )}

        <Button type="submit" className="w-full rounded-full h-12 text-sm font-bold" disabled={loading}>
          {loading
            ? "Загрузка..."
            : mode === "signup"
            ? "Зарегистрироваться"
            : mode === "forgot"
            ? "Отправить ссылку"
            : "Войти"}
        </Button>
      </form>

      <button
        onClick={() => setMode(mode === "signup" ? "login" : mode === "forgot" ? "login" : "signup")}
        className="mt-6 w-full text-center text-sm text-muted-foreground"
      >
        {mode === "signup"
          ? "Уже есть аккаунт? "
          : mode === "forgot"
          ? "Вспомнили пароль? "
          : "Нет аккаунта? "}
        <span className="font-medium text-primary">
          {mode === "signup" ? "Войти" : mode === "forgot" ? "Войти" : "Зарегистрироваться"}
        </span>
      </button>
    </div>
  );
};

export default AuthPage;
