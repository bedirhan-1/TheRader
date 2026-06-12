"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Condition {
  indicator: "PRICE" | "RSI" | "SMA" | "EMA";
  period?: number;
  operator:
    | "less_than"
    | "greater_than"
    | "equals"
    | "crosses_above"
    | "crosses_below";
  valueType: "number" | "indicator";
  value: string;
  valuePeriod?: number;
}

const PRESETS = [
  {
    name: "RSI Aşırı Uç Eşikleri (RSI 14)",
    description:
      "RSI değeri 30'un altına indiğinde alım yapar, 70'in üzerine çıktığında satım yapar. (Popüler Momentum İndikatörü)",
    params: {
      buyOperator: "AND",
      buyConditions: [
        {
          indicator: "RSI",
          period: 14,
          operator: "less_than",
          valueType: "number",
          value: "30",
        },
      ],
      sellOperator: "AND",
      sellConditions: [
        {
          indicator: "RSI",
          period: 14,
          operator: "greater_than",
          valueType: "number",
          value: "70",
        },
      ],
    },
  },
  {
    name: "Hareketli Ortalama (SMA 50) Fiyat Takibi",
    description:
      "Fiyat SMA 50'nin üzerine çıktığında yükseliş trendi teyit edilir ve alım yapılır, altına indiğinde satım yapılır.",
    params: {
      buyOperator: "AND",
      buyConditions: [
        {
          indicator: "PRICE",
          operator: "greater_than",
          valueType: "indicator",
          value: "SMA",
          valuePeriod: 50,
        },
      ],
      sellOperator: "AND",
      sellConditions: [
        {
          indicator: "PRICE",
          operator: "less_than",
          valueType: "indicator",
          value: "SMA",
          valuePeriod: 50,
        },
      ],
    },
  },
  {
    name: "RSI & EMA Trend Filtresi",
    description:
      "Uzun vadeli yükseliş trendi (Fiyat > EMA 200) devam ederken, RSI kısa vadede aşırı satım (30) gösterdiğinde alım yapar.",
    params: {
      buyOperator: "AND",
      buyConditions: [
        {
          indicator: "RSI",
          period: 14,
          operator: "less_than",
          valueType: "number",
          value: "30",
        },
        {
          indicator: "PRICE",
          operator: "greater_than",
          valueType: "indicator",
          value: "EMA",
          valuePeriod: 200,
        },
      ],
      sellOperator: "OR",
      sellConditions: [
        {
          indicator: "RSI",
          period: 14,
          operator: "greater_than",
          valueType: "number",
          value: "70",
        },
        {
          indicator: "PRICE",
          operator: "less_than",
          valueType: "indicator",
          value: "EMA",
          valuePeriod: 200,
        },
      ],
    },
  },
];

interface ConditionCardProps {
  cond: Condition;
  onChange: (c: Condition) => void;
  onDelete: () => void;
}

