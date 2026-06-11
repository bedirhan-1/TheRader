"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AlgorithmsPage() {
  const algorithms = [
    {
      id: "RSI",
      title: "RSI (Göreceli Güç Endeksi)",
      description: "Hisse senedinin aşırı alım veya aşırı satım durumunu belirlemek için momentumu ölçen teknik bir göstergedir.",
      parameters: [
        { name: "Period", desc: "RSI hesaplamasında kullanılacak gün sayısı (Varsayılan: 14)" },
        { name: "Oversold", desc: "Alım sinyali için aşırı satım seviye eşiği (Varsayılan: 30)" },
        { name: "Overbought", desc: "Satım sinyali için aşırı alım seviye eşiği (Varsayılan: 70)" }
      ],
      logic: {
        behavior: "Fiyat momentumunun hızını ve yönünü 0 ile 100 arasında bir skora dönüştürür. Aşırı uç değerler trend dönüşlerini işaret eder.",
        buy: "RSI değeri belirlenen 'Oversold' (Aşırı Satım) eşiğinin altına indiğinde (Örn: < 30) varlığın ucuzladığı varsayılarak AL sinyali üretilir.",
        sell: "RSI değeri belirlenen 'Overbought' (Aşırı Alım) eşiğinin üzerine çıktığında (Örn: > 70) varlığın aşırı değerlendiği varsayılarak SAT sinyali üretilir."
      }
    },
    {
      id: "SMA_CROSSOVER",
      title: "SMA Crossover (Basit Hareketli Ortalama Kesişimi)",
      description: "İki farklı zaman periyoduna sahip hareketli ortalamanın kesişim noktalarını takip eden trend takipçi bir indikatördür.",
      parameters: [
        { name: "Fast Period", desc: "Kısa vadeli hareketli ortalama gün sayısı (Varsayılan: 10)" },
        { name: "Slow Period", desc: "Uzun vadeli hareketli ortalama gün sayısı (Varsayılan: 50)" }
      ],
      logic: {
        behavior: "Kısa vadeli ortalama (Hızlı SMA), uzun vadeli ortalamayı (Yavaş SMA) kestiğinde yön değişimi tespiti yapar.",
        buy: "Hızlı SMA çizgisi, Yavaş SMA çizgisini yukarı yönlü kestiğinde (Golden Cross - Altın Kesişim) güçlü bir yükseliş trendi başlangıcı kabul edilerek AL sinyali üretilir.",
        sell: "Hızlı SMA çizgisi, Yavaş SMA çizgisini aşağı yönlü kestiğinde (Death Cross - Ölüm Kesişimi) düşüş trendi başlangıcı kabul edilerek SAT sinyali üretilir."
      }
    },
    {
      id: "MACD",
      title: "MACD (Hareketli Ortalama Yakınlaşma Iraksama)",
      description: "İki üssel hareketli ortalama (EMA) arasındaki ilişkiyi gösteren, trend takip eden dinamik bir momentum indikatörüdür.",
      parameters: [
        { name: "Fast EMA", desc: "Hızlı üssel ortalama periyodu (Varsayılan: 12)" },
        { name: "Slow EMA", desc: "Yavaş üssel ortalama periyodu (Varsayılan: 26)" },
        { name: "Signal EMA", desc: "MACD fark çizgisinin sinyal periyodu (Varsayılan: 9)" }
      ],
      logic: {
        behavior: "Hızlı EMA'dan yavaş EMA çıkarılarak MACD çizgisi elde edilir. Bu çizginin 9 periyotluk EMA'sı ise Sinyal çizgisini oluşturur.",
        buy: "MACD çizgisi, Sinyal çizgisini aşağıdan yukarıya doğru kestiğinde momentumun pozitife döndüğü kabul edilerek AL sinyali üretilir.",
        sell: "MACD çizgisi, Sinyal çizgisini yukarıdan aşağıya doğru kestiğinde momentumun negatife döndüğü kabul edilerek SAT sinyali üretilir."
      }
    },
    {
      id: "BOLLINGER",
      title: "Bollinger Bands (Bollinger Bantları)",
      description: "Fiyat oynaklığını (volatilite) standart sapma kullanarak ölçen ve fiyatın hareket alanını bantlar şeklinde çizen bir volatilite indikatörüdür.",
      parameters: [
        { name: "Period", desc: "Kanal ortalaması için kullanılacak hareketli ortalama gün sayısı (Varsayılan: 20)" },
        { name: "StdDev Multiplier", desc: "Kanal genişliğini belirleyen standart sapma katsayısı (Varsayılan: 2)" }
      ],
      logic: {
        behavior: "Orta bant 20 günlük SMA'dır. Üst ve alt bantlar ise bu SMA'ya 2 standart sapma eklenip çıkarılarak bulunur. Fiyat genelde bu kanalda hareket eder.",
        buy: "Fiyat alt bandın altına sarktığında veya dokunduğunda varlığın kısa vadede aşırı satıldığı ve tepki alımı geleceği varsayılarak AL sinyali üretilir.",
        sell: "Fiyat üst bandın üzerine çıktığında veya dokunduğunda varlığın aşırı alındığı ve kar satışı gelebileceği varsayılarak SAT sinyali üretilir."
      }
    },
    {
      id: "CUSTOM",
      title: "Custom Automation (Özel Otomasyon Oluşturucu)",
      description: "Kullanıcıların kendi mantıksal kurallarını, göstergeleri ve sınır değerlerini belirleyerek özel alım-satım senaryoları tasarlayabileceği gelişmiş kural motorudur.",
      parameters: [
        { name: "Buy Conditions", desc: "Alım (BUY) emrinin tetiklenmesi için sağlanması gereken mantıksal koşullar listesi." },
        { name: "Sell Conditions", desc: "Satım (SELL) emrinin tetiklenmesi için sağlanması gereken mantıksal koşullar listesi." },
        { name: "Operator (AND/OR)", desc: "Koşulların hepsi mi sağlanmalı (AND) yoksa biri yeterli mi (OR) kuralı." }
      ],
      logic: {
        behavior: "Kullanıcı tarafından oluşturulan kural bloklarını (örn: 'RSI(14) < 30 VE Fiyat > SMA(50)') gerçek zamanlı bar verileri üzerinde işler.",
        buy: "Alım koşulları bloğundaki kuralların tamamı (AND seçildiyse) veya en az biri (OR seçildiyse) sağlandığında AL sinyali üretilir.",
        sell: "Satım koşulları bloğundaki kuralların tamamı veya en az biri sağlandığında SAT sinyali üretilir."
      }
    }
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Algoritma Kütüphanesi</h1>
        <p className="text-xs text-muted-foreground mt-1">
          The Rader üzerinde hisselerinize atayabileceğiniz teknik analiz algoritmalarının çalışma mantığı ve sinyal koşulları.
        </p>
      </div>

      {/* Grid of Algorithms */}
      <div className="space-y-6">
        {algorithms.map((algo) => (
          <Card key={algo.id} className="border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border bg-zinc-900/10 py-4 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">{algo.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{algo.description}</p>
              </div>
              <Badge variant="outline" className="font-mono bg-zinc-900 text-xs">
                {algo.id}
              </Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Core Logic Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Genel Davranış</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{algo.logic.behavior}</p>
                </div>
                <div className="space-y-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success"></span> Alım Koşulu (BUY)
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{algo.logic.buy}</p>
                </div>
                <div className="space-y-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-danger flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger"></span> Satım Koşulu (SELL)
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{algo.logic.sell}</p>
                </div>
              </div>

              {/* Parameters Table */}
              <div className="border border-border rounded-lg overflow-hidden bg-zinc-900/15">
                <div className="bg-zinc-900/30 px-4 py-2 border-b border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Yapılandırma Parametreleri</span>
                </div>
                <div className="divide-y divide-border">
                  {algo.parameters.map((param, i) => (
                    <div key={i} className="flex px-4 py-2.5 items-center gap-4 text-xs">
                      <span className="font-mono font-semibold text-zinc-300 min-w-[120px]">{param.name}</span>
                      <span className="text-muted-foreground">{param.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
