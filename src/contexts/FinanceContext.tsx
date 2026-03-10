import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  Transaction,
  generateDemoTransactions,
  getBusinessDay,
} from "@/lib/financial-utils";

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const STORAGE_KEY = "meu_investpath_transacoes";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Erro ao ler do localStorage", error);
    }

    return typeof generateDemoTransactions === "function"
      ? generateDemoTransactions()
      : generateDemoTransactions;
  });

  // Salva no localStorage sempre que a lista de transações mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Erro ao salvar no localStorage", error);
    }
  }, [transactions]);

  // AUTOMATIZAÇÃO INTELIGENTE: Verifica recorrências individualmente
  useEffect(() => {
    if (transactions.length === 0) return;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const recurringTransactions = transactions.filter((t) => t.isRecurring);

    if (recurringTransactions.length > 0) {
      const newTransactions: Transaction[] = [];

      recurringTransactions.forEach((t) => {
        const originalDate = new Date(t.date);

        // 1. Se a transação for deste mês ou de um mês futuro, não precisamos gerar cópia
        if (
          originalDate.getFullYear() > currentYear ||
          (originalDate.getFullYear() === currentYear &&
            originalDate.getMonth() >= currentMonth)
        ) {
          return;
        }

        // 2. Verifica se JÁ GERÁMOS esta transação específica neste mês
        const isBiweekly =
          t.category === "Salário" && t.recurringFrequency === "biweekly";
        const expectedValue = isBiweekly ? t.value / 2 : t.value;

        const alreadyGenerated = transactions.some((existing) => {
          const d = new Date(existing.date);
          return (
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear &&
            existing.description.includes(t.description) &&
            existing.value === expectedValue
          );
        });

        if (alreadyGenerated) return; // Se já gerou, salta para a próxima

        // 3. Calcula a nova data
        let newDateStr = t.date;
        if (
          t.category === "Salário" &&
          t.salaryReceiptType === "business_day" &&
          t.salaryBusinessDay
        ) {
          const newDate = getBusinessDay(
            today.getFullYear(),
            today.getMonth(),
            t.salaryBusinessDay,
          );
          newDateStr = newDate.toISOString();
        } else {
          const newDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            originalDate.getDate(),
          );
          newDateStr = newDate.toISOString();
        }

        // 4. Lógica para salário quinzenal (cria duas transações)
        if (isBiweekly) {
          const date1 = getBusinessDay(
            today.getFullYear(),
            today.getMonth(),
            5,
          );
          newTransactions.push({
            ...t,
            id: Math.random().toString(36).substring(2, 9),
            value: t.value / 2,
            date: date1.toISOString(),
            description: `${t.description} (1ª Quinzena)`,
          });

          const date2 = new Date(today.getFullYear(), today.getMonth(), 20);
          newTransactions.push({
            ...t,
            id: Math.random().toString(36).substring(2, 9),
            value: t.value / 2,
            date: date2.toISOString(),
            description: `${t.description} (2ª Quinzena)`,
          });
          return;
        }

        // 5. Adiciona a transação normal recorrente
        newTransactions.push({
          ...t,
          id: Math.random().toString(36).substring(2, 9),
          date: newDateStr,
        });
      });

      // Se encontrou transações novas para gerar, adiciona à lista
      if (newTransactions.length > 0) {
        setTransactions((prev) => [...newTransactions, ...prev]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // O array vazio faz com que corra apenas no refresh

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    setTransactions((prev) => [
      { ...t, id: Math.random().toString(36).substring(2, 9) },
      ...prev,
    ]);
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <FinanceContext.Provider
      value={{ transactions, addTransaction, removeTransaction }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
