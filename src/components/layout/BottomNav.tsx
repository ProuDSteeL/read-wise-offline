import { Home, Search, BookOpen, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/shelves", icon: BookOpen, label: "Полки" },
  { to: "/profile", icon: User, label: "Профиль" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass safe-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around py-1.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-0.5 px-4 py-1.5 text-[11px] font-medium transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.6} />
                </div>
                <span className={cn(
                  "transition-opacity",
                  isActive ? "opacity-100" : "opacity-60"
                )}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
