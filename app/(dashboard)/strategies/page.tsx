"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import Link from "next/link";
import { Bot } from "lucide-react";

function formatCondition(c: any): string {
  if (!c) return "";
  const leftSide =
    c.indicator === "PRICE" ? "Fiyat" : `${c.indicator}(${c.period ?? 14})`;

  let opStr = "";
  switch (c.operator) {
    case "less_than":
      opStr = "<";
      break;
    case "greater_than":
      opStr = ">";
      break;
    case "equals":
      opStr = "=";
      break;
    case "crosses_above":
      opStr = "▲";
      break;
    case "crosses_below":
      opStr = "▼";
      break;
    default:
      opStr = c.operator ?? "";
  }

  const rightSide =
    c.valueType === "indicator"
      ? c.value === "PRICE"
        ? "Fiyat"
        : `${c.value}(${c.valuePeriod ?? 14})`
      : (c.value ?? "");

  return `${leftSide} ${opStr} ${rightSide}`;
}

function formatCustomStrategy(params: any): string {
  if (!params) return "Parametre yok";
  const buyConds = params.buyConditions || [];
  const sellConds = params.sellConditions || [];
  const buyOp = params.buyOperator || "AND";
  const sellOp = params.sellOperator || "AND";

  const buyOpStr = buyOp === "AND" ? " VE " : " VEYA ";
  const sellOpStr = sellOp === "AND" ? " VE " : " VEYA ";

  const buyStr =
    buyConds.length > 0
      ? `Alım: (${buyConds.map(formatCondition).join(buyOpStr)})`
      : "";
  const sellStr =
    sellConds.length > 0
      ? `Satım: (${sellConds.map(formatCondition).join(sellOpStr)})`
      : "";

  if (buyStr && sellStr) return `${buyStr} | ${sellStr}`;
  return buyStr || sellStr || "Koşul yok";
}

function renderParamsSummary(type: string, params: any) {
  if (!params) return "Parametre yok";
  if (type === "RSI") {
    return `RSI (${params.period ?? 14}) • Al: ${params.oversold ?? 30} / Sat: ${params.overbought ?? 70}`;
  }
  if (type === "SMA_CROSSOVER") {
    return `SMA Kesişimi (${params.fastPeriod ?? 10} / ${params.slowPeriod ?? 50})`;
  }
  if (type === "MACD") {
    return `MACD (${params.fast ?? 12}, ${params.slow ?? 26}, ${params.signal ?? 9})`;
  }
  if (type === "BOLLINGER") {
    return `Bollinger (${params.period ?? 20}, ${params.stdDevMultiplier ?? 2})`;
  }
  if (type === "CUSTOM") {
    return formatCustomStrategy(params);
  }
  return JSON.stringify(params);
}

export default function StrategiesPage() {
  const queryClient = useQueryClient();

  const { data: strategiesData, isLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => fetch("/api/strategies").then((r) => r.json()),
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

  const strategies = strategiesData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Actions Header */}
      <div className="flex justify-end">
        <Link href="/strategies/new" className="w-full sm:w-auto">
          <Button className="bg-foreground text-background hover:bg-foreground/90 font-medium w-full sm:w-auto">
            Yeni Strateji
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-md border border-border w-full overflow-x-auto">
          <Table className="whitespace-nowrap">
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
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : strategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/80 rounded-2xl bg-zinc-950/20 max-w-md mx-auto my-8 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="h-12 w-12 rounded-full bg-zinc-900 border border-border flex items-center justify-center text-muted-foreground shadow-sm">
            <Bot className="h-6 w-6 text-foreground" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-zinc-100">
              Henüz Bir Stratejiniz Yok
            </h2>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Hisse senetleriniz için 7/24 çalışan otomatik alım-satım kuralları
              belirleyin. RSI, Bollinger Bantları veya kendi özel koşullarınızı
              bağlayarak ilk stratejinizi şimdi oluşturun.
            </p>
          </div>
          <Link href="/strategies/new">
            <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs px-5 h-9">
              İlk Stratejini Oluştur →
            </Button>
          </Link>
        </div>
      ) : (
        /* Table */
        <div className="rounded-md border border-border w-full overflow-x-auto">
          <Table className="whitespace-nowrap">
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
              {strategies.map(
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
                    <TableCell className="text-sm font-medium">
                      {s.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.stock?.symbol}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.type.replace("_", " ")}
                    </TableCell>
                    <TableCell
                      className="text-xs text-muted-foreground max-w-[250px] truncate"
                      title={renderParamsSummary(s.type, s.params)}
                    >
                      {renderParamsSummary(s.type, s.params)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({
                            id: s.id,
                            enabled: checked,
                          })
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
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
