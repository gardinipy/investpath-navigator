import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import {
  getCurrentMonthTransactions,
  getTotalByType,
  getBalance,
  getDailyLimit,
  getEndOfMonthProjection,
  formatCurrency,
} from "@/lib/financial-utils";
import { Slider } from "@/components/ui/slider";
import StatCard from "@/components/StatCard";
import { PiggyBank, CalendarClock, Target, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function BudgetPage() {
  const { transactions } = useFinance();
  const monthly = getCurrentMonthTransactions(transactions);
  const income = getTotalByType(monthly, "income");
  const expenses = getTotalByType(monthly, "expense");
  const balance = getBalance(monthly);
  const dailyLimit = getDailyLimit(balance);

  const now = new Date();
  const daysPassed = now.getDate();
  const avgDailySpend = daysPassed > 0 ? expenses / daysPassed : 0;
  const projection = getEndOfMonthProjection(balance, avgDailySpend);

  const [cutPercent, setCutPercent] = useState(10);
  const reducedExpenses = expenses * (1 - cutPercent / 100);
  const potentialSavings = expenses - reducedExpenses;
  const newProjection = income - reducedExpenses - (avgDailySpend * (1 - cutPercent / 100) * (new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Orçamento Inteligente</h1>
        <p className="text-muted-foreground text-sm">Calcule limites e projete seu saldo</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Saldo atual" value={formatCurrency(balance)} icon={PiggyBank} trend={balance >= 0 ? "up" : "down"} delay={0} />
        <StatCard title="Limite diário" value={formatCurrency(Math.max(0, dailyLimit))} icon={CalendarClock} delay={0.05} />
        <StatCard title="Gasto médio/dia" value={formatCurrency(avgDailySpend)} icon={TrendingDown} trend="down" delay={0.1} />
        <StatCard
          title="Projeção fim do mês"
          value={formatCurrency(projection)}
          icon={Target}
          trend={projection >= 0 ? "up" : "down"}
          delay={0.15}
        />
      </div>

      {/* Simulator */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="font-heading font-semibold mb-2">Simulação de Economia</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Se eu reduzir meus gastos em <span className="text-primary font-semibold">{cutPercent}%</span>, quanto sobra no final do mês?
        </p>

        <Slider
          value={[cutPercent]}
          onValueChange={(v) => setCutPercent(v[0])}
          min={0}
          max={50}
          step={1}
          className="mb-8"
        />

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Gastos reduzidos</p>
            <p className="text-lg font-heading font-bold text-foreground">{formatCurrency(reducedExpenses)}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Economia potencial</p>
            <p className="text-lg font-heading font-bold text-primary">{formatCurrency(potentialSavings)}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Nova projeção</p>
            <p className={`text-lg font-heading font-bold ${newProjection >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(newProjection)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Budget breakdown */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold mb-4">Resumo do Mês</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total de receitas</span>
            <span className="text-sm font-semibold text-primary">{formatCurrency(income)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total de despesas</span>
            <span className="text-sm font-semibold text-destructive">{formatCurrency(expenses)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-sm font-medium">Saldo</span>
            <span className={`text-sm font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(balance)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Taxa de poupança</span>
            <span className="text-sm font-semibold">
              {income > 0 ? `${Math.round((balance / income) * 100)}%` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
