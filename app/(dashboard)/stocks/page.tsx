"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaveStockButton } from "@/components/watchlist/save-stock-button";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/sparkline";

type HighlightCategory = "popular" | "volume" | "gainers" | "losers";

interface HighlightStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

interface IndexETF {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export default function StocksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<HighlightCategory>("popular");

  // Fetch highlights (indices + categories)
  const { data: highlightsResponse, isLoading: highlightsLoading } = useQuery({
    queryKey: ["marketHighlights"],
    queryFn: () => fetch("/api/stocks/highlights").then((r) => r.json()),
  });
  const highlights: {
    indices: IndexETF[];
    popular: HighlightStock[];
    gainers: HighlightStock[];
    losers: HighlightStock[];
    volume: HighlightStock[];
  } = highlightsResponse?.data ?? {
    indices: [],
    popular: [],
    gainers: [],
    losers: [],
    volume: []
  };

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

  const getActiveList = (): HighlightStock[] => {
    switch (activeTab) {
      case "popular":
        return highlights.popular || [];
      case "volume":
        return highlights.volume || [];
      case "gainers":
        return highlights.gainers || [];
      case "losers":
        return highlights.losers || [];
      default:
        return [];
    }
  };

  const activeStocks = getActiveList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-foreground">Keşfet</h1>
        <p className="text-xs text-muted-foreground">
          Amerikan borsalarındaki endeksleri takip edin, öne çıkan hisseleri inceleyin ve portföyünüze kaydedin.
        </p>
      </div>

      <div className="space-y-6 animate-in fade-in duration-200">
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

        {/* Dynamic view based on Search Query */}
        {searchQuery.trim().length > 0 ? (
          /* Search Results View */
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">Arama Sonuçları</h3>
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
                  ) : discoverStocks.length === 0 ? (
                    <TableRow className="border-border">
                      <TableCell colSpan={4} className="h-28 text-center text-sm text-muted-foreground">
                        Arama sonucu bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    discoverStocks.map((asset: { symbol: string; name: string; exchange: string }) => {
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
                          <TableCell className="text-right py-2">
                            <SaveStockButton symbol={asset.symbol} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Market Indices & Highlights Dashboard View */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Market Indices Tracker Card row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {highlightsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-border bg-card/10 p-3.5 space-y-2">
                      <Skeleton className="h-3.5 w-16" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </Card>
                  ))
                : (highlights.indices || []).map((idx) => (
                    <Card key={idx.symbol} className="border-border bg-card/25 p-3.5 hover:bg-card/40 transition-all shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-zinc-450 tracking-wider">{idx.name}</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-sm font-bold font-mono text-white">${idx.price.toFixed(2)}</span>
                        <span
                          className={cn(
                            "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md",
                            idx.change >= 0
                              ? "text-success bg-success/5 border border-success/15"
                              : "text-danger bg-danger/5 border border-danger/15"
                          )}
                        >
                          {idx.change >= 0 ? "+" : ""}
                          {idx.change.toFixed(2)}%
                        </span>
                      </div>
                    </Card>
                  ))}
            </div>

            {/* Highlights Rankings panel */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-zinc-200">Günün Öne Çıkanları</h2>

              {/* Sub-tabs Pills */}
              <div className="flex gap-2 border-b border-border/40 pb-3 overflow-x-auto no-scrollbar">
                {(["popular", "volume", "gainers", "losers"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                      activeTab === tab
                        ? "bg-zinc-100 border-zinc-100 text-zinc-950 font-bold"
                        : "bg-zinc-900/40 border-zinc-850 text-zinc-450 hover:text-zinc-100 hover:bg-zinc-800"
                    )}
                  >
                    {tab === "popular"
                      ? "Popüler"
                      : tab === "volume"
                      ? "Hacim"
                      : tab === "gainers"
                      ? "Yükselenler"
                      : "Düşenler"}
                  </button>
                ))}
              </div>

              {/* Dynamic Rankings list */}
              <div className="rounded-xl border border-border bg-card/20 overflow-hidden divide-y divide-border/40">
                {highlightsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/5">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-3.5 w-32" />
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))
                ) : activeStocks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    Veri yüklenemedi.
                  </div>
                ) : (
                  activeStocks.map((stock, idx) => {
                    return (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-3.5 hover:bg-accent/10 transition-colors"
                      >
                        {/* Stock basic info */}
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold font-mono text-zinc-500 w-4 text-center">
                            {idx + 1}
                          </span>

                          <div className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-zinc-800 border border-white/5 font-mono text-xs font-bold text-zinc-300">
                            <img
                              src={`https://images.financialmodelingprep.com/symbol/${stock.symbol}.png`}
                              alt={stock.symbol}
                              className="absolute inset-0 h-full w-full rounded-full object-contain bg-zinc-900 transition-opacity duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = "0";
                              }}
                            />
                            {stock.symbol[0]}
                          </div>

                          <div className="flex flex-col">
                            <Link
                              href={`/stocks/${stock.symbol}`}
                              className="font-mono text-xs font-bold text-white hover:text-info transition-colors"
                            >
                              {stock.symbol}
                            </Link>
                            <span className="text-[10px] text-zinc-450 truncate max-w-[150px] sm:max-w-[250px]">
                              {stock.name}
                            </span>
                          </div>
                        </div>

                        {/* Real-time pricing & Save Action */}
                        <div className="flex items-center gap-5">
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-bold font-mono text-white">
                              ${stock.price.toFixed(2)}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold font-mono",
                                stock.change >= 0 ? "text-success" : "text-danger"
                              )}
                            >
                              {stock.change >= 0 ? "+" : ""}
                              {stock.change.toFixed(2)}%
                            </span>
                          </div>

                          {/* Save stock bookmark button */}
                          <div className="shrink-0">
                            <SaveStockButton symbol={stock.symbol} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
