"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, RefreshCw, ShieldCheck, Search } from "lucide-react";

interface StrategyLog {
  id: string;
  createdAt: string;
  strategyName: string;
  symbol: string;
  signalType: string;
  message: string | null;
}

function TradingViewChart({ symbol }: { symbol: string }) {
  // Use official stable TradingView embed iframe for maximum reliability with React state changes
  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-0 bg-zinc-950 flex-1 relative rounded-lg overflow-hidden border border-zinc-900">
      <iframe
        src={`https://s.tradingview.com/widgetembed/?symbol=${symbol.toUpperCase()}&interval=D&theme=dark&style=1&timezone=exchange&locale=tr`}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
      />
    </div>
  );
}

export function StrategyLogs() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartSymbol, setChartSymbol] = useState("AMD");
  const [searchInput, setSearchInput] = useState("AMD");

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const scanInterval = settingsData?.data?.scanInterval ?? 5;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["strategy-logs"],
    queryFn: () => fetch("/api/strategy-logs").then((r) => r.json()),
    refetchInterval: scanInterval * 1000,
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/strategy-logs", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear logs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy-logs"] });
      toast.success("Tarama logları temizlendi");
    },
    onError: () => {
      toast.error("Loglar temizlenirken hata oluştu");
    },
  });

  const logs: StrategyLog[] = data?.data ?? [];

  // Set default chart symbol to first log symbol if available
  useEffect(() => {
    if (logs.length > 0 && chartSymbol === "AMD") {
      const firstSymbol = logs[0].symbol;
      setChartSymbol(firstSymbol);
      setSearchInput(firstSymbol);
    }
  }, [logs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setChartSymbol(searchInput.trim().toUpperCase());
    }
  };

  const getBadgeColor = (signal: string) => {
    switch (signal.toUpperCase()) {
      case "BUY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "SELL":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "HOLD":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "SKIP":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "ERROR":
        return "bg-red-600/10 text-red-400 border-red-600/20";
      case "MARKET_CLOSED":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Card 
      className={cn(
        "border-border bg-card transition-all duration-250",
        isFullscreen ? "fixed inset-0 z-50 bg-black/98 p-6 flex flex-col h-screen w-screen overflow-hidden rounded-none border-0" : ""
      )}
    >
      <CardHeader className={cn("pb-3 flex flex-row items-center justify-between", isFullscreen ? "px-0 pt-0" : "")}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Sistem Tarama Logları
            </CardTitle>
            {isFullscreen && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/25 text-[9px] px-1.5 py-0">
                Trader Modu Aktif
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Her {scanInterval}s'de güncellenir
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending || logs.length === 0}
            className="h-7 text-[10px] px-2.5 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {clearLogsMutation.isPending ? "Temizleniyor..." : "Logları Temizle"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center"
            title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran (Trader Görünümü)"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={cn("flex-1 min-h-0", isFullscreen ? "px-0 pb-0 flex flex-col" : "")}>
        {isFullscreen ? (
          /* Split Screen layout in Fullscreen Mode */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
            {/* Left Column: Logs Terminal (40% width) */}
            <div className="lg:col-span-2 flex flex-col min-h-0 border border-zinc-900 bg-zinc-950/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase font-mono">
                  Sistem Terminal Çıktıları
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              
              {isLoading ? (
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-10 w-full bg-zinc-900" />
                  <Skeleton className="h-10 w-full bg-zinc-900" />
                  <Skeleton className="h-10 w-full bg-zinc-900" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono">
                  [Sistem] Log kaydı bulunmuyor.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent font-mono text-[11px]">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col gap-1.5 p-2 rounded border border-zinc-900/80 bg-black/45"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 font-semibold">
                            [{formatTime(log.createdAt)}]
                          </span>
                          <span className="text-zinc-300 font-medium truncate max-w-[150px]">
                            {log.strategyName}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 font-bold bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-500 transition-colors" onClick={() => { setChartSymbol(log.symbol); setSearchInput(log.symbol); }}>
                            {log.symbol}
                          </Badge>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.2 border uppercase scale-90 origin-right",
                            getBadgeColor(log.signalType)
                          )}
                        >
                          {log.signalType === "MARKET_CLOSED" ? "PİYASA KAPALI" : log.signalType}
                        </Badge>
                      </div>
                      <div className="text-zinc-400 break-words leading-relaxed pl-1 border-l border-zinc-850">
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Live TradingView Chart & Selector (60% width) */}
            <div className="lg:col-span-3 flex flex-col min-h-0 space-y-4">
              {/* Chart Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/65 border border-zinc-900 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-455 tracking-wider uppercase font-mono">
                    Grafik İzleyici:
                  </span>
                  <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700 text-xs px-2.5 py-0.5 font-bold font-mono">
                    {chartSymbol}
                  </Badge>
                </div>
                
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 max-w-xs w-full sm:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <Input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Sembol ara (örn: AAPL)"
                      className="h-8 pl-8 pr-2 bg-black border-zinc-800 text-xs focus-visible:ring-purple-500/35 focus-visible:ring-offset-0 w-full"
                    />
                  </div>
                  <Button type="submit" className="h-8 px-3 bg-zinc-200 hover:bg-white text-black text-xs font-semibold rounded-md">
                    Takip Et
                  </Button>
                </form>
              </div>

              {/* Advanced Chart Widget */}
              <TradingViewChart symbol={chartSymbol} />
            </div>
          </div>
        ) : (
          /* Normal Dashboard view (logs only) */
          isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground font-mono">
              Henüz tarama kaydı bulunmuyor. Aktif bir strateji olduğundan emin olun.
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-2.5 rounded border border-border bg-zinc-950/40 gap-2 font-mono"
                >
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-zinc-500 font-semibold shrink-0">
                      [{formatTime(log.createdAt)}]
                    </span>
                    <span className="text-zinc-300 font-medium truncate max-w-[120px]">
                      {log.strategyName}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0 font-bold bg-zinc-900 border-zinc-800">
                      {log.symbol}
                    </Badge>
                    <span className="text-zinc-400 truncate text-[11px] ml-1">
                      {log.message}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 shrink-0 self-start sm:self-center border uppercase",
                      getBadgeColor(log.signalType)
                    )}
                  >
                    {log.signalType === "MARKET_CLOSED" ? "PİYASA KAPALI" : log.signalType}
                  </Badge>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
