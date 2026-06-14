"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const timeframes = [
  { label: "1G", value: "1D", tf: "1Hour", days: 1 },
  { label: "1H", value: "1W", tf: "1Hour", days: 7 },
  { label: "1A", value: "1M", tf: "1Day", days: 30 },
  { label: "3A", value: "3M", tf: "1Day", days: 90 },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  FILLED: "bg-success/10 text-success border-success/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  REJECTED: "bg-muted text-muted-foreground border-border",
};

const sideColors: Record<string, string> = {
  BUY: "bg-success/10 text-success border-success/20",
  SELL: "bg-danger/10 text-danger border-danger/20",
};

function TradingViewChart({ symbol }: { symbol: string }) {
  return (
    <div className="w-full h-[400px] bg-zinc-950 overflow-hidden border border-zinc-900/40 relative">
      <iframe
        src={`https://s.tradingview.com/widgetembed/?symbol=${symbol.toUpperCase()}&interval=D&theme=dark&style=1&timezone=exchange&locale=tr`}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
      />
    </div>
  );
}

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const router = useRouter();
  const [selectedTf, setSelectedTf] = useState("1M");
  const [customDays, setCustomDays] = useState<number>(30);
  const tf = timeframes.find((t) => t.value === selectedTf) || timeframes[2];

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => fetch(`/api/stocks/${symbol}`).then((r) => r.json()),
  });

  const { data: barsData, isLoading: barsLoading } = useQuery({
    queryKey: [
      "bars",
      symbol,
      selectedTf,
      selectedTf === "custom" ? customDays : null,
    ],
    queryFn: () => {
      const days = selectedTf === "custom" ? customDays : tf.days;
      const timeframeVal =
        selectedTf === "custom" ? (customDays <= 7 ? "1Hour" : "1Day") : tf.tf;
      return fetch(
        `/api/stocks/${symbol}/bars?timeframe=${timeframeVal}&days=${days}`,
      ).then((r) => r.json());
    },
  });

  const { data: ordersData } = useQuery({
    queryKey: ["stockOrders", symbol],
    queryFn: () =>
      fetch(`/api/orders?symbol=${symbol}&limit=20`).then((r) => r.json()),
    refetchInterval: (query) => {
      const ordersList = query?.state?.data?.data ?? [];
      const hasPending = ordersList.some((o: any) => o.status === "PENDING");
      return hasPending ? 2000 : 30000;
    },
  });

  const queryClient = useQueryClient();
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY");
  const [tradeType, setTradeType] = useState<"MARKET" | "LIMIT" | "STOP">(
    "MARKET",
  );
  const [tradeQty, setTradeQty] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  const tradeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          side: tradeSide.toLowerCase(),
          qty: parseFloat(tradeQty),
          type: tradeType.toLowerCase(),
          time_in_force: "day",
          ...(tradeType !== "MARKET" && limitPrice
            ? { limit_price: parseFloat(limitPrice) }
            : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockOrders", symbol] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Emir başarıyla iletildi");
      setTradeQty("");
      setLimitPrice("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Emir gönderilirken hata oluştu");
    },
  });

  const stock = stockData?.data;
  const snapshot = stock?.snapshot;
  const price = snapshot?.latestTrade?.p;
  const prevClose = snapshot?.prevDailyBar?.c;
  const change =
    price && prevClose ? ((price - prevClose) / prevClose) * 100 : null;

  const bars = barsData?.data ?? [];
  const chartData = bars.map(
    (bar: {
      t: string;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
    }) => ({
      date: new Date(bar.t).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      }),
      close: bar.c,
      volume: bar.v,
      high: bar.h,
      low: bar.l,
    }),
  );

  const strategies = stock?.strategies ?? [];
  const orders = ordersData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {stockLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <img
                src={`https://images.financialmodelingprep.com/symbol/${symbol}.png`}
                alt={symbol}
                className="h-8 w-8 rounded-full bg-muted object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <h1 className="font-mono text-2xl font-bold">{symbol}</h1>
              <span className="text-lg text-muted-foreground">
                {stock?.name || ""}
              </span>
              {price && (
                <span className="font-mono text-2xl font-semibold">
                  ${price}
                </span>
              )}
              {change !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono",
                    change >= 0
                      ? "border-success/20 bg-success/10 text-success"
                      : "border-danger/20 bg-danger/10 text-danger",
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </Badge>
              )}
            </div>
          )}
        </div>
        {!stockLoading && (
          <Button
            onClick={() => router.push(`/strategies/new?symbol=${symbol}`)}
            className="flex items-center justify-center gap-2 bg-linear-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500 text-white font-medium border-0 transition-all duration-300 shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_25px_rgba(124,58,237,0.55)] hover:-translate-y-0.5 active:translate-y-0 h-9 px-4 rounded-md w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Strateji Oluştur</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Chart & Info Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Canlı Fiyat Grafiği (TradingView)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TradingViewChart symbol={symbol} />
            </CardContent>
          </Card>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Strategies */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Stratejiler
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {strategies.length === 0 ? (
                  <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    Bu hisseye ait strateji yok.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <Table className="whitespace-nowrap">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs">Ad</TableHead>
                          <TableHead className="text-xs">Tür</TableHead>
                          <TableHead className="text-xs">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {strategies.map(
                          (s: {
                            id: string;
                            name: string;
                            type: string;
                            enabled: boolean;
                          }) => (
                            <TableRow key={s.id} className="border-border">
                              <TableCell className="text-sm">
                                {s.name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {s.type.replace("_", " ")}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    s.enabled
                                      ? "border-success/20 bg-success/10 text-success"
                                      : "border-border bg-muted text-muted-foreground"
                                  }
                                >
                                  {s.enabled ? "Aktif" : "Pasif"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orders */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Emir Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    Henüz emir yok.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <Table className="whitespace-nowrap">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs">Yön</TableHead>
                          <TableHead className="text-xs">Adet</TableHead>
                          <TableHead className="text-xs">Durum</TableHead>
                          <TableHead className="text-xs">Tarih</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map(
                          (o: {
                            id: string;
                            side: string;
                            qty: number;
                            status: string;
                            createdAt: string;
                          }) => (
                            <TableRow key={o.id} className="border-border">
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={sideColors[o.side]}
                                >
                                  {o.side}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {o.qty}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={statusColors[o.status]}
                                >
                                  {o.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(o.createdAt).toLocaleDateString(
                                  "tr-TR",
                                )}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Midas-like Trading Card */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-card shadow-lg sticky top-6">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <div className="flex w-full bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setTradeSide("BUY")}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-xs font-bold transition-all text-center",
                    tradeSide === "BUY"
                      ? "bg-success text-success-foreground shadow animate-in fade-in"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Hisse Al (BUY)
                </button>
                <button
                  type="button"
                  onClick={() => setTradeSide("SELL")}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-xs font-bold transition-all text-center",
                    tradeSide === "SELL"
                      ? "bg-danger text-danger-foreground shadow animate-in fade-in"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Hisse Sat (SELL)
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Order Type */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Emir Tipi
                </Label>
                <Select
                  value={tradeType}
                  onValueChange={(v: any) => setTradeType(v || "MARKET")}
                >
                  <SelectTrigger className="h-9 border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKET">Piyasa Emri (Market)</SelectItem>
                    <SelectItem value="LIMIT">
                      Limit Emir (Fiyat Belirle)
                    </SelectItem>
                    <SelectItem value="STOP">
                      Stop Emir (Tetiklemeli)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Limit Price (only for non-market) */}
              {tradeType !== "MARKET" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                    İstenen Fiyat ($)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="h-9 border-border bg-background font-mono text-xs"
                    placeholder={price ? `${price}` : "0.00"}
                  />
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Adet (Miktar)
                </Label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={tradeQty}
                  onChange={(e) => setTradeQty(e.target.value)}
                  className="h-9 border-border bg-background font-mono text-xs"
                  placeholder="10"
                />
              </div>

              {/* Pricing Info Summary */}
              <div className="bg-zinc-100/60 dark:bg-zinc-950/40 p-3 rounded-lg border border-border/50 space-y-2 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Anlık Hisse Fiyatı:</span>
                  <span className="font-mono text-foreground font-semibold">
                    {price ? `$${price.toFixed(2)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/30 pt-2 text-sm font-semibold">
                  <span>Tahmini Tutar:</span>
                  <span
                    className={cn(
                      "font-mono",
                      tradeSide === "BUY" ? "text-success" : "text-danger",
                    )}
                  >
                    {price && tradeQty
                      ? `$${(price * parseFloat(tradeQty) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "$0.00"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                type="button"
                disabled={
                  tradeMutation.isPending ||
                  !tradeQty ||
                  parseFloat(tradeQty) <= 0
                }
                onClick={() => tradeMutation.mutate()}
                className={cn(
                  "w-full h-10 font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 duration-100",
                  tradeSide === "BUY"
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-danger text-danger-foreground hover:bg-danger/90",
                )}
              >
                {tradeMutation.isPending
                  ? "Emir İletiliyor..."
                  : `${symbol} ${tradeSide === "BUY" ? "AL" : "SAT"}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
