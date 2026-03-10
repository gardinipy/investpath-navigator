import { useFinance } from "@/contexts/FinanceContext";
import {
  getCurrentMonthTransactions,
  getTotalByType,
  getBalance,
  getDailyLimit,
  formatCurrency,
} from "@/lib/financial-utils";
import StatCard from "@/components/StatCard";
import ExpensePieChart from "@/components/charts/ExpensePieChart";
import BalanceLineChart from "@/components/charts/BalanceLineChart";
import MonthlyBarChart from "@/components/charts/MonthlyBarChart";
import TransactionList from "@/components/TransactionList";
import { Wallet, TrendingUp, TrendingDown, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { transactions } = useFinance();
  const monthly = getCurrentMonthTransactions(transactions);
  const income = getTotalByType(monthly, "income");
  const expenses = getTotalByType(monthly, "expense");
  const balance = getBalance(monthly);
  const dailyLimit = getDailyLimit(balance);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral das suas finanças</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Saldo do mês" value={formatCurrency(balance)} icon={Wallet} trend={balance >= 0 ? "up" : "down"} delay={0} />
        <StatCard title="Receitas" value={formatCurrency(income)} icon={TrendingUp} trend="up" delay={0.05} />
        <StatCard title="Despesas" value={formatCurrency(expenses)} icon={TrendingDown} trend="down" delay={0.1} />
        <StatCard title="Limite diário" value={formatCurrency(Math.max(0, dailyLimit))} subtitle="para manter saldo positivo" icon={CalendarClock} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <BalanceLineChart />
        <ExpensePieChart />
      </div>

      <MonthlyBarChart />

      {/* Recent transactions */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold mb-4">Transações Recentes</h3>
        <TransactionList limit={8} />
      </div>
    </div>
  );
}
