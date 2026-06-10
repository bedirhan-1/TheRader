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

export function PortfolioChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolioHistory"],
    queryFn: () => fetch("/api/account?type=history").then((r) => r.json()),
    refetchInterval: 60000,
  });

  const history = data?.data;
  const chartData =
    history?.timestamp?.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      }),
      equity: history.equity[i],
    })) ?? [];

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
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                width={55}
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
