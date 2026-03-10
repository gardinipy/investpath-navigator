export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  value: number;
  category: string;
  type: TransactionType;
  description: string;
  date: string;
  // Novos campos para gerir recorrência e salários
  isRecurring?: boolean;
  recurringFrequency?: "monthly" | "biweekly"; // Mensal ou Quinzenal
  salaryReceiptType?: "fixed" | "business_day"; // Data Fixa ou Dia Útil
  salaryBusinessDay?: number; // Ex: 5 (para 5º dia útil)
}

export const INCOME_CATEGORIES = [
  "Salário",
  "Freelance",
  "Investimentos",
  "Outros",
] as const;

export const EXPENSE_CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Vestuário",
  "Assinaturas",
  "Outros",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "hsl(35, 90%, 55%)",
  Moradia: "hsl(200, 70%, 55%)",
  Transporte: "hsl(280, 60%, 60%)",
  Saúde: "hsl(340, 65%, 55%)",
  Educação: "hsl(152, 60%, 48%)",
  Lazer: "hsl(45, 85%, 55%)",
  Vestuário: "hsl(310, 55%, 55%)",
  Assinaturas: "hsl(170, 50%, 50%)",
  Outros: "hsl(215, 12%, 50%)",
  Salário: "hsl(152, 60%, 48%)",
  Freelance: "hsl(200, 70%, 55%)",
  Investimentos: "hsl(280, 60%, 60%)",
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

// NOVA FUNÇÃO: Calcula o "Nº" dia útil de um dado mês/ano
export function getBusinessDay(
  year: number,
  month: number,
  targetBusinessDay: number,
): Date {
  let day = 1;
  let businessDays = 0;

  while (true) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0 = Domingo, 6 = Sábado

    // Se não for fim de semana, conta como dia útil
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }

    if (businessDays === targetBusinessDay) {
      return d;
    }

    day++;
  }
}

export function getCurrentMonthTransactions(
  transactions: Transaction[],
): Transaction[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

export function getTotalByType(
  transactions: Transaction[],
  type: TransactionType,
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.value, 0);
}

export function getBalance(transactions: Transaction[]): number {
  return transactions.reduce(
    (sum, t) => (t.type === "income" ? sum + t.value : sum - t.value),
    0,
  );
}

export function getByCategory(
  transactions: Transaction[],
): { category: string; total: number }[] {
  const map: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.value;
    });
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function getDailyLimit(balance: number): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = lastDay - now.getDate() + 1;
  return remainingDays > 0 ? balance / remainingDays : 0;
}

export function getEndOfMonthProjection(
  currentBalance: number,
  avgDailySpend: number,
): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = lastDay - now.getDate();
  return currentBalance - avgDailySpend * remainingDays;
}

export function compoundInterest(
  principal: number,
  monthlyRate: number,
  months: number,
  monthlyContribution: number,
): { month: number; total: number }[] {
  const data: { month: number; total: number }[] = [];
  let total = principal;
  for (let i = 0; i <= months; i++) {
    data.push({ month: i, total: Math.round(total * 100) / 100 });
    total = (total + monthlyContribution) * (1 + monthlyRate / 100);
  }
  return data;
}

// Demo data generator
export function generateDemoTransactions(): Transaction[] {
  const now = new Date();
  const transactions: Transaction[] = [];
  const id = () => Math.random().toString(36).substring(2, 9);

  // Current month income
  transactions.push({
    id: id(),
    value: 5500,
    category: "Salário",
    type: "income",
    description: "Salário mensal",
    date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
    isRecurring: true,
    recurringFrequency: "monthly",
    salaryReceiptType: "business_day",
    salaryBusinessDay: 5,
  });
  transactions.push({
    id: id(),
    value: 1200,
    category: "Freelance",
    type: "income",
    description: "Projeto web",
    date: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(),
  });

  // Expenses
  const expenses = [
    {
      value: 1800,
      category: "Moradia",
      desc: "Aluguel",
      day: 5,
      recurring: true,
    },
    {
      value: 850,
      category: "Alimentação",
      desc: "Supermercado",
      day: 7,
      recurring: false,
    },
    {
      value: 350,
      category: "Transporte",
      desc: "Combustível e transporte",
      day: 3,
      recurring: false,
    },
    {
      value: 200,
      category: "Saúde",
      desc: "Plano de saúde",
      day: 10,
      recurring: true,
    },
  ];

  expenses.forEach((e) => {
    transactions.push({
      id: id(),
      value: e.value,
      category: e.category as any,
      type: "expense",
      description: e.desc,
      date: new Date(
        now.getFullYear(),
        now.getMonth(),
        Math.min(e.day, now.getDate()),
      ).toISOString(),
      isRecurring: e.recurring,
      recurringFrequency: e.recurring ? "monthly" : undefined,
    });
  });

  return transactions;
}
