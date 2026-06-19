import { useRef, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import {
  parseImportFile,
  parsedToTransactions,
  type ParsedTransaction,
} from "@/lib/transaction-import";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileUp, Loader2, Upload } from "lucide-react";

const ACCEPTED_FORMATS = ".csv,.pdf,.ofx,.qfx,.qif,.txt";

export default function TransactionImport() {
  const { importTransactions } = useFinance();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    setIsParsing(true);
    try {
      const result = await parseImportFile(file);
      setPreview(result.transactions);
      setWarnings(result.warnings);
      setSkipped(result.skipped);
      setFileName(file.name);

      if (result.transactions.length === 0) {
        toast.error(
          result.warnings[0] ?? "Nenhuma transação encontrada no arquivo.",
        );
        return;
      }

      setPreviewOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar arquivo.",
      );
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const confirmImport = () => {
    importTransactions(parsedToTransactions(preview));
    toast.success(`${preview.length} transação(ões) importada(s) com sucesso!`);
    setPreviewOpen(false);
    setPreview([]);
  };

  return (
    <>
      <div className="glass-card p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Importar extrato</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Importe gastos e receitas de extratos bancários. Formatos
              suportados: CSV, PDF, OFX/QFX e QIF.
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FORMATS}
          onChange={onInputChange}
          className="hidden"
        />

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={isParsing}
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processando arquivo...
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" /> Selecionar arquivo
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          Bancos como Nubank, Itaú, Bradesco e Santander costumam exportar em
          CSV ou OFX. PDFs funcionam, mas CSV/OFX são mais precisos.
        </p>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirmar importação</DialogTitle>
            <DialogDescription>
              {preview.length} transação(ões) encontrada(s) em{" "}
              <strong>{fileName}</strong>
              {skipped > 0 && ` (${skipped} linha(s) ignorada(s))`}
            </DialogDescription>
          </DialogHeader>

          {warnings.length > 0 && (
            <div className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              {warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}

          <div className="overflow-y-auto flex-1 space-y-2 min-h-0">
            {preview.slice(0, 20).map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.date)} · {t.category}
                  </p>
                </div>
                <span
                  className={
                    t.type === "income" ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.value)}
                </span>
              </div>
            ))}
            {preview.length > 20 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                ... e mais {preview.length - 20} transação(ões)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmImport}>
              Importar {preview.length} transação(ões)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
