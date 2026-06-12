"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

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

export function RecentOrders() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["recentOrders"],
    queryFn: () =>
      fetch("/api/orders?limit=10").then((r) => r.json()),
    refetchInterval: (query) => {
      const ordersList = query?.state?.data?.data ?? [];
      const hasPendingOrders = ordersList.some((o: any) => o.status === "PENDING");
      return hasPendingOrders ? 2000 : 30000;
    },
  });

  const orders = data?.data ?? [];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Son Emirler
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Henüz emir yok.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs">Sembol</TableHead>
                <TableHead className="text-xs">Yön</TableHead>
                <TableHead className="text-xs">Adet</TableHead>
                <TableHead className="text-xs">Durum</TableHead>
                <TableHead className="text-xs">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(
                (order: {
                  id: string;
                  stock: { symbol: string };
                  side: string;
                  qty: number;
                  status: string;
                  createdAt: string;
                }) => (
                  <TableRow
                    key={order.id}
                    className="border-border hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/stocks/${order.stock?.symbol}`)}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {order.stock?.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={sideColors[order.side] || ""}
                      >
                        {order.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {order.qty}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[order.status] || ""}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