function ConditionCard({ cond, onChange, onDelete }: ConditionCardProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-zinc-900/35 p-3 rounded-lg border border-border text-xs w-full">
      {/* Sol Taraf İndikatör */}
      <Select
        value={cond.indicator}
        onValueChange={(v: any) => {
          const updates: any = { indicator: v };
          if (v === "PRICE") {
            updates.period = undefined;
          } else if (cond.period === undefined) {
            updates.period = 14;
          }
          onChange({ ...cond, ...updates });
        }}
      >
        <SelectTrigger className="h-8 w-24 bg-background border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PRICE">Fiyat</SelectItem>
          <SelectItem value="RSI">RSI</SelectItem>
          <SelectItem value="SMA">SMA</SelectItem>
          <SelectItem value="EMA">EMA</SelectItem>
        </SelectContent>
      </Select>

      {/* Sol Taraf Periyot */}
      {cond.indicator !== "PRICE" && (
        <div className="flex items-center gap-1 bg-background/50 border border-border rounded-md px-2 h-8">
          <span className="text-muted-foreground text-[10px]">Periyot:</span>
          <Input
            type="number"
            value={cond.period ?? 14}
            onChange={(e) =>
              onChange({ ...cond, period: parseInt(e.target.value) || 14 })
            }
            className="h-6 w-12 border-0 bg-transparent p-0 text-center text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      )}

      {/* Karşılaştırma */}
      <Select
        value={cond.operator}
        onValueChange={(v: any) => onChange({ ...cond, operator: v })}
      >
        <SelectTrigger className="h-8 w-32 bg-background border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="less_than">Küçüktür (&lt;)</SelectItem>
          <SelectItem value="greater_than">Büyüktür (&gt;)</SelectItem>
          <SelectItem value="equals">Eşittir (=)</SelectItem>
          <SelectItem value="crosses_above">Yukarı Keser</SelectItem>
          <SelectItem value="crosses_below">Aşağı Keser</SelectItem>
        </SelectContent>
      </Select>

      {/* Sağ Taraf Türü & İndikatör */}
      <Select
        value={cond.valueType === "number" ? "number" : cond.value}
        onValueChange={(val) => {
          if (val === "number") {
            onChange({
              ...cond,
              valueType: "number",
              value: "30",
              valuePeriod: undefined,
            });
          } else {
            onChange({
              ...cond,
              valueType: "indicator",
              value: val as any,
              valuePeriod: val === "PRICE" ? undefined : 14,
            });
          }
        }}
      >
        <SelectTrigger className="h-8 w-36 bg-background border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="number">Sabit Sayı</SelectItem>
          <SelectItem value="PRICE">Fiyat (PRICE)</SelectItem>
          <SelectItem value="RSI">RSI</SelectItem>
          <SelectItem value="SMA">SMA (Ortalama)</SelectItem>
          <SelectItem value="EMA">EMA (Ortalama)</SelectItem>
        </SelectContent>
      </Select>

      {/* Sağ Taraf Parametreleri */}
      {cond.valueType === "number" ? (
        <Input
          type="number"
          step="any"
          value={cond.value}
          onChange={(e) => onChange({ ...cond, value: e.target.value })}
          className="h-8 w-24 bg-background border-border"
          placeholder="Değer girin"
        />
      ) : (
        cond.value !== "PRICE" && (
          <div className="flex items-center gap-1 bg-background/50 border border-border rounded-md px-2 h-8">
            <span className="text-muted-foreground text-[10px]">Periyot:</span>
            <Input
              type="number"
              value={cond.valuePeriod ?? 14}
              onChange={(e) =>
                onChange({
                  ...cond,
                  valuePeriod: parseInt(e.target.value) || 14,
                })
              }
              className="h-6 w-12 border-0 bg-transparent p-0 text-center text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        )
      )}

      {/* Silme Butonu */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-zinc-900/40 ml-auto"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function NewStrategyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbolParam = searchParams?.get("symbol");
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    stockId: "",
    type: "RSI" as string,
    action: "BUY" as string,
    orderType: "MARKET" as string,
    qty: "10",
    enabled: true,
    params: { period: 14, oversold: 30, overbought: 70 } as Record<string, any>,
  });

  const { data: stocksData } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => fetch("/api/stocks").then((r) => r.json()),
  });

  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: () => fetch("/api/positions").then((r) => r.json()),
  });

  const stocks = stocksData?.data ?? [];
  const positions = positionsData?.data ?? [];

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
      toast.success("Strateji başarıyla oluşturuldu");
      router.push("/strategies");
    },
    onError: () => toast.error("Strateji oluşturulurken hata oluştu"),
  });

  const getStockIdFromSymbol = (symbol: string): string => {
    const stock = stocks.find((s: any) => s.symbol === symbol);
    return stock ? stock.id : "";
  };

  useEffect(() => {
    if (symbolParam && stocks.length > 0) {
      const sId = getStockIdFromSymbol(symbolParam);
      if (sId) {
        setFormData((prev) => ({
          ...prev,
          stockId: sId,
          name: `${symbolParam.toUpperCase()} - ${prev.type.replace("_", " ")}`,
        }));
        setStep(2);
      }
    }
  }, [symbolParam, stocks]);

  const handleSelectStock = (symbol: string) => {
    const sId = getStockIdFromSymbol(symbol);
    if (sId) {
      setFormData((prev) => ({
        ...prev,
        stockId: sId,
        name: `${symbol} - ${prev.type.replace("_", " ")}`,
      }));
      setStep(2);
    } else {
      toast.error(`${symbol} hissesi sistem takip listesinde bulunamadı.`);
    }
  };

  const handleSelectDbStock = (id: string) => {
    const stock = stocks.find((s: any) => s.id === id);
    if (stock) {
      setFormData((prev) => ({
        ...prev,
        stockId: id,
        name: `${stock.symbol} - ${prev.type.replace("_", " ")}`,
      }));
      setStep(2);
    }
  };

  function getDefaultParams(type: string) {
    switch (type) {
      case "RSI":
        return { period: 14, oversold: 30, overbought: 70 };
      case "SMA_CROSSOVER":
        return { fastPeriod: 10, slowPeriod: 50 };
      case "MACD":
        return { fast: 12, slow: 26, signal: 9 };
      case "BOLLINGER":
        return { period: 20, stdDevMultiplier: 2 };
      case "CUSTOM":
        return {
          buyConditions: [],
          sellConditions: [],
          buyOperator: "AND",
          sellOperator: "AND",
        };
      default:
        return {};
    }
  }

  const updateCustomParams = (updater: (prev: any) => any) => {
    setFormData((prev) => ({
      ...prev,
      params: updater(prev.params || {}),
    }));
  };

  const handleParamChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      params: {
        ...prev.params,
        [key]: value,
      },
    }));
  };

  const getAlgoDescription = (type: string) => {
    switch (type) {
      case "RSI":
        return "momentumu ölçen popüler bir teknik indikatördür. Varlık aşırı satıldığında (varsayılan: < 30) ucuzladığı kabul edilerek ALIM, aşırı alındığında ise (> 70) kar satışları beklentisiyle SATIM sinyali üretir.";
      case "SMA_CROSSOVER":
        return "iki farklı vadeli hareketli ortalamanın birbirini kesmesini takip eder. Kısa vadeli ortalama uzun vadeli ortalamayı yukarı kestiğinde (Golden Cross) yükseliş trendi tespitiyle ALIM, aşağı kestiğinde ise SATIM sinyali üretir.";
      case "MACD":
        return "trend yönünü ve momentum gücünü ölçen dinamik bir indikatördür. MACD çizgisi sinyal çizgisini aşağıdan yukarıya kestiğinde ALIM, yukarıdan aşağıya kestiğinde SATIM sinyali üretir.";
      case "BOLLINGER":
        return "fiyat oynaklığını standart sapmalar kullanarak sınırlar. Fiyat kanalın alt bandının altına sarktığında tepki alımı geleceği varsayımıyla ALIM, üst bandı aştığında ise düzeltme beklentisiyle SATIM sinyali üretir.";
      case "CUSTOM":
        return "kendi teknik analiz formüllerinizi ve kural dizilerinizi tasarlamanıza izin verir. İstediğiniz indikatörleri VE (AND) veya VEYA (OR) bağlaçları ile birleştirerek tamamen size özel bir otomasyon kurabilirsiniz.";
      default:
        return "";
    }
  };

  const handleGoToStep3 = () => {
    if (!formData.stockId) {
      toast.error("Lütfen önce bir hisse senedi seçin.");
      setStep(1);
      return;
    }
    if (formData.type === "CUSTOM") {
      const params = formData.params as any;
      const buyCount = params.buyConditions?.length ?? 0;
      const sellCount = params.sellConditions?.length ?? 0;
      if (buyCount === 0 && sellCount === 0) {
        toast.error("Lütfen en az bir alım veya satım koşulu ekleyin.");
        return;
      }
    }
    // Auto populate strategy name based on stock symbol and strategy type
    const selectedStock = stocks.find((s: any) => s.id === formData.stockId);
    if (selectedStock) {
      setFormData((prev) => ({
        ...prev,
        name:
          prev.name ||
          `${selectedStock.symbol} - ${prev.type.replace("_", " ")}`,
      }));
    }
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.stockId || !formData.qty) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }
    createMutation.mutate(formData);
  };

  const selectedStock = stocks.find((s: any) => s.id === formData.stockId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full pb-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3">
        <div className="space-y-0.5">
          <Link
            href="/strategies"
            className="inline-flex items-center text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Stratejilere Geri Dön
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
            Yeni Otomatik Strateji
          </h1>
        </div>

        {/* Modern Stepper in the Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium bg-zinc-900/40 border border-border/50 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 backdrop-blur-sm">
          {/* Step 1 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all duration-300",
                step === 1
                  ? "bg-violet-600 border-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                  : step > 1
                    ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                    : "bg-transparent border-zinc-800 text-zinc-600",
              )}
            >
              {step > 1 ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" /> : "1"}
            </div>
            <span
              className={cn(
                "hidden sm:inline transition-colors duration-300",
                step === 1
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground",
              )}
            >
              Hisse
            </span>
          </div>
 
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/30" />
 
          {/* Step 2 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all duration-300",
                step === 2
                  ? "bg-violet-600 border-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                  : step > 2
                    ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                    : "bg-transparent border-zinc-800 text-zinc-600",
              )}
            >
              {step > 2 ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.5]" /> : "2"}
            </div>
            <span
              className={cn(
                "hidden sm:inline transition-colors duration-300",
                step === 2
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground",
              )}
            >
              Algoritma
            </span>
          </div>
 
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/30" />
 
          {/* Step 3 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all duration-300",
                step === 3
                  ? "bg-violet-600 border-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                  : "bg-transparent border-zinc-800 text-zinc-600",
              )}
            >
              3
            </div>
            <span
              className={cn(
                "hidden sm:inline transition-colors duration-300",
                step === 3
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground",
              )}
            >
              Onay
            </span>
          </div>
        </div>
      </div>

      {/* Step Contents */}
      <div className="space-y-4">
        {/* STEP 1: STOCK SELECTION */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-200">
                1. Adım: Hangi Hisse Senedine Strateji Bağlanacak?
              </h2>
              <p className="text-[11px] text-muted-foreground">
                İlk olarak alım-satım kurallarını bağlamak istediğiniz hisseyi
                seçin. Cüzdanınızdaki varlıklardan başlayabilirsiniz.
              </p>
            </div>

            {/* Owned Portfolio Positions */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground font-medium">
                Cüzdanınızda Bulunan Hisseleriniz
              </Label>
              {positionsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-border rounded-xl bg-zinc-950/15">
                  <p className="text-xs text-muted-foreground">
                    Cüzdanınızda şu an açık pozisyon bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {positions.map((pos: any) => (
                    <button
                      key={pos.asset_id}
                      type="button"
                      onClick={() => handleSelectStock(pos.symbol)}
                      className="p-4 rounded-xl border border-border bg-zinc-950/30 hover:bg-zinc-900/40 hover:border-foreground/35 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-zinc-850 border border-white/5 font-mono text-[10px] font-bold text-zinc-300">
                          <img
                            src={`https://images.financialmodelingprep.com/symbol/${pos.symbol}.png`}
                            alt={pos.symbol}
                            className="absolute inset-0 h-full w-full rounded-full object-contain bg-zinc-900"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = "0";
                            }}
                          />
                          {pos.symbol[0]}
                        </div>
                        <div>
                          <span className="font-mono text-sm font-semibold text-foreground group-hover:text-success transition-colors block">
                            {pos.symbol}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Bakiye: {parseFloat(pos.qty)} Adet
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-medium block">
                          ${parseFloat(pos.market_value).toFixed(2)}
                        </span>
                        <div className="h-4 flex items-center">
                          <span className="text-[9px] text-muted-foreground block group-hover:hidden transition-all duration-200">
                            Piyasa Değeri
                          </span>
                          <span className="text-[9px] text-success font-bold hidden group-hover:inline-flex items-center transition-all duration-200 animate-in fade-in slide-in-from-right-1">
                            Strateji Bağla →
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Other tracked stocks search selector */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <Label className="text-xs text-muted-foreground font-medium">
                Diğer Takip Listesindeki Hisseler
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Cüzdanınızda bulunmayan ama izleme listenizde olan diğer
                hisselere de kural bağlayabilirsiniz:
              </p>
              <div className="max-w-md">
                <Select onValueChange={(v: any) => v && handleSelectDbStock(v)}>
                  <SelectTrigger className="border-border bg-background h-10">
                    <SelectValue placeholder="İzleme listenizden hisse seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks
                      .filter(
                        (s: any) =>
                          !positions.some((p: any) => p.symbol === s.symbol),
                      )
                      .map(
                        (s: {
                          id: string;
                          symbol: string;
                          name: string | null;
                        }) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.symbol} {s.name ? `(${s.name})` : ""}
                          </SelectItem>
                        ),
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ALGORITHM SETUP */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Column: Stock and Info */}
            <div className="md:col-span-1 space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-zinc-200">
                  2. Adım: Yapılandırma
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Seçilen varlık ve algoritma türü ayarları.
                </p>
              </div>

              {/* Selected Stock Banner */}
              <div className="flex items-center justify-between bg-zinc-900/30 border border-border p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-white/5 font-mono text-[10px] font-bold text-zinc-350">
                    {selectedStock?.symbol && (
                      <img
                        src={`https://images.financialmodelingprep.com/symbol/${selectedStock.symbol}.png`}
                        alt="Hisse"
                        className="absolute inset-0 h-full w-full rounded-full object-contain bg-zinc-900"
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = "0";
                        }}
                      />
                    )}
                    {selectedStock?.symbol?.[0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block leading-tight">
                      {selectedStock?.symbol}
                    </span>
                    <span className="text-[9px] text-muted-foreground block truncate max-w-[90px]">
                      {selectedStock?.name ?? "Seçilen Hisse"}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2.5 border-border bg-background hover:bg-zinc-900/20"
                  onClick={() => setStep(1)}
                >
                  Değiştir
                </Button>
              </div>

              {/* Algorithm Type and Info */}
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Algoritma Türü
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          type: v ?? "RSI",
                          params: getDefaultParams(v ?? "RSI"),
                        })
                      }
                    >
                      <SelectTrigger className="border-border bg-background h-8.5 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RSI">RSI (Göreceli Güç)</SelectItem>
                        <SelectItem value="SMA_CROSSOVER">
                          SMA Kesişimi
                        </SelectItem>
                        <SelectItem value="MACD">MACD</SelectItem>
                        <SelectItem value="BOLLINGER">
                          Bollinger Bands
                        </SelectItem>
                        <SelectItem value="CUSTOM">Özel Otomasyon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-zinc-900/25 border border-border/70 rounded-lg p-3 text-[11px] text-zinc-350 leading-normal flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-200 block mb-0.5">
                        {formData.type.replace("_", " ")} Nedir?
                      </span>
                      {getAlgoDescription(formData.type)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Parameters and Actions */}
            <div className="md:col-span-2 space-y-4">
              <Card className="border-border bg-card">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-bold text-zinc-200">
                    Algoritma Parametreleri
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Seçilen indikatörün tetikleyici eşik değerlerini girin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {/* Algorithm parameters fields */}
                  <div className="border border-border/60 rounded-lg p-4 bg-zinc-900/10 space-y-4">
                    {formData.type === "RSI" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Period (Periyot)
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .period ?? 14
                            }
                            onChange={(e) =>
                              handleParamChange("period", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            Hesaplamada kullanılan son bar (gün) sayısı.
                            Varsayılan 14'tür.
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Oversold (Alım Eşiği)
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .oversold ?? 30
                            }
                            onChange={(e) =>
                              handleParamChange("oversold", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            RSI bu seviyenin altına indiğinde hisse ucuz kabul
                            edilir ve ALIM yapılır. (Genelde 30)
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Overbought (Satım Eşiği)
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .overbought ?? 70
                            }
                            onChange={(e) =>
                              handleParamChange("overbought", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            RSI bu seviyenin üzerine çıktığında hisse pahalı
                            kabul edilir ve SATIM yapılır. (Genelde 70)
                          </span>
                        </div>
                      </div>
                    )}

                    {formData.type === "SMA_CROSSOVER" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Hızlı SMA Periyodu
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .fastPeriod ?? 10
                            }
                            onChange={(e) =>
                              handleParamChange("fastPeriod", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            Kısa vadeli hareketli ortalama gün sayısı (Örn: 10).
                            Fiyat değişimlerine daha duyarlıdır.
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Yavaş SMA Periyodu
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .slowPeriod ?? 50
                            }
                            onChange={(e) =>
                              handleParamChange("slowPeriod", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            Uzun vadeli hareketli ortalama gün sayısı (Örn: 50).
                            Ana trend yönünü temsil eder.
                          </span>
                        </div>
                      </div>
                    )}

                    {formData.type === "MACD" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Hızlı EMA Periyodu
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .fast ?? 12
                            }
                            onChange={(e) =>
                              handleParamChange("fast", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            Hızlı hareket eden üssel ortalama periyodu.
                            Varsayılan 12'dir.
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Yavaş EMA Periyodu
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .slow ?? 26
                            }
                            onChange={(e) =>
                              handleParamChange("slow", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            Yavaş hareket eden üssel ortalama periyodu.
                            Varsayılan 26'dır.
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Sinyal EMA Periyodu
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .signal ?? 9
                            }
                            onChange={(e) =>
                              handleParamChange("signal", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            MACD fark çizgisinin kendi hareketli ortalama
                            periyodu. Varsayılan 9'dur.
                          </span>
                        </div>
                      </div>
                    )}

                    {formData.type === "BOLLINGER" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Periyot (Period)
                          </Label>
                          <Input
                            type="number"
                            value={
                              (formData.params as Record<string, number>)
                                .period ?? 20
                            }
                            onChange={(e) =>
                              handleParamChange("period", +e.target.value)
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            Bantların ortasındaki basit hareketli ortalama gün
                            sayısı. Varsayılan 20'dir.
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Standart Sapma Çarpanı (StdDev)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={
                              (formData.params as Record<string, number>)
                                .stdDevMultiplier ?? 2
                            }
                            onChange={(e) =>
                              handleParamChange(
                                "stdDevMultiplier",
                                parseFloat(e.target.value) || 2,
                              )
                            }
                            className="border-border bg-background"
                          />
                          <span className="text-[10px] text-muted-foreground block leading-normal">
                            Bant genişliğini belirleyen standart sapma
                            katsayısı. Fiyatların %95'i bu bant içinde kalır.
                            (Varsayılan: 2)
                          </span>
                        </div>
                      </div>
                    )}

                    {formData.type === "CUSTOM" && (
                      <div className="space-y-6">
                        {/* Presets */}
                        <div className="space-y-2 border border-border rounded-lg p-4 bg-zinc-950/20">
                          <Label className="text-xs font-semibold text-zinc-200">
                            ⚡ Hızlı Şablonlar (Hazır Mantıklar)
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Kendi otomasyonunuzu sıfırdan kurmak yerine,
                            aşağıdaki hazır şablonlardan birini tek tıkla
                            uygulayabilirsiniz:
                          </p>
                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {PRESETS.map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    params: JSON.parse(
                                      JSON.stringify(preset.params),
                                    ),
                                  });
                                  toast.success(
                                    `"${preset.name}" şablonu uygulandı.`,
                                  );
                                }}
                                className="text-left p-3 rounded-lg border border-border bg-background hover:bg-zinc-900/40 transition-colors space-y-1 group"
                              >
                                <span className="text-xs font-medium text-foreground group-hover:text-success transition-colors">
                                  {preset.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground block leading-normal">
                                  {preset.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Buy conditions list */}
                        <div className="space-y-3 border border-border/80 rounded-lg p-4 bg-zinc-950/40">
                          <div className="flex items-center justify-between pb-2.5 border-b border-border">
                            <span className="text-xs font-bold text-success flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-success"></span>
                              Alım Koşulları (BUY)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                Mantıksal Bağlaç:
                              </span>
                              <Select
                                value={
                                  (formData.params as any).buyOperator ?? "AND"
                                }
                                onValueChange={(v) =>
                                  updateCustomParams((p) => ({
                                    ...p,
                                    buyOperator: v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-7 w-24 text-[10px] border-border bg-background font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">VE (AND)</SelectItem>
                                  <SelectItem value="OR">VEYA (OR)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {((formData.params as any).buyConditions ?? []).map(
                              (cond: any, idx: number) => (
                                <ConditionCard
                                  key={idx}
                                  cond={cond}
                                  onChange={(newCond) => {
                                    const newConds = [
                                      ...((formData.params as any)
                                        .buyConditions ?? []),
                                    ];
                                    newConds[idx] = newCond;
                                    updateCustomParams((p) => ({
                                      ...p,
                                      buyConditions: newConds,
                                    }));
                                  }}
                                  onDelete={() => {
                                    const newConds = (
                                      (formData.params as any).buyConditions ??
                                      []
                                    ).filter((_: any, i: number) => i !== idx);
                                    updateCustomParams((p) => ({
                                      ...p,
                                      buyConditions: newConds,
                                    }));
                                  }}
                                />
                              ),
                            )}
                            {((formData.params as any).buyConditions ?? [])
                              .length === 0 && (
                              <p className="text-[11px] text-muted-foreground text-center py-4 bg-zinc-900/10 rounded-md border border-dashed border-border/60">
                                Henüz alım koşulu eklemediniz.
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs border-dashed border-border hover:bg-zinc-900/30"
                            onClick={() => {
                              const newCond = {
                                indicator: "RSI",
                                period: 14,
                                operator: "less_than",
                                valueType: "number",
                                value: "30",
                                valuePeriod: 14,
                              };
                              updateCustomParams((p) => ({
                                ...p,
                                buyConditions: [
                                  ...(p.buyConditions ?? []),
                                  newCond,
                                ],
                              }));
                            }}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Koşul Satırı
                            Ekle
                          </Button>
                        </div>

                        {/* Sell conditions list */}
                        <div className="space-y-3 border border-border/80 rounded-lg p-4 bg-zinc-950/40">
                          <div className="flex items-center justify-between pb-2.5 border-b border-border">
                            <span className="text-xs font-bold text-danger flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-danger"></span>
                              Satım Koşulları (SELL)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                Mantıksal Bağlaç:
                              </span>
                              <Select
                                value={
                                  (formData.params as any).sellOperator ?? "AND"
                                }
                                onValueChange={(v) =>
                                  updateCustomParams((p) => ({
                                    ...p,
                                    sellOperator: v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-7 w-24 text-[10px] border-border bg-background font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">VE (AND)</SelectItem>
                                  <SelectItem value="OR">VEYA (OR)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {(
                              (formData.params as any).sellConditions ?? []
                            ).map((cond: any, idx: number) => (
                              <ConditionCard
                                key={idx}
                                cond={cond}
                                onChange={(newCond) => {
                                  const newConds = [
                                    ...((formData.params as any)
                                      .sellConditions ?? []),
                                  ];
                                  newConds[idx] = newCond;
                                  updateCustomParams((p) => ({
                                    ...p,
                                    sellConditions: newConds,
                                  }));
                                }}
                                onDelete={() => {
                                  const newConds = (
                                    (formData.params as any).sellConditions ??
                                    []
                                  ).filter((_: any, i: number) => i !== idx);
                                  updateCustomParams((p) => ({
                                    ...p,
                                    sellConditions: newConds,
                                  }));
                                }}
                              />
                            ))}
                            {((formData.params as any).sellConditions ?? [])
                              .length === 0 && (
                              <p className="text-[11px] text-muted-foreground text-center py-4 bg-zinc-900/10 rounded-md border border-dashed border-border/60">
                                Henüz satım koşulu eklemediniz.
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs border-dashed border-border hover:bg-zinc-900/30"
                            onClick={() => {
                              const newCond = {
                                indicator: "RSI",
                                period: 14,
                                operator: "greater_than",
                                valueType: "number",
                                value: "70",
                                valuePeriod: 14,
                              };
                              updateCustomParams((p) => ({
                                ...p,
                                sellConditions: [
                                  ...(p.sellConditions ?? []),
                                  newCond,
                                ],
                              }));
                            }}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Koşul Satırı
                            Ekle
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stepper buttons */}
              <div className="flex justify-between items-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-8 border-border bg-background text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Geri Dön (Hisse
                  Değiştir)
                </Button>
                <Button
                  type="button"
                  onClick={handleGoToStep3}
                  className="h-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold px-5"
                >
                  Devam Et <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER RULES & FINAL CONFIRMATION */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Logic details summary card */}
            <div className="md:col-span-1 space-y-4">
              <Card className="border-border bg-card">
                <CardHeader className="py-4 border-b border-border bg-zinc-900/10">
                  <CardTitle className="text-sm font-semibold">
                    Strateji Özeti
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Tasarımınızın çalışma mantığı.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Hedef Varlık
                    </span>
                    <span className="font-mono text-sm font-bold text-zinc-150 block mt-0.5">
                      {selectedStock?.symbol}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {selectedStock?.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Çalışma Mantığı
                    </span>
                    <span className="font-semibold text-zinc-200 block mt-0.5">
                      {formData.type.replace("_", " ")}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 block bg-zinc-900/40 p-2.5 rounded border border-border">
                      {formData.type === "RSI" &&
                        `RSI(14) değeri ${formData.params.oversold ?? 30} seviyesinin altına indiğinde ALIM sinyali, ${formData.params.overbought ?? 70} seviyesinin üzerine çıktığında ise SATIM sinyali üretilip emir tetiklenecektir.`}
                      {formData.type === "SMA_CROSSOVER" &&
                        `Hızlı SMA(${formData.params.fastPeriod ?? 10}) çizgisi, Yavaş SMA(${formData.params.slowPeriod ?? 50}) çizgisini yukarı kestiğinde ALIM; aşağı kestiğinde ise SATIM sinyali üretilerek işlem yapılacaktır.`}
                      {formData.type === "MACD" &&
                        `MACD çizgisi sinyal çizgisini aşağıdan yukarıya kestiğinde ALIM sinyali, yukarıdan aşağıya kestiğinde ise SATIM sinyali üretilecektir.`}
                      {formData.type === "BOLLINGER" &&
                        `Fiyat Bollinger alt bandının (${formData.params.period ?? 20}) altına sarktığında ALIM sinyali; üst bandın üzerine çıktığında SATIM sinyali üretilecektir.`}
                      {formData.type === "CUSTOM" &&
                        `Özel tasarlanan mantıksal kurallar (Alım: ${formData.params.buyConditions?.length ?? 0} kural, Satım: ${formData.params.sellConditions?.length ?? 0} kural) doğrultusunda otomatik sinyaller üretilecektir.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strategy order and status fields card */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-semibold">
                    Emir ve Çalıştırma Ayarları
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Strateji tetiklendiğinde verilecek sipariş koşulları.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Strateji Adı
                      </Label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="border-border bg-background"
                        placeholder="AAPL RSI Aşırı Satım"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        İşlem Yönü
                      </Label>
                      <Select
                        value={formData.action}
                        onValueChange={(v) =>
                          setFormData({ ...formData, action: v ?? "BUY" })
                        }
                      >
                        <SelectTrigger className="border-border bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUY">Al (BUY)</SelectItem>
                          <SelectItem value="SELL">Sat (SELL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Emir Türü
                      </Label>
                      <Select
                        value={formData.orderType}
                        onValueChange={(v) =>
                          setFormData({ ...formData, orderType: v ?? "MARKET" })
                        }
                      >
                        <SelectTrigger className="border-border bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKET">
                            Market (Piyasa)
                          </SelectItem>
                          <SelectItem value="LIMIT">Limit</SelectItem>
                          <SelectItem value="STOP">Stop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Miktar (Adet)
                      </Label>
                      <Input
                        type="number"
                        required
                        value={formData.qty}
                        onChange={(e) =>
                          setFormData({ ...formData, qty: e.target.value })
                        }
                        className="border-border bg-background"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <div className="space-y-0.5">
                      <Label className="text-xs text-muted-foreground">
                        Stratejiyi Hemen Aktifleştir
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Aktif edildiğinde arka planda bar taramaları hemen
                        başlar.
                      </p>
                    </div>
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, enabled: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-9 border-border bg-background text-xs"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Parametrelere Dön
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-9 bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold px-6"
                >
                  {createMutation.isPending
                    ? "Strateji Başlatılıyor..."
                    : "Stratejiyi Başlat ve Canlıya Al"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default function NewStrategyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground animate-pulse">
          Yükleniyor...
        </div>
      }
    >
      <NewStrategyForm />
    </Suspense>
  );
}
