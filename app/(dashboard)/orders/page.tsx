"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function OrdersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    side: "",
    symbol: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    symbol: "",
    side: "BUY",
    qty: "",
    type: "MARKET",
  });

  const queryString = new URLSearchParams({
    page: String(page),
    limit: "50",
    ...(filters.status && { status: filters.status }),
    ...(filters.side && { side: filters.side }),
    ...(filters.symbol && { symbol: filters.symbol }),
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", queryString],
    queryFn: () => fetch(`/api/orders?${queryString}`).then((r) => r.json()),
  });

  const placeMutation = useMutation({
    mutationFn: async (form: typeof orderForm) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: form.symbol.toUpperCase(),
          side: form.side.toLowerCase(),
          qty: parseFloat(form.qty),
          type: form.type.toLowerCase(),
          time_in_force: "day",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Emir gönderildi");
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Emirler</h1>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button className="bg-foreground text-background hover:bg-foreground/90">
                Manuel Emir
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle>Manuel Emir Gönder</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  placeMutation.mutate(orderForm);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Sembol</Label>
                  <Input
                    value={orderForm.symbol}
                    onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })}
                    className="border-border bg-background font-mono uppercase"
                    placeholder="AAPL"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Yön</Label>
                    <Select
                      value={orderForm.side}
                      onValueChange={(v) => setOrderForm({ ...orderForm, side: v ?? "BUY" })}
                    >
                      <SelectTrigger className="border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tür</Label>
                    <Select
                      value={orderForm.type}
                      onValueChange={(v) => setOrderForm({ ...orderForm, type: v ?? "MARKET" })}
                    >
                      <SelectTrigger className="border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MARKET">Market</SelectItem>
                        <SelectItem value="LIMIT">Limit</SelectItem>
                        <SelectItem value="STOP">Stop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Adet</Label>
                  <Input
                    type="number"
                    value={orderForm.qty}
                    onChange={(e) => setOrderForm({ ...orderForm, qty: e.target.value })}
                    className="border-border bg-background"
                    placeholder="10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={placeMutation.isPending}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {placeMutation.isPending ? "Gönderiliyor..." : "Emir Gönder"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={filters.status}
          onValueChange={(v) => setFilters({ ...filters, status: !v || v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[140px] border-border bg-card text-xs">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="PENDING">Bekleyen</SelectItem>
            <SelectItem value="FILLED">Dolmuş</SelectItem>
            <SelectItem value="CANCELLED">İptal</SelectItem>
            <SelectItem value="REJECTED">Reddedilmiş</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.side}
          onValueChange={(v) => setFilters({ ...filters, side: !v || v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[120px] border-border bg-card text-xs">
            <SelectValue placeholder="Yön" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="BUY">BUY</SelectItem>
            <SelectItem value="SELL">SELL</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Sembol ara..."
          value={filters.symbol}
          onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
          className="w-[150px] border-border bg-card text-xs"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs">Sembol</TableHead>
              <TableHead className="text-xs">Yön</TableHead>
              <TableHead className="text-xs">Adet</TableHead>
              <TableHead className="text-xs">Tür</TableHead>
              <TableHead className="text-xs">Durum</TableHead>
              <TableHead className="text-xs">Fiyat</TableHead>
              <TableHead className="text-xs">Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : orders.map(
                  (order: {
                    id: string;
                    stock: { symbol: string };
                    side: string;
                    qty: number;
                    type: string;
                    status: string;
                    limitPrice: number | null;
                    createdAt: string;
                  }) => (
                    <TableRow key={order.id} className="border-border">
                      <TableCell className="font-mono text-sm font-medium">
                        {order.stock?.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sideColors[order.side]}>
                          {order.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{order.qty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {order.limitPrice ? `$${order.limitPrice.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("tr-TR")}
                      </TableCell>
                    </TableRow>
                  )
                )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} emir</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-7 text-xs"
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={orders.length < 50}
            onClick={() => setPage((p) => p + 1)}
            className="h-7 text-xs"
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
