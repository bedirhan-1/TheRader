"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StocksPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"watchlist" | "discover">("watchlist");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Watchlist stocks
  const { data, isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => fetch("/api/stocks").then((r) => r.json()),
  });
  const stocks = data?.data ?? [];

  // Discover stock search
  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ["discoverStocks", searchQuery],
    queryFn: () => {
      if (!searchQuery.trim()) return { data: [] };
      return fetch(`/api/stocks/discover?query=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json());
    },
    enabled: activeTab === "discover" && searchQuery.trim().length > 0,
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
      setNewSymbol("");
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hisse eklenemedi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await fetch(`/api/stocks/${symbol}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      toast.success("Hisse listeden kaldırıldı");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hisse kaldırılamadı");
    },
  });

  return (
    <div className="space-y-6">
      {/* Tabs & Actions Header */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-2 -mb-px">
          <button
            onClick={() => setActiveTab("watchlist")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-all",
              activeTab === "watchlist"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Takip Listem
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-all",
              activeTab === "discover"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Hisseleri Keşfet (Alpaca)
          </button>
        </div>

        <div className="pb-2 h-9 flex items-center">
          {activeTab === "watchlist" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-foreground text-background hover:bg-foreground/90">
                    Hisse Ekle
                  </Button>
                }
              />
              <DialogContent className="border-border bg-card">
                <DialogHeader>
                  <DialogTitle>Yeni Hisse Ekle</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newSymbol.trim()) addMutation.mutate(newSymbol.trim());
                  }}
                  className="space-y-4"
                >
                  <Input
                    placeholder="AAPL"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="border-border bg-background font-mono uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alpaca&apos;da aktif olan bir hisse sembolü girin.
                  </p>
                  <Button
                    type="submit"
                    disabled={addMutation.isPending || !newSymbol.trim()}
                    className="w-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    {addMutation.isPending ? "Doğrulanıyor..." : "Ekle"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Watchlist Tab */}
      {activeTab === "watchlist" && (
        <div className="rounded-md border border-border bg-card/25 animate-in fade-in duration-200">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Sembol</TableHead>
                <TableHead className="text-xs">Şirket</TableHead>
                <TableHead className="text-xs text-right">Son Fiyat</TableHead>
                <TableHead className="text-xs text-right">Değişim</TableHead>
                <TableHead className="text-xs text-right">Stratejiler</TableHead>
                <TableHead className="text-xs text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                  ))
                : stocks.length === 0 ? (
                    <TableRow className="border-border">
                      <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">
                        Takip listenizde henüz hisse bulunmuyor.
                      </TableCell>
                    </TableRow>
                  ) : stocks.map(
                    (stock: {
                      id: string;
                      symbol: string;
                      name: string | null;
                      _count?: { strategies: number };
                      snapshot?: {
                        latestTrade?: { p: number };
                        dailyBar?: { c: number };
                        prevDailyBar?: { c: number };
                      };
                    }) => {
                      const price = stock.snapshot?.latestTrade?.p;
                      const prevClose = stock.snapshot?.prevDailyBar?.c;
                      const change =
                        price && prevClose
                          ? ((price - prevClose) / prevClose) * 100
                          : null;

                      return (
                        <TableRow
                          key={stock.id}
                          className="border-border hover:bg-accent/30 transition-colors"
                        >
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-zinc-800 border border-white/5 font-mono text-[10px] font-bold text-zinc-300">
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
                              <Link
                                href={`/stocks/${stock.symbol}`}
                                className="font-mono text-sm font-semibold text-foreground hover:text-info transition-colors"
                              >
                                {stock.symbol}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {stock.name || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {price ? `$${price.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {change !== null ? (
                              <span
                                className={cn(
                                  "font-mono text-xs font-semibold px-2 py-0.5 rounded-md",
                                  change >= 0 
                                    ? "text-success bg-success/10 border border-success/15" 
                                    : "text-danger bg-danger/10 border border-danger/15"
                                )}
                              >
                                {change >= 0 ? "+" : ""}
                                {change.toFixed(2)}%
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="font-mono bg-zinc-900/40">
                              {stock._count?.strategies ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(stock.symbol)}
                              className="h-7 text-xs text-danger hover:text-danger hover:bg-danger/10"
                            >
                              Sil
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === "discover" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Enhanced Search Input */}
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
              placeholder="Sembol veya şirket adı arayın... (Örn: AAPL, Tesla, Microsoft)"
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
          <div className="rounded-md border border-border bg-card/25">
            <Table>
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
                      Hisseleri keşfetmek için arama çubuğunu kullanın.
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
                            {/* Premium Icon with Fallback */}
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
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {asset.symbol}
                            </span>
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
      )}
    </div>
  );
}
