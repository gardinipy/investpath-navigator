import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Building2,
  Calculator,
  LineChart,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import {
  getCurrentMonthTransactions,
  getBalance,
} from "@/lib/financial-utils";
import { useMarketAsset } from "@/hooks/useMarketAsset";
import {
  calculatePurchaseSimulation,
  getPreviousMonthLabel,
  MARKET_ASSETS,
} from "@/lib/market-data";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { Button } from "@/components/ui/button";

const DEFAULT_SYMBOL = "MXRF11";

export default function SimulatorPage() {
  const { transactions } = useFinance();
  const monthlyTransactions = getCurrentMonthTransactions(transactions);
  const defaultBalance = Math.max(0, getBalance(monthlyTransactions));

  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [availableBalance, setAvailableBalance] = useState(defaultBalance);
  const [balanceTouched, setBalanceTouched] = useState(false);

  const { data: quote, isLoading, isError, error, refetch, isFetching } =
    useMarketAsset(selectedSymbol);

  useEffect(() => {
    if (!balanceTouched) {
      setAvailableBalance(defaultBalance);
    }
  }, [defaultBalance, balanceTouched]);

  const simulation = useMemo(() => {
    if (!quote) {
      return {
        maxShares: 0,
        totalInvested: 0,
        projectedIncome: 0,
        remainingBalance: availableBalance,
      };
    }

    return calculatePurchaseSimulation(
      availableBalance,
      quote.currentPrice,
      quote.lastMonthDividend,
    );
  }, [availableBalance, quote]);

  const fiiAssets = MARKET_ASSETS.filter((asset) => asset.type === "fii");
  const stockAssets = MARKET_ASSETS.filter((asset) => asset.type === "stock");
  const selectedAsset = MARKET_ASSETS.find(
    (asset) => asset.symbol === selectedSymbol,
  );
  const previousMonthLabel = getPreviousMonthLabel();

  const handleAssetTypeChange = (type: string) => {
    const nextAsset =
      type === "fii" ? fiiAssets[0] : stockAssets[0];
    if (nextAsset) setSelectedSymbol(nextAsset.symbol);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Simulador de Investimentos
        </h1>
        <p className="text-muted-foreground">
          Simule compras com cotações atualizadas, média de 12 meses e
          projeção de rendimento com base no último pagamento do mês anterior.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Calculator className="h-5 w-5 text-teal-400" />
              Escolher Ativo
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Dados obtidos em tempo real via mercado brasileiro (B3)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs
              value={selectedAsset?.type ?? "fii"}
              onValueChange={handleAssetTypeChange}
            >
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                <TabsTrigger value="fii" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  FIIs
                </TabsTrigger>
                <TabsTrigger value="stock" className="gap-2">
                  <LineChart className="h-4 w-4" />
                  Ações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fii" className="mt-4">
                <AssetSelect
                  assets={fiiAssets}
                  value={selectedSymbol}
                  onValueChange={setSelectedSymbol}
                />
              </TabsContent>

              <TabsContent value="stock" className="mt-4">
                <AssetSelect
                  assets={stockAssets}
                  value={selectedSymbol}
                  onValueChange={setSelectedSymbol}
                />
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="balance" className="text-zinc-300">
                Saldo disponível para investir
              </Label>
              <Input
                id="balance"
                type="number"
                min={0}
                step="0.01"
                value={availableBalance}
                onChange={(e) => {
                  setBalanceTouched(true);
                  setAvailableBalance(Math.max(0, Number(e.target.value)));
                }}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
              <p className="text-xs text-zinc-500">
                Padrão: saldo do mês atual ({formatCurrency(defaultBalance)}). Você
                pode reduzir se não quiser investir tudo.
              </p>
            </div>

            {isLoading ? (
              <AssetDataSkeleton />
            ) : isError ? (
              <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 space-y-3">
                <div className="flex items-start gap-2 text-red-300">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Erro ao carregar cotação</p>
                    <p className="text-sm text-red-200/80">
                      {error instanceof Error
                        ? error.message
                        : "Tente novamente em instantes."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="border-zinc-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            ) : quote ? (
              <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-100">{quote.symbol}</p>
                    <p className="text-sm text-zinc-400">{quote.name}</p>
                  </div>
                  <Badge variant="outline" className="border-teal-700 text-teal-300">
                    {quote.type === "fii" ? "FII" : "Ação"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DataItem
                    label="Preço atual"
                    value={formatCurrency(quote.currentPrice)}
                    highlight
                  />
                  <DataItem
                    label="Média 12 meses"
                    value={formatCurrency(quote.avgPrice12m)}
                  />
                  <DataItem
                    label={`Último pagamento (${previousMonthLabel})`}
                    value={
                      quote.lastMonthDividend > 0
                        ? formatCurrency(quote.lastMonthDividend)
                        : "Sem registro"
                    }
                  />
                  <DataItem
                    label="DY 12 meses"
                    value={`${quote.dividendYield12m.toFixed(2)}%`}
                  />
                </div>

                <p className="text-xs text-zinc-500">
                  Consulta em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(quote.consultedAt))}
                  {quote.lastDividendDate &&
                    ` · Último provento em ${formatDate(quote.lastDividendDate)}`}
                  {isFetching && " · Atualizando..."}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-400">
              <TrendingUp className="h-5 w-5" />
              Projeção de Rendimento
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Estimativa com base no último provento pago no mês anterior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-700 pb-4">
              <div className="flex items-center gap-2 text-zinc-300">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Saldo para simulação:</span>
              </div>
              <span className="text-xl font-bold text-zinc-100">
                {formatCurrency(availableBalance)}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full bg-zinc-800" />
                <Skeleton className="h-5 w-full bg-zinc-800" />
                <Skeleton className="h-5 w-full bg-zinc-800" />
              </div>
            ) : quote ? (
              <>
                <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-4 text-sm leading-relaxed text-zinc-300">
                  Com{" "}
                  <strong className="text-zinc-100">
                    {formatCurrency(availableBalance)}
                  </strong>{" "}
                  disponíveis, você consegue comprar{" "}
                  <strong className="text-teal-300">
                    {simulation.maxShares} cotas
                  </strong>{" "}
                  de <strong className="text-zinc-100">{quote.symbol}</strong> a{" "}
                  {formatCurrency(quote.currentPrice)} cada. Com base no provento de{" "}
                  <strong className="text-zinc-100">
                    {formatCurrency(quote.lastMonthDividend)}
                  </strong>{" "}
                  por cota pago em {previousMonthLabel}, a projeção para o mês
                  seguinte é de{" "}
                  <strong className="text-teal-300">
                    {formatCurrency(simulation.projectedIncome)}
                  </strong>
                  .
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Poder de compra:</span>
                    <span className="font-medium text-zinc-100">
                      {simulation.maxShares} cotas de {quote.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor investido:</span>
                    <span className="font-medium text-zinc-100">
                      {formatCurrency(simulation.totalInvested)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Troco na conta:</span>
                    <span className="font-medium text-zinc-100">
                      {formatCurrency(simulation.remainingBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Provento por cota ({previousMonthLabel}):
                    </span>
                    <span className="font-medium text-zinc-100">
                      {quote.lastMonthDividend > 0
                        ? formatCurrency(quote.lastMonthDividend)
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-700">
                  <div className="flex justify-between items-center bg-teal-950/20 p-4 rounded-lg">
                    <span className="font-semibold text-teal-400">
                      Retorno projetado (mês seguinte):
                    </span>
                    <span className="text-2xl font-extrabold text-teal-400">
                      + {formatCurrency(simulation.projectedIncome)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-3">
                    Projeção educativa: assume que o próximo pagamento repetirá
                    o valor do mês anterior. Dividendos passados não garantem
                    rendimentos futuros.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                Selecione um ativo para ver a simulação.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AssetSelect({
  assets,
  value,
  onValueChange,
}: {
  assets: typeof MARKET_ASSETS;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
        <SelectValue placeholder="Selecione um ativo" />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
        <SelectGroup>
          <SelectLabel>Ativos disponíveis</SelectLabel>
          {assets.map((asset) => (
            <SelectItem key={asset.symbol} value={asset.symbol}>
              {asset.symbol} — {asset.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function DataItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md bg-zinc-900/80 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`font-semibold ${
          highlight ? "text-teal-300 text-lg" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AssetDataSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <Skeleton className="h-5 w-32 bg-zinc-800" />
      <Skeleton className="h-4 w-full bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 bg-zinc-800" />
        <Skeleton className="h-16 bg-zinc-800" />
        <Skeleton className="h-16 bg-zinc-800" />
        <Skeleton className="h-16 bg-zinc-800" />
      </div>
    </div>
  );
}
