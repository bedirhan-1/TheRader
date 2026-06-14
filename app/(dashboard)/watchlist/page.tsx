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
import { Sparkline } from "@/components/dashboard/sparkline";

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");

  // Watchlist stocks
  const { data, isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => fetch("/api/stocks").then((r) => r.json()),
  });
  const stocks = data?.data ?? [];

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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Takip Listem</h1>
          <p className="text-xs text-muted-foreground">
            Takip ettiğiniz ve strateji oluşturabileceğiniz hisse senetleri.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-foreground text-background hover:bg-foreground/90 text-xs h-8">
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
      </div>

      {/* Watchlist Table */}
      <div className="rounded-md border border-border bg-card/25 animate-in fade-in duration-200 w-full overflow-x-auto">
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs">Sembol</TableHead>
              <TableHead className="text-xs">Şirket</TableHead>
              <TableHead className="text-xs text-right">Son Fiyat</TableHead>
              <TableHead className="text-xs text-right">Değişim</TableHead>
              <TableHead className="text-xs text-center">Grafik</TableHead>
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
                    <TableCell className="flex justify-center"><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              : stocks.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                      Takip listenizde henüz hisse bulunmuyor. Sağ üstteki butonla hisse ekleyebilirsiniz.
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
                        <TableCell className="py-1">
                          <div className="flex justify-center">
                            <Sparkline symbol={stock.symbol} baseline={prevClose || price || 0} />
                          </div>
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
    </div>
  );
}
