"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Shield,
  Zap,
  ArrowRight,
  LineChart,
  Cpu,
  BarChart3,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <div className="min-h-screen bg-[#060606] text-zinc-100 selection:bg-zinc-800 selection:text-white overflow-hidden relative">
      {/* Vercel Geometric Background Grid Lines */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-linear-to-b from-indigo-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navigation */}
      <header className="relative z-10 border-b border-zinc-900 bg-[#060606]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <img
                src="/logo-small.png"
                alt="Logo"
                className="h-4 w-4 invert"
              />
            </div>
            <span className="font-semibold tracking-tight text-sm text-white">
              The Rader
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              Özellikler
            </a>
            <a
              href="#strategies"
              className="hover:text-white transition-colors"
            >
              Stratejiler
            </a>
            <a href="#why-us" className="hover:text-white transition-colors">
              Neden Biz?
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-20 bg-zinc-900 rounded-md animate-pulse" />
            ) : session ? (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-4 h-8"
                >
                  Paneli Aç <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-300 hover:text-white text-xs h-8"
                  >
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/login?tab=register">
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-4 h-8"
                  >
                    Başla
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-9xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-8">
          Hisselerinizi{" "}
          <span className="bg-linear-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Akıllı Stratejilerle
          </span>{" "}
          Otomatize Edin
        </h1>

        <p className="text-sm md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
          The Rader, teknik göstergeleri (RSI, SMA, MACD) veya tamamen kendi
          oluşturduğunuz kuralları bağlayarak 7/24 otomatik alım-satım yapan
          yeni nesil algoritmik trade asistanıdır.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          {session ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-6 h-10"
              >
                Kontrol Paneline Git <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-6 h-10"
              >
                Hemen Ücretsiz Dene <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <a href="#strategies" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/50 text-xs px-6 h-10"
            >
              Stratejileri İncele
            </Button>
          </a>
        </div>

        {/* Dashboard Mockup Container */}
        <div className="relative max-w-5xl mx-auto rounded-xl border border-zinc-900 bg-zinc-950/40 p-1.5 backdrop-blur-xs shadow-2xl shadow-indigo-500/5 overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
          <div className="rounded-lg border border-zinc-900/80 bg-[#0c0c0c] overflow-hidden aspect-video flex flex-col">
            {/* Mockup Header */}
            <div className="h-8 border-b border-zinc-900 bg-zinc-950 flex items-center px-4 gap-1.5 shrink-0 select-none">
              <div className="h-2 w-2 rounded-full bg-zinc-800" />
              <div className="h-2 w-2 rounded-full bg-zinc-800" />
              <div className="h-2 w-2 rounded-full bg-zinc-800" />
              <div className="h-3 w-40 bg-zinc-900 rounded-md mx-auto text-[8px] text-zinc-600 font-mono flex items-center justify-center">
                therader.com/dashboard
              </div>
            </div>
            {/* Mockup Content Grid */}
            <div className="flex-1 p-4 grid grid-cols-3 gap-3 text-left">
              {/* Left Column */}
              <div className="col-span-2 space-y-3">
                <div className="h-32 bg-zinc-900/50 border border-zinc-900/80 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      PORTFÖY GRAFİĞİ
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      +$1,026.00 (+1.03%)
                    </span>
                  </div>
                  {/* Decorative chart vector */}
                  <svg
                    className="w-full h-16 text-indigo-500/20"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 20 Q 25 15, 50 18 T 100 5 L 100 20 Z"
                      fill="currentColor"
                    />
                    <path
                      d="M0 20 Q 25 15, 50 18 T 100 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-zinc-900/50 border border-zinc-900/80 rounded-lg p-3 flex flex-col justify-between">
                    <span className="text-[8px] text-zinc-500 font-mono">
                      AKTİF STRATEJİLER
                    </span>
                    <span className="text-lg font-mono font-semibold text-white">
                      4 Aktif
                    </span>
                  </div>
                  <div className="h-16 bg-zinc-900/50 border border-zinc-900/80 rounded-lg p-3 flex flex-col justify-between">
                    <span className="text-[8px] text-zinc-500 font-mono">
                      BEKLEYEN EMİRLER
                    </span>
                    <span className="text-lg font-mono font-semibold text-white">
                      0 Bekleyen
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-1 h-full bg-zinc-900/50 border border-zinc-900/80 rounded-lg p-3 flex flex-col justify-between">
                <span className="text-[10px] text-zinc-500 font-mono">
                  POZİSYONLAR
                </span>
                <div className="space-y-2 flex-1 mt-2">
                  <div className="flex justify-between items-center text-[10px] border-b border-zinc-800/50 pb-1.5">
                    <span className="font-mono text-white">AAPL</span>
                    <span className="font-mono text-emerald-400">+$45.20</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-b border-zinc-800/50 pb-1.5">
                    <span className="font-mono text-white">TSLA</span>
                    <span className="font-mono text-rose-500">-$12.80</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-white">MSFT</span>
                    <span className="font-mono text-emerald-400">+$124.00</span>
                  </div>
                </div>
                <div className="h-5 w-full bg-zinc-900 rounded-sm flex items-center justify-center text-[8px] text-zinc-500 font-mono">
                  Alpaca Canlı Hesap
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Strategy Explainer Section */}
      <section
        id="strategies"
        className="relative z-10 border-t border-zinc-900 bg-zinc-950/20 py-24"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
              Özel Koşullarınızı Oluşturun
            </h2>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
              Hazır algoritmalarla sınırlı kalmayın. Kendi özel alım-satım
              stratejilerinizi VE (AND) / VEYA (OR) bağlaçları ile birleştirip
              sistemimize emanet edin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Box: Graphic Explainer */}
            <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                  STRATEJİ ÖRNEĞİ
                </span>

                {/* Condition blocks */}
                <div className="space-y-3 font-mono text-xs">
                  {/* Buy block */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-emerald-400">
                        ALIM KOŞULLARI (BUY)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[8px] text-zinc-400 font-semibold">
                        VE (AND)
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-zinc-300">
                      <div className="flex items-center justify-between bg-zinc-950 px-2 py-1 rounded border border-zinc-900">
                        <span>RSI (14)</span>
                        <span className="text-zinc-500">&lt;</span>
                        <span className="text-white">30 (Aşırı Satım)</span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-950 px-2 py-1 rounded border border-zinc-900">
                        <span>Hisse Fiyatı</span>
                        <span className="text-zinc-500">&gt;</span>
                        <span className="text-white">
                          EMA (200) (Yükseliş Trendi)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operator connection */}
                  <div className="flex justify-center my-1">
                    <span className="text-zinc-600 text-xs">⬇</span>
                  </div>

                  {/* Action block */}
                  <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Zap className="h-3 w-3 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-300">
                        OTOMATİK EMİR TETİKLENMESİ
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      Alpaca API • Limit Emir
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Value Prop List */}
            <div className="space-y-6 lg:pl-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  Neden Kendi Stratejinizi Kurmalısınız?
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Piyasayı sürekli izlemek yorucu ve duygusaldır. Kuralları bir
                  kere belirleyin, platformumuz saniyeler içinde Alpaca
                  hesabınızda uygulasın.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Sıfır Duygu, Maksimum Disiplin
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Stratejiniz önceden belirlenmiş matematiksel kurallarla
                      çalışır. Korku veya açgözlülük gibi faktörleri ortadan
                      kaldırır.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Cpu className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Karmaşık Koşul Bağlantıları
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      İstediğiniz indikatörleri birbirine bağlayıp (Örn: RSI
                      aşırı satımdayken ve fiyat 50 SMA üzerindeyse) sadece
                      teyit edilmiş fırsatları kovalayın.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <LineChart className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      7/24 Piyasa Denetimi
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Siz uyurken veya çalışırken, arka plandaki kontrol
                      motorumuz anlık barlar üzerinden kurallarınızı test eder.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid Section */}
      <section
        id="features"
        className="relative z-10 py-24 border-t border-zinc-900"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-xl space-y-3 hover:border-zinc-800 transition-colors duration-200">
              <Bot className="h-5 w-5 text-white" />
              <h3 className="text-sm font-semibold text-white">
                Hazır Algoritma Kütüphanesi
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                RSI, MACD, Bollinger Bantları ve SMA Kesişimi gibi popüler
                algoritmaları tek bir tıklamayla hissenize bağlayın.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-xl space-y-3 hover:border-zinc-800 transition-colors duration-200">
              <Shield className="h-5 w-5 text-white" />
              <h3 className="text-sm font-semibold text-white">
                Güvenli API Bağlantısı
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Alpaca API şifreleriniz veritabanımızda yüksek güvenlik
                standartlarında tutulur. Dilediğiniz zaman Paper moduyla test
                edin.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-xl space-y-3 hover:border-zinc-800 transition-colors duration-200">
              <BarChart3 className="h-5 w-5 text-white" />
              <h3 className="text-sm font-semibold text-white">
                Canlı Takip ve Kar/Zarar
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Açık pozisyonlarınızı, bakiye bilgilerinizi ve tetiklenen geçmiş
                emirleri tek bir ekrandan canlı olarak izleyin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Area */}
      <section className="relative z-10 border-t border-zinc-900 bg-[#080808] py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8">
            Portföyünüzü Otomatik Pilot ile Yönetin
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed mb-10">
            Hisse senetlerinizi manuel takip etmeyi bırakın. Hemen ilk
            stratejinizi kurun ve canlandırma gücünü keşfedin.
          </p>

          <div className="flex items-center justify-center">
            {session ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-6 h-10"
                >
                  Şimdi Paneli Başlat <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-6 h-10"
                >
                  Hemen Ücretsiz Katıl <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="relative z-10 border-t border-zinc-900 py-8 text-center text-[10px] text-zinc-500 font-mono">
        &copy; {new Date().getFullYear()} The Rader. Tüm hakları saklıdır. Canlı
        ve Paper portföy yönetimi aracı.
      </footer>
    </div>
  );
}
