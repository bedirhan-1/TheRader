"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";

export default function WalletPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch account stats
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["account"],
    queryFn: () => fetch("/api/account").then((r) => r.json()),
    refetchInterval: 10000, // refresh every 10 seconds for real-time portfolio feel
  });

  // Fetch positions
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: () => fetch("/api/positions").then((r) => r.json()),
    refetchInterval: 10000,
  });

  const accountData = account?.data;
  const positions = positionsData?.data ?? [];

  // Account metric helpers
  const portfolioValue = accountData
    ? parseFloat(accountData.portfolio_value)
    : null;
  const cash = accountData ? parseFloat(accountData.cash) : null;
  const buyingPower = accountData ? parseFloat(accountData.buying_power) : null;
  const todayPL = accountData
    ? parseFloat(accountData.equity) - parseFloat(accountData.last_equity)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Cüzdanım
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Alpaca API hesabınızdaki canlı varlık dağılımı, bakiye bilgileri ve
          açık pozisyonlar.
        </p>
      </div>

      {/* Account Balance Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Portfolio Değeri"
          value={portfolioValue}
          format="currency"
          loading={accountLoading}
        />
        <MetricCard
          title="Bugünkü P&L"
          value={todayPL}
          format="currency"
          colored
          loading={accountLoading}
        />
        <MetricCard
          title="Nakit Bakiye"
          value={cash}
          format="currency"
          loading={accountLoading}
        />
        <MetricCard
          title="Alım Gücü"
          value={buyingPower}
          format="currency"
          loading={accountLoading}
        />
      </div>

      {/* Positions Table */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Açık Pozisyonlar
          </CardTitle>
          {!positionsLoading && positions.length > 0 && (
            <Badge
              variant="outline"
              className="font-mono bg-zinc-900/40 text-xs"
            >
              {positions.length} Pozisyon
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Hisse</TableHead>
                <TableHead className="text-xs">Borsa</TableHead>
                <TableHead className="text-xs text-right">Adet</TableHead>
                <TableHead className="text-xs text-right">
                  Ort. Maliyet
                </TableHead>
                <TableHead className="text-xs text-right">Son Fiyat</TableHead>
                <TableHead className="text-xs text-right">
                  Toplam Maliyet
                </TableHead>
                <TableHead className="text-xs text-right">
                  Piyasa Değeri
                </TableHead>
                <TableHead className="text-xs text-right">Kar/Zarar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : positions.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    Cüzdanınızda açık pozisyon bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((pos: any) => {
                  const qty = parseFloat(pos.qty);
                  const avgEntry = parseFloat(pos.avg_entry_price);
                  const currentPrice = parseFloat(pos.current_price);
                  const marketValue = parseFloat(pos.market_value);
                  const costBasis = parseFloat(pos.cost_basis);
                  const unrealizedPL = parseFloat(pos.unrealized_pl);
                  const unrealizedPLPC = parseFloat(pos.unrealized_plpc) * 100;

                  return (
                    <TableRow
                      key={pos.asset_id}
                      className="border-border hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/stocks/${pos.symbol}`)}
                    >
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-zinc-800 border border-white/5 font-mono text-[10px] font-bold text-zinc-300">
                            <img
                              src={`https://images.financialmodelingprep.com/symbol/${pos.symbol}.png`}
                              alt={pos.symbol}
                              className="absolute inset-0 h-full w-full rounded-full object-contain bg-zinc-900 transition-opacity duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = "0";
                              }}
                            />
                            {pos.symbol[0]}
                          </div>
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {pos.symbol}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-900/60 border border-border text-[10px]">
                          {pos.exchange}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {qty}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        ${avgEntry.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${currentPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        ${costBasis.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${marketValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold px-2 py-0.5 rounded-md",
                            unrealizedPL >= 0
                              ? "text-success bg-success/10 border border-success/15"
                              : "text-danger bg-danger/10 border border-danger/15",
                          )}
                        >
                          {unrealizedPL >= 0 ? "+" : ""}
                          {unrealizedPL.toFixed(2)} ({unrealizedPLPC.toFixed(2)}
                          %)
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
