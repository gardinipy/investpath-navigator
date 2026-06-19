export type AssetType = "fii" | "stock";

export interface MarketAsset {
  symbol: string;
  name: string;
  type: AssetType;
}

export interface AssetQuote {
  symbol: string;
  name: string;
  type: AssetType;
  currentPrice: number;
  avgPrice12m: number;
  lastMonthDividend: number;
  lastDividendDate: string | null;
  dividendYield12m: number;
  consultedAt: string;
}

export const MARKET_ASSETS: MarketAsset[] = [
  { symbol: "MXRF11", name: "Maxi Renda FII", type: "fii" },
  { symbol: "HGLG11", name: "CSHG Logística FII", type: "fii" },
  { symbol: "XPLG11", name: "XP Log FII", type: "fii" },
  { symbol: "KNRI11", name: "Kinea Rendimentos FII", type: "fii" },
  { symbol: "BRCR11", name: "BTG Pactual Corporate FII", type: "fii" },
  { symbol: "VISC11", name: "Vinci Shopping FII", type: "fii" },
  { symbol: "HGRU11", name: "CSHG Renda Urbana FII", type: "fii" },
  { symbol: "XPML11", name: "XP Malls FII", type: "fii" },
  { symbol: "BCFF11", name: "BTG Pactual Fundo FII", type: "fii" },
  { symbol: "PETR4", name: "Petrobras PN", type: "stock" },
  { symbol: "VALE3", name: "Vale ON", type: "stock" },
  { symbol: "ITUB4", name: "Itaú Unibanco PN", type: "stock" },
  { symbol: "BBDC4", name: "Bradesco PN", type: "stock" },
  { symbol: "WEGE3", name: "WEG ON", type: "stock" },
  { symbol: "BBAS3", name: "Banco do Brasil ON", type: "stock" },
  { symbol: "MGLU3", name: "Magazine Luiza ON", type: "stock" },
];

interface YahooDividend {
  amount: number;
  date: number;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        longName?: string;
        shortName?: string;
        regularMarketPrice?: number;
        regularMarketTime?: number;
      };
      timestamp?: number[];
      events?: {
        dividends?: Record<string, YahooDividend>;
      };
      indicators: {
        quote: Array<{
          close?: Array<number | null>;
        }>;
      };
    }> | null;
    error: { description: string } | null;
  };
}

function toYahooSymbol(symbol: string): string {
  return `${symbol}.SA`;
}

function averageValidPrices(prices: Array<number | null | undefined>): number {
  const valid = prices.filter((p): p is number => p != null && !Number.isNaN(p));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, price) => sum + price, 0) / valid.length;
}

function getPreviousMonthDividend(
  dividends: Record<string, YahooDividend> | undefined,
  referenceDate: Date,
): { amount: number; date: Date } | null {
  if (!dividends) return null;

  const prevMonthDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - 1,
    1,
  );
  const targetMonth = prevMonthDate.getMonth();
  const targetYear = prevMonthDate.getFullYear();

  const matches = Object.values(dividends)
    .map((dividend) => ({
      amount: dividend.amount,
      date: new Date(dividend.date * 1000),
    }))
    .filter(
      (dividend) =>
        dividend.date.getMonth() === targetMonth &&
        dividend.date.getFullYear() === targetYear,
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return matches[0] ?? null;
}

function getAnnualDividendTotal(
  dividends: Record<string, YahooDividend> | undefined,
  referenceDate: Date,
): number {
  if (!dividends) return 0;

  const oneYearAgo = new Date(referenceDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return Object.values(dividends)
    .map((dividend) => ({
      amount: dividend.amount,
      date: new Date(dividend.date * 1000),
    }))
    .filter((dividend) => dividend.date >= oneYearAgo && dividend.date <= referenceDate)
    .reduce((sum, dividend) => sum + dividend.amount, 0);
}

export function getPreviousMonthLabel(referenceDate = new Date()): string {
  const prevMonthDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - 1,
    1,
  );
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    prevMonthDate,
  );
}

export async function fetchAssetQuote(symbol: string): Promise<AssetQuote> {
  const asset = MARKET_ASSETS.find((item) => item.symbol === symbol);
  if (!asset) {
    throw new Error(`Ativo ${symbol} não encontrado.`);
  }

  const yahooSymbol = toYahooSymbol(symbol);
  const url = `/api/yahoo/v8/finance/chart/${yahooSymbol}?interval=1d&range=1y&events=div`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Não foi possível buscar dados de ${symbol}.`);
  }

  const data = (await response.json()) as YahooChartResponse;
  const result = data.chart.result?.[0];

  if (!result) {
    throw new Error(`Dados indisponíveis para ${symbol}.`);
  }

  const consultedAt = new Date().toISOString();
  const referenceDate = result.meta.regularMarketTime
    ? new Date(result.meta.regularMarketTime * 1000)
    : new Date();

  const closes = result.indicators.quote[0]?.close ?? [];
  const avgPrice12m = averageValidPrices(closes);
  const currentPrice =
    result.meta.regularMarketPrice ??
    ([...closes].reverse().find((price) => price != null) as number | undefined) ??
    0;

  const previousMonthDividend = getPreviousMonthDividend(
    result.events?.dividends,
    referenceDate,
  );
  const annualDividendTotal = getAnnualDividendTotal(
    result.events?.dividends,
    referenceDate,
  );
  const dividendYield12m =
    currentPrice > 0 ? (annualDividendTotal / currentPrice) * 100 : 0;

  return {
    symbol: asset.symbol,
    name: result.meta.longName ?? result.meta.shortName ?? asset.name,
    type: asset.type,
    currentPrice,
    avgPrice12m,
    lastMonthDividend: previousMonthDividend?.amount ?? 0,
    lastDividendDate: previousMonthDividend
      ? previousMonthDividend.date.toISOString()
      : null,
    dividendYield12m,
    consultedAt,
  };
}

export function calculatePurchaseSimulation(
  balance: number,
  price: number,
  dividendPerShare: number,
) {
  const maxShares = price > 0 ? Math.floor(balance / price) : 0;
  const totalInvested = maxShares * price;
  const projectedIncome = maxShares * dividendPerShare;
  const remainingBalance = balance - totalInvested;

  return {
    maxShares,
    totalInvested,
    projectedIncome,
    remainingBalance,
  };
}
