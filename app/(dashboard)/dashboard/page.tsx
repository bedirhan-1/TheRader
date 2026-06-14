"use client";

import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { ActiveStrategies } from "@/components/dashboard/active-strategies";
import { StrategyLogs } from "@/components/dashboard/strategy-logs";

export default function DashboardPage() {
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["account"],
    queryFn: () => fetch("/api/account").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: () => fetch("/api/positions").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const { data: openOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", "open"],
    queryFn: () => fetch("/api/orders?status=open").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const accountData = account?.data;
  const portfolioValue = accountData
    ? parseFloat(accountData.portfolio_value)
    : null;
  const todayPL = accountData
    ? parseFloat(accountData.equity) - parseFloat(accountData.last_equity)
    : null;
  const positionsCount = positions?.data?.length ?? null;
  const pendingCount = openOrders?.data?.length ?? null;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
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
          title="Açık Pozisyonlar"
          value={positionsCount}
          format="number"
          loading={positionsLoading}
        />
        <MetricCard
          title="Bekleyen Emirler"
          value={pendingCount}
          format="number"
          loading={ordersLoading}
        />
      </div>

      {/* Portfolio Chart */}
      <PortfolioChart currentEquity={portfolioValue} />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrders />
        <ActiveStrategies />
      </div>

      {/* System Run Logs */}
      <div className="mt-6">
        <StrategyLogs />
      </div>
    </div>
  );
}
