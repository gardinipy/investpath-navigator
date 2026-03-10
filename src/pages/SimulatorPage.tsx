import { useState } from "react";
import { compoundInterest, formatCurrency } from "@/lib/financial-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export default function SimulatorPage() {
  const [principal, setPrincipal] = useState(1000);
  const [monthly, setMonthly] = useState(500);
  const [rate, setRate] = useState(1);
  const [years, setYears] = useState(10);

  const months = years * 12;
  const data = compoundInterest(principal, rate, months, monthly);
  const totalInvested = principal + monthly * months;
  const finalValue = data[data.length - 1]?.total || 0;
  const totalReturn = finalValue - totalInvested;

  // Show yearly points only
  const chartData = data.filter((_, i) => i % 12 === 0 || i === data.length - 1).map((d) => ({
    ...d,
    label: `Ano ${Math.floor(d.month / 12)}`,
  }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Simulador de Investimentos</h1>
        <p className="text-muted-foreground text-sm">Juros compostos com aportes mensais</p>
      </motion.div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Inputs */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Valor inicial (R$)</Label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} min={0} className="bg-input border-border mt-1" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Aporte mensal (R$)</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} min={0} className="bg-input border-border mt-1" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Taxa mensal (%)</Label>
            <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} min={0} step={0.01} className="bg-input border-border mt-1" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Período (anos)</Label>
            <Input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} min={1} max={50} className="bg-input border-border mt-1" />
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total investido</span>
              <span className="font-medium">{formatCurrency(totalInvested)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rendimento</span>
              <span className="font-medium text-primary">{formatCurrency(totalReturn)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
              <span>Valor final</span>
              <span className="text-primary text-lg">{formatCurrency(finalValue)}</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold mb-4">Crescimento Patrimonial</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
              <XAxis dataKey="label" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={{ stroke: "hsl(220, 14%, 16%)" }} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={{ stroke: "hsl(220, 14%, 16%)" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 20%)", borderRadius: "8px", color: "hsl(210, 20%, 92%)" }}
                formatter={(value: number) => [formatCurrency(value), "Patrimônio"]}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(152, 60%, 48%)" strokeWidth={2.5} fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
