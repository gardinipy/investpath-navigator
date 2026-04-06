import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Wallet } from "lucide-react";

export default function SimulatorPage() {
  const balance = 1500.0;

  const [assetName, setAssetName] = useState("MXRF11");
  const [assetPrice, setAssetPrice] = useState<number>(10.5);
  const [dividend, setDividend] = useState<number>(0.11);

  const maxShares = Math.floor(balance / assetPrice);
  const totalInvested = maxShares * assetPrice;
  const projectedIncome = maxShares * dividend;
  const remainingBalance = balance - totalInvested;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Simulador de Investimentos
        </h1>
        <p className="text-muted-foreground">
          Veja quanto o seu saldo atual pode comprar de FIIs ou Ações e a
          projeção de rendimento.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Calculator className="h-5 w-5 text-teal-400" />
              Configurar Ativo
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Insira os dados para o cálculo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset" className="text-zinc-300">
                Código do Ativo
              </Label>
              <Input
                id="asset"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value.toUpperCase())}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-zinc-300">
                Preço Atual (R$)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={assetPrice}
                onChange={(e) => setAssetPrice(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dividend" className="text-zinc-300">
                Dividendo Último Mês (R$)
              </Label>
              <Input
                id="dividend"
                type="number"
                step="0.01"
                value={dividend}
                onChange={(e) => setDividend(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-400">
              <TrendingUp className="h-5 w-5" />
              Projeção de Rendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-700 pb-4">
              <div className="flex items-center gap-2 text-zinc-300">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Seu Saldo Disponível:</span>
              </div>
              <span className="text-xl font-bold text-zinc-100">
                R$ {balance.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Poder de Compra:</span>
                <span className="font-medium text-zinc-100">
                  {maxShares} cotas de {assetName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Investido:</span>
                <span className="font-medium text-zinc-100">
                  R$ {totalInvested.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Troco na Conta:</span>
                <span className="font-medium text-zinc-100">
                  R$ {remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-700">
              <div className="flex justify-between items-center bg-teal-950/20 p-4 rounded-lg">
                <span className="font-semibold text-teal-400">
                  Ganhos Projetados:
                </span>
                <span className="text-2xl font-extrabold text-teal-400">
                  + R$ {projectedIncome.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
