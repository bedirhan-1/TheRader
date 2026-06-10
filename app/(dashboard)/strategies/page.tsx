"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

export default function StrategiesPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    stockId: "",
    type: "RSI" as string,
    orderType: "MARKET" as string,
    qty: "",
    enabled: false,
    params: {} as Record<string, unknown>,
  });

  const { data: strategiesData, isLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => fetch("/api/strategies").then((r) => r.json()),
  });

  const { data: stocksData } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => fetch("/api/stocks").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strateji oluşturuldu");
      setSheetOpen(false);
      resetForm();
    },
    onError: () => toast.error("Strateji oluşturulamadı"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strateji silindi");
    },
    onError: () => toast.error("Silinemedi"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });

  function resetForm() {
    setFormData({
      name: "",
      stockId: "",
      type: "RSI",
      orderType: "MARKET",
      qty: "",
      enabled: false,
      params: {},
    });
  }

  function getDefaultParams(type: string) {
    switch (type) {
      case "RSI": return { period: 14, oversold: 30, overbought: 70 };
      case "SMA_CROSSOVER": return { fastPeriod: 10, slowPeriod: 50 };
      case "MACD": return { fast: 12, slow: 26, signal: 9 };
      case "CUSTOM": return { logic: "" };
      default: return {};
    }
  }

  const strategies = strategiesData?.data ?? [];
  const stocks = stocksData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Stratejiler</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger>
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              Yeni Strateji
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] border-border bg-card overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Yeni Strateji</SheetTitle>
            </SheetHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="mt-6 space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Hisse</Label>
                <Select
                  value={formData.stockId}
                  onValueChange={(v) => setFormData({ ...formData, stockId: v ?? "" })}
                >
                  <SelectTrigger className="border-border bg-background">
                    <SelectValue placeholder="Hisse seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks.map((s: { id: string; symbol: string }) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Strateji Adı</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-border bg-background"
                  placeholder="RSI Oversold AAPL"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Strateji Türü</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v ?? "RSI", params: getDefaultParams(v ?? "RSI") })
                  }
                >
                  <SelectTrigger className="border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RSI">RSI</SelectItem>
                    <SelectItem value="SMA_CROSSOVER">SMA Crossover</SelectItem>
                    <SelectItem value="MACD">MACD</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic params */}
              <div className="space-y-3 rounded-md border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Parametreler</p>
                {formData.type === "RSI" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Period</Label>
                        <Input type="number" value={(formData.params as Record<string, number>).period ?? 14} onChange={(e) => setFormData({...formData, params: {...formData.params, period: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Oversold</Label>
                        <Input type="number" value={(formData.params as Record<string, number>).oversold ?? 30} onChange={(e) => setFormData({...formData, params: {...formData.params, oversold: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Overbought</Label>
                        <Input type="number" value={(formData.params as Record<string, number>).overbought ?? 70} onChange={(e) => setFormData({...formData, params: {...formData.params, overbought: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                      </div>
                    </div>
                  </>
                )}
                {formData.type === "SMA_CROSSOVER" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Fast Period</Label>
                      <Input type="number" value={(formData.params as Record<string, number>).fastPeriod ?? 10} onChange={(e) => setFormData({...formData, params: {...formData.params, fastPeriod: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Slow Period</Label>
                      <Input type="number" value={(formData.params as Record<string, number>).slowPeriod ?? 50} onChange={(e) => setFormData({...formData, params: {...formData.params, slowPeriod: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                    </div>
                  </div>
                )}
                {formData.type === "MACD" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Fast</Label>
                      <Input type="number" value={(formData.params as Record<string, number>).fast ?? 12} onChange={(e) => setFormData({...formData, params: {...formData.params, fast: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Slow</Label>
                      <Input type="number" value={(formData.params as Record<string, number>).slow ?? 26} onChange={(e) => setFormData({...formData, params: {...formData.params, slow: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Signal</Label>
                      <Input type="number" value={(formData.params as Record<string, number>).signal ?? 9} onChange={(e) => setFormData({...formData, params: {...formData.params, signal: +e.target.value}})} className="h-8 border-border bg-background text-xs" />
                    </div>
                  </div>
                )}
                {formData.type === "CUSTOM" && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Logic (JSON)</Label>
                    <textarea
                      value={typeof (formData.params as Record<string, string>).logic === "string" ? (formData.params as Record<string, string>).logic : ""}
                      onChange={(e) => setFormData({...formData, params: {...formData.params, logic: e.target.value}})}
                      className="mt-1 w-full rounded-md border border-border bg-background p-2 font-mono text-xs text-foreground"
                      rows={4}
                      placeholder='{"indicator":"price_change","condition":"greater_than","threshold":0.02,"action":"BUY"}'
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Emir Türü</Label>
                <Select
                  value={formData.orderType}
                  onValueChange={(v) => setFormData({ ...formData, orderType: v ?? "MARKET" })}
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

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Miktar (Adet)</Label>
                <Input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  className="border-border bg-background"
                  placeholder="10"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Aktif</Label>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, enabled: v })}
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
              >
                {createMutation.isPending ? "Oluşturuluyor..." : "Strateji Oluştur"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs">Ad</TableHead>
              <TableHead className="text-xs">Hisse</TableHead>
              <TableHead className="text-xs">Tür</TableHead>
              <TableHead className="text-xs">Parametreler</TableHead>
              <TableHead className="text-xs">Durum</TableHead>
              <TableHead className="text-xs">Son Tetiklenme</TableHead>
              <TableHead className="text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : strategies.map(
                  (s: {
                    id: string;
                    name: string;
                    stock: { symbol: string };
                    type: string;
                    params: Record<string, unknown>;
                    enabled: boolean;
                    lastTriggered: string | null;
                  }) => (
                    <TableRow key={s.id} className="border-border">
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.stock?.symbol}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                        {JSON.stringify(s.params)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={s.enabled}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: s.id, enabled: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.lastTriggered
                          ? new Date(s.lastTriggered).toLocaleString("tr-TR")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(s.id)}
                          className="h-7 text-xs text-danger hover:text-danger"
                        >
                          Sil
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
