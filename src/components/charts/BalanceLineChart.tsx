import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/financial-utils";

export default function BalanceLineChart() {
  const { transactions } = useFinance();

  // Build daily balance over last 30 days
  const now = new Date();
  const days: { date: string; balance: number }[] = [];
  let runningBalance = 0;

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = `${d.getDate()}/${d.getMonth() + 1}`;

    const dayTx = sorted.filter(
      (t) => new Date(t.date).toISOString().split("T")[0] <= dateStr
    );
    runningBalance = dayTx.reduce(
      (sum, t) => (t.type === "income" ? sum + t.value : sum - t.value),
      0
    );

    days.push({ date: label, balance: runningBalance });
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-semibold mb-4">Evolução do Saldo (30 dias)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }}
            axisLine={{ stroke: "hsl(220, 14%, 16%)" }}
          />
          <YAxis
            tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }}
            axisLine={{ stroke: "hsl(220, 14%, 16%)" }}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 18%, 12%)",
              border: "1px solid hsl(220, 14%, 20%)",
              borderRadius: "8px",
              color: "hsl(210, 20%, 92%)",
            }}
            formatter={(value: number) => [formatCurrency(value), "Saldo"]}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="hsl(152, 60%, 48%)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "hsl(152, 60%, 48%)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
