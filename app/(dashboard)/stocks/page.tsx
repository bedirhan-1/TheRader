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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => fetch("/api/stocks").then((r) => r.json()),
  });

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
      toast.success("Hisse eklendi");
      setNewSymbol("");
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hisse eklenemedi");
    },
  });

  const stocks = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Hisseler</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              Hisse Ekle
            </Button>
          </DialogTrigger>
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

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs">Sembol</TableHead>
              <TableHead className="text-xs">Şirket</TableHead>
              <TableHead className="text-xs text-right">Son Fiyat</TableHead>
              <TableHead className="text-xs text-right">Değişim</TableHead>
              <TableHead className="text-xs text-right">Stratejiler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              : stocks.map(
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
                        className="border-border cursor-pointer hover:bg-accent/50"
                      >
                        <TableCell>
                          <Link
                            href={`/stocks/${stock.symbol}`}
                            className="font-mono text-sm font-medium text-foreground hover:text-info"
                          >
                            {stock.symbol}
                          </Link>
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
                                "font-mono text-sm",
                                change >= 0 ? "text-success" : "text-danger",
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
                          <Badge variant="outline" className="font-mono">
                            {stock._count?.strategies ?? 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
