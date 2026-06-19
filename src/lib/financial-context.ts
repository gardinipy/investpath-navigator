import {
  Transaction,
  formatCurrency,
  getBalance,
  getByCategory,
  getCurrentMonthTransactions,
  getDailyLimit,
  getEndOfMonthProjection,
  getTotalByType,
} from "@/lib/financial-utils";

function getMonthlyTotals(
  transactions: Transaction[],
  monthsBack: number,
): { label: string; income: number; expense: number }[] {
  const now = new Date();
  const result: { label: string; income: number; expense: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return (
        td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
      );
    });
    const label = d.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
    result.push({
      label,
      income: getTotalByType(monthTx, "income"),
      expense: getTotalByType(monthTx, "expense"),
    });
  }

  return result;
}

export function buildFinancialContext(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return "O usuário ainda não possui transações registradas no app.";
  }

  const monthly = getCurrentMonthTransactions(transactions);
  const income = getTotalByType(monthly, "income");
  const expenses = getTotalByType(monthly, "expense");
  const balance = getBalance(monthly);
  const dailyLimit = getDailyLimit(balance);
  const categories = getByCategory(monthly);

  const avgDailySpend = expenses / Math.max(1, new Date().getDate());
  const projection = getEndOfMonthProjection(balance, avgDailySpend);

  const monthlyHistory = getMonthlyTotals(transactions, 6);
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  const lines: string[] = [
    `Data de referência: ${new Date().toLocaleDateString("pt-BR")}`,
    "",
    "=== RESUMO DO MÊS ATUAL ===",
    `Receitas: ${formatCurrency(income)}`,
    `Despesas: ${formatCurrency(expenses)}`,
    `Saldo do mês: ${formatCurrency(balance)}`,
    `Limite diário sugerido (para manter saldo positivo): ${formatCurrency(Math.max(0, dailyLimit))}`,
    `Projeção de saldo ao fim do mês: ${formatCurrency(projection)}`,
    "",
    "=== GASTOS POR CATEGORIA (mês atual) ===",
  ];

  if (categories.length === 0) {
    lines.push("Nenhuma despesa registrada neste mês.");
  } else {
    categories.forEach((c, i) => {
      const pct = expenses > 0 ? ((c.total / expenses) * 100).toFixed(1) : "0";
      lines.push(
        `${i + 1}. ${c.category}: ${formatCurrency(c.total)} (${pct}% das despesas)`,
      );
    });
  }

  lines.push("", "=== HISTÓRICO (últimos 6 meses) ===");
  monthlyHistory.forEach((m) => {
    lines.push(
      `${m.label}: receitas ${formatCurrency(m.income)}, despesas ${formatCurrency(m.expense)}, saldo ${formatCurrency(m.income - m.expense)}`,
    );
  });

  lines.push("", "=== TRANSAÇÕES RECENTES (até 15) ===");
  recent.forEach((t) => {
    const d = new Date(t.date).toLocaleDateString("pt-BR");
    const sign = t.type === "income" ? "+" : "-";
    lines.push(
      `${d} | ${t.type === "income" ? "Receita" : "Despesa"} | ${t.category} | ${sign}${formatCurrency(t.value)} | ${t.description}`,
    );
  });

  lines.push(
    "",
    "Use estes dados para responder perguntas personalizadas sobre onde o usuário gasta mais, o que economizar, tendências e organização do orçamento.",
  );

  return lines.join("\n");
}
