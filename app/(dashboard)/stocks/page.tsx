"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function StocksPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Watchlist stocks to check if already followed
  const { data: followedData } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => fetch("/api/stocks").then((r) => r.json()),
  });
  const stocks = followedData?.data ?? [];

  // Discover stock search
  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ["discoverStocks", searchQuery],
    queryFn: () => {
      if (!searchQuery.trim()) return { data: [] };
      return fetch(`/api/stocks/discover?query=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json());
    },
    enabled: searchQuery.trim().length > 0,
  });
  const discoverStocks = discoverData?.data ?? [];

  const addMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      toast.success("Hisse takip listesine eklendi");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hisse eklenemedi");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-foreground">Hisseleri Keşfet</h1>
        <p className="text-xs text-muted-foreground">
          Amerikan borsalarındaki tüm hisseleri arayın, analiz edin ve takip listenize ekleyin.
        </p>
      </div>

      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Search Input */}
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Sembol veya şirket adı arayın... (Örn: AAPL, Tesla, Microsoft, NVDA)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11 border-border bg-zinc-900/40 hover:bg-zinc-900/60 focus:bg-zinc-900 focus-visible:ring-1 focus-visible:ring-white/20 transition-all font-medium placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Results Table */}
        <div className="rounded-md border border-border bg-card/25 w-full overflow-x-auto">
          <Table className="whitespace-nowrap">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Sembol</TableHead>
                <TableHead className="text-xs">Şirket</TableHead>
                <TableHead className="text-xs">Borsa</TableHead>
                <TableHead className="text-xs text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discoverLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : !searchQuery.trim() ? (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="h-28 text-center text-sm text-muted-foreground">
                    Hisseleri keşfetmek ve aramak için yukarıdaki arama çubuğunu kullanın.
                  </TableCell>
                </TableRow>
              ) : discoverStocks.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="h-28 text-center text-sm text-muted-foreground">
                    Arama sonucu bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                discoverStocks.map((asset: { symbol: string; name: string; exchange: string }) => {
                  const isFollowed = stocks.some((s: any) => s.symbol === asset.symbol);

                  return (
                    <TableRow key={asset.symbol} className="border-border hover:bg-accent/20 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-zinc-800 border border-white/5 font-mono text-[10px] font-bold text-zinc-300">
                            <img
                              src={`https://images.financialmodelingprep.com/symbol/${asset.symbol}.png`}
                              alt={asset.symbol}
                              className="absolute inset-0 h-full w-full rounded-full object-contain bg-zinc-900 transition-opacity duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = "0";
                              }}
                            />
                            {asset.symbol[0]}
                          </div>
                          <Link
                            href={`/stocks/${asset.symbol}`}
                            className="font-mono text-sm font-semibold text-foreground hover:text-info transition-colors"
                          >
                            {asset.symbol}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                        {asset.name || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-900/60 border border-border text-[10px]">
                          {asset.exchange}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isFollowed ? (
                          <span className="text-[11px] font-semibold text-success/80 select-none px-3 py-1 bg-success/5 rounded-full border border-success/15">
                            ✓ Takip Ediliyor
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addMutation.mutate(asset.symbol)}
                            disabled={addMutation.isPending}
                            className="h-7 text-xs border-border bg-zinc-900/40 text-foreground hover:bg-foreground hover:text-background transition-all"
                          >
                            + Takip Et
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
