import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getByCategory, formatCurrency, CATEGORY_COLORS } from "@/lib/financial-utils";
import { useFinance } from "@/contexts/FinanceContext";
import { getCurrentMonthTransactions } from "@/lib/financial-utils";

export default function ExpensePieChart() {
  const { transactions } = useFinance();
  const monthly = getCurrentMonthTransactions(transactions);
  const data = getByCategory(monthly);

  if (data.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Sem despesas este mês</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-semibold mb-4">Gastos por Categoria</h3>
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              strokeWidth={2}
              stroke="hsl(220, 20%, 7%)"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[entry.category] || "hsl(215, 12%, 50%)"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 12%)",
                border: "1px solid hsl(220, 14%, 20%)",
                borderRadius: "8px",
                color: "hsl(210, 20%, 92%)",
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 min-w-[140px]">
          {data.map((entry) => (
            <div key={entry.category} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[entry.category] || "hsl(215, 12%, 50%)" }}
              />
              <span className="text-muted-foreground truncate">{entry.category}</span>
              <span className="ml-auto font-medium text-foreground">{formatCurrency(entry.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
