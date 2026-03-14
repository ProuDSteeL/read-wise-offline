import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SearchPage = () => {
  return (
    <div className="animate-fade-in space-y-6 px-4 pt-12">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Поиск</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Название, автор или тема..."
          className="pl-10 rounded-xl bg-secondary border-0"
        />
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Введите запрос, чтобы найти саммари
        </p>
      </div>
    </div>
  );
};

export default SearchPage;
