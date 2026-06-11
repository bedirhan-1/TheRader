"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface PortfolioChartProps {
  currentEquity?: number | null;
}

export function PortfolioChart({ currentEquity }: PortfolioChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolioHistory"],
    queryFn: () => fetch("/api/account?type=history").then((r) => r.json()),
    refetchInterval: 60000,
  });

  const history = data?.data;
  const firstNonZeroEquity =
    history?.equity?.find((val: number) => val > 0) ?? 0;
  const chartData =
    history?.timestamp?.map((ts: number, i: number) => {
      const eq = history.equity[i];
      return {
        date: new Date(ts * 1000).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "short",
        }),
        equity:
          eq === 0 || eq === null || eq === undefined ? firstNonZeroEquity : eq,
      };
    }) ?? [];

  // Real-time backfill/append today's active portfolio value
  if (
    chartData.length > 0 &&
    currentEquity !== undefined &&
    currentEquity !== null
  ) {
    const todayStr = new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
    });
    const lastItem = chartData[chartData.length - 1];
    if (lastItem.date === todayStr) {
      lastItem.equity = currentEquity;
    } else {
      chartData.push({
        date: todayStr,
        equity: currentEquity,
      });
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Portfolio — Son 30 Gün
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : error || chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {error
              ? "Veri yüklenemedi. Alpaca bağlantısını kontrol edin."
              : "Henüz veri yok."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                }
                width={65}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
                formatter={(value: any) => [
                  `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                  "Equity",
                ]}
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="var(--info)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--info)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
