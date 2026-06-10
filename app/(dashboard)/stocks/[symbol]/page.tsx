"use client";

import { useQuery } from "@tanstack/react-query";
import { use, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const [selectedTf, setSelectedTf] = useState("1M");
  const tf = timeframes.find((t) => t.value === selectedTf) || timeframes[2];

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => fetch(`/api/stocks/${symbol}`).then((r) => r.json()),
  });

  const { data: barsData, isLoading: barsLoading } = useQuery({
    queryKey: ["bars", symbol, selectedTf],
    queryFn: () =>
      fetch(
        `/api/stocks/${symbol}/bars?timeframe=${tf.tf}&days=${tf.days}`
      ).then((r) => r.json()),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["stockOrders", symbol],
    queryFn: () =>
      fetch(`/api/orders?symbol=${symbol}&limit=20`).then((r) => r.json()),
  });

  const stock = stockData?.data;
  const snapshot = stock?.snapshot;
  const price = snapshot?.latestTrade?.p;
  const prevClose = snapshot?.prevDailyBar?.c;
  const change =
    price && prevClose ? ((price - prevClose) / prevClose) * 100 : null;

  const bars = barsData?.data ?? [];
  const chartData = bars.map(
    (bar: { t: string; o: number; h: number; l: number; c: number; v: number }) => ({
      date: new Date(bar.t).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      }),
      close: bar.c,
      volume: bar.v,
      high: bar.h,
      low: bar.l,
    })
  );

  const strategies = stock?.strategies ?? [];
  const orders = ordersData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {stockLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="flex items-center gap-4">
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
                      : "border-danger/20 bg-danger/10 text-danger"
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Fiyat Grafiği
          </CardTitle>
          <div className="flex gap-1">
            {timeframes.map((t) => (
              <Button
                key={t.value}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTf(t.value)}
                className={cn(
                  "h-7 px-2 text-xs",
                  selectedTf === t.value
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {barsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Veri bulunamadı.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="price"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  width={55}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                  width={0}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="var(--muted)"
                  opacity={0.3}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="var(--info)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Ad</TableHead>
                    <TableHead className="text-xs">Tür</TableHead>
                    <TableHead className="text-xs">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategies.map(
                    (s: { id: string; name: string; type: string; enabled: boolean }) => (
                      <TableRow key={s.id} className="border-border">
                        <TableCell className="text-sm">{s.name}</TableCell>
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
                    )
                  )}
                </TableBody>
              </Table>
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
              <Table>
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
                          <Badge variant="outline" className={sideColors[o.side]}>
                            {o.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{o.qty}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[o.status]}>
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
