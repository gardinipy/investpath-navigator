import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, formatDate, CATEGORY_COLORS } from "@/lib/financial-utils";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Props {
  limit?: number;
  showDelete?: boolean;
}

export default function TransactionList({ limit, showDelete = false }: Props) {
  const { transactions, removeTransaction } = useFinance();

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const items = limit ? sorted.slice(0, limit) : sorted;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${CATEGORY_COLORS[t.category] || "hsl(215,12%,50%)"}20` }}
            >
              {t.type === "income" ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.description}</p>
              <p className="text-xs text-muted-foreground">
                {t.category} · {formatDate(t.date)}
              </p>
            </div>
            <span className={`text-sm font-semibold ${t.type === "income" ? "text-primary" : "text-destructive"}`}>
              {t.type === "income" ? "+" : "-"}{formatCurrency(t.value)}
            </span>
            {showDelete && (
              <Button variant="ghost" size="icon" onClick={() => removeTransaction(t.id)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {items.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">Nenhuma transação encontrada</p>
      )}
    </div>
  );
}
