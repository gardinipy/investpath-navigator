import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import TransactionImport from "@/components/TransactionImport";
import { motion } from "framer-motion";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Transações</h1>
        <p className="text-muted-foreground text-sm">Registre, importe e gerencie receitas e despesas</p>
      </motion.div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-6">
          <TransactionForm />
          <TransactionImport />
        </div>
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold mb-4">Histórico</h3>
          <TransactionList showDelete />
        </div>
      </div>
    </div>
  );
}
