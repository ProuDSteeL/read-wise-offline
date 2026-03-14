import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Проверьте почту для подтверждения аккаунта");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("Неверный email или пароль");
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in min-h-screen px-4 pt-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground tap-highlight"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>

      <h1 className="text-2xl font-bold text-foreground">
        {isSignUp ? "Создать аккаунт" : "Войти"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSignUp
          ? "Зарегистрируйтесь, чтобы сохранять прогресс"
          : "Войдите в свой аккаунт"}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="pl-10 rounded-xl border-0 bg-secondary"
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
              className="pl-10 rounded-xl border-0 bg-secondary"
            />
          </div>
        </div>

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
              className="pl-10 rounded-xl border-0 bg-secondary"
            />
          </div>
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Загрузка..." : isSignUp ? "Зарегистрироваться" : "Войти"}
        </Button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-6 w-full text-center text-sm text-muted-foreground"
      >
        {isSignUp ? "Уже есть аккаунт? " : "Нет аккаунта? "}
        <span className="font-medium text-primary">
          {isSignUp ? "Войти" : "Зарегистрироваться"}
        </span>
      </button>
    </div>
  );
};

export default AuthPage;
