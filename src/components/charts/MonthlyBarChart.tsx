import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/financial-utils";

export default function MonthlyBarChart() {
  const { transactions } = useFinance();
  const now = new Date();

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === month && td.getFullYear() === year;
    });
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.value, 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.value, 0);
    data.push({ month: monthNames[month], receitas: income, despesas: expense });
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-semibold mb-4">Receitas vs Despesas</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
          <XAxis dataKey="month" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} axisLine={{ stroke: "hsl(220, 14%, 16%)" }} />
          <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={{ stroke: "hsl(220, 14%, 16%)" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 20%)", borderRadius: "8px", color: "hsl(210, 20%, 92%)" }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend wrapperStyle={{ color: "hsl(210, 20%, 80%)", fontSize: 12 }} />
          <Bar dataKey="receitas" fill="hsl(152, 60%, 48%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
