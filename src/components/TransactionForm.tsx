import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TransactionType,
  getBusinessDay,
} from "@/lib/financial-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function TransactionForm() {
  const { addTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>("expense");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Novos states para as configurações avançadas
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    "monthly" | "biweekly"
  >("monthly");
  const [salaryReceiptType, setSalaryReceiptType] = useState<
    "fixed" | "business_day"
  >("fixed");
  const [salaryBusinessDay, setSalaryBusinessDay] = useState("5");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (!numValue || numValue <= 0 || !category || !description.trim()) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    let finalDate = date;

    // Se for Salário e "Dia Útil", calcula a data exata do mês atual
    if (category === "Salário" && salaryReceiptType === "business_day") {
      const now = new Date();
      const targetDay = parseInt(salaryBusinessDay) || 5;
      const calculatedDate = getBusinessDay(
        now.getFullYear(),
        now.getMonth(),
        targetDay,
      );
      finalDate = calculatedDate.toISOString().split("T")[0];
    }

    // Correção da data: Força o fuso horário local
    const [year, month, day] = finalDate.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));

    // Define se é recorrente. Se for salário, assume-se sempre como recorrente
    const transactionIsRecurring = category === "Salário" ? true : isRecurring;

    addTransaction({
      value: numValue,
      category,
      type,
      description: description.trim(),
      date: localDate.toISOString(),
      isRecurring: transactionIsRecurring,
      recurringFrequency: transactionIsRecurring
        ? recurringFrequency
        : undefined,
      salaryReceiptType: category === "Salário" ? salaryReceiptType : undefined,
      salaryBusinessDay:
        category === "Salário" && salaryReceiptType === "business_day"
          ? parseInt(salaryBusinessDay)
          : undefined,
    });

    toast.success(
      type === "income" ? "Receita adicionada!" : "Despesa adicionada!",
    );

    // Limpa o formulário
    setValue("");
    setCategory("");
    setDescription("");
    setIsRecurring(false);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <h3 className="font-heading font-semibold mb-4">Nova Transação</h3>

      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={type === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setType("income");
            setCategory("");
            setIsRecurring(false);
          }}
          className={
            type === "income" ? "bg-primary text-primary-foreground" : ""
          }
        >
          Receita
        </Button>
        <Button
          type="button"
          variant={type === "expense" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setType("expense");
            setCategory("");
            setIsRecurring(false);
          }}
          className={
            type === "expense"
              ? "bg-destructive text-destructive-foreground"
              : ""
          }
        >
          Despesa
        </Button>
      </div>

      <div className="grid gap-3">
        <Input
          type="number"
          placeholder="Valor (R$)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min="0.01"
          step="0.01"
          className="bg-input border-border"
        />

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* CONFIGURAÇÕES ESPECIAIS DE SALÁRIO */}
        {category === "Salário" && (
          <div className="p-4 border border-border rounded-md bg-secondary/30 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Configurações de Recebimento
            </p>

            <Select
              value={salaryReceiptType}
              onValueChange={(v: any) => setSalaryReceiptType(v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Tipo de Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Data Fixa Mensal</SelectItem>
                <SelectItem value="business_day">Dia Útil do Mês</SelectItem>
              </SelectContent>
            </Select>

            {salaryReceiptType === "business_day" && (
              <Input
                type="number"
                min="1"
                max="20"
                placeholder="Qual dia útil? (ex: 5)"
                value={salaryBusinessDay}
                onChange={(e) => setSalaryBusinessDay(e.target.value)}
                className="bg-input border-border"
              />
            )}

            <Select
              value={recurringFrequency}
              onValueChange={(v: any) => setRecurringFrequency(v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">
                  Pagamento Único (Mensal)
                </SelectItem>
                <SelectItem value="biweekly">
                  Quinzenal (Adiantamento + Salário)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Input
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
          className="bg-input border-border"
        />

        {/* Só mostra o calendário normal se NÃO for Salário por Dia Útil */}
        {!(category === "Salário" && salaryReceiptType === "business_day") && (
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-input border-border"
          />
        )}

        {/* OPÇÃO DE RECORRÊNCIA PARA DESPESAS */}
        {type === "expense" && (
          <label className="flex items-center gap-2 mt-1 text-sm cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-border w-4 h-4 accent-primary"
            />
            Marcar como despesa fixa mensal
          </label>
        )}

        <Button type="submit" className="w-full gap-2 mt-2">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>
    </form>
  );
}
