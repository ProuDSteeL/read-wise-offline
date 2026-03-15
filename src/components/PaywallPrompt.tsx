import { useState } from "react";
import { Crown, BookOpen, Headphones, Download, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PaywallPromptProps {
  message?: string;
  inline?: boolean;
}

const benefits = [
  { icon: BookOpen, text: "Безлимитные саммари" },
  { icon: Headphones, text: "Аудиоверсии всех книг" },
  { icon: Download, text: "Офлайн-загрузки" },
  { icon: Highlighter, text: "Безлимитные выделения и заметки" },
];

const PaywallPrompt = ({ message, inline }: PaywallPromptProps) => {
  const [showDialog, setShowDialog] = useState(false);

  const content = (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-light">
        <Crown className="h-7 w-7 text-sage" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">
          {message || "Оформите подписку Pro"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Получите полный доступ ко всем саммари и функциям
        </p>
      </div>
      <div className="w-full space-y-2.5 text-left">
        {benefits.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0 text-sage" />
            <span className="text-sm text-foreground">{text}</span>
          </div>
        ))}
      </div>
      <Button
        className="mt-2 w-full rounded-full h-12 text-sm font-bold"
        onClick={() => setShowDialog(true)}
      >
        Подписаться — от 299 р/мес
      </Button>
    </div>
  );

  if (inline) {
    return (
      <>
        <div className="mx-4 my-6 rounded-2xl bg-card p-6 shadow-card">
          {content}
        </div>
        <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-elevated">
          {content}
        </div>
      </div>
      <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
};

const SubscriptionDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="rounded-2xl">
      <DialogHeader>
        <DialogTitle className="text-center text-lg font-bold">
          Подписка Pro
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-3">
          {[
            { label: "Месяц", price: "299 р/мес", sub: "Отменить в любой момент" },
            { label: "Год", price: "1 990 р/год", sub: "Экономия 60%" },
          ].map((plan) => (
            <div
              key={plan.label}
              className="rounded-xl border border-border p-4"
            >
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
        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={() => onOpenChange(false)}
        >
          Закрыть
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default PaywallPrompt;
