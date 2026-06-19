import { useQuery } from "@tanstack/react-query";
import { fetchAssetQuote } from "@/lib/market-data";

export function useMarketAsset(symbol: string) {
  return useQuery({
    queryKey: ["market-asset", symbol],
    queryFn: () => fetchAssetQuote(symbol),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
