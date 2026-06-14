"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck, Radar } from "lucide-react";

export default function MaintenancePage() {
  const [retrying, setRetrying] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await fetch("/api/health-check", { cache: "no-store" });
      if (res.ok) {
        window.location.href = "/";
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  };

  const handleRetry = async () => {
    setRetrying(true);
    const isUp = await checkHealth();
    if (!isUp) {
      setTimeout(() => setRetrying(false), 800);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      await checkHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-zinc-100 font-sans p-6 select-none selection:bg-zinc-800 selection:text-white">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center text-center">
        {/* App Logo */}
        <div className="mb-8 select-none pointer-events-none">
          <img
            src="/logo-big.png"
            alt="The Rader Logo"
            className="h-32 w-auto object-contain"
            style={{ animationDuration: "2.5s" }}
          />
        </div>

        {/* Friendly Status Badge */}
        <div className="mb-4">
          <span className="text-[11px] bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-full text-zinc-450 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
            Otomatik Bağlantı Aktif
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
          Geçici Olarak Hizmet Dışı
        </h1>

        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Sistem optimizasyonları ve planlı bakım çalışmaları nedeniyle
          sunucularımıza şu an erişilemiyor.
        </p>

        {/* User Friendly Info Card */}
        <div className="w-full border border-zinc-900 bg-zinc-950/80 rounded-xl p-5 mb-8 text-left space-y-4">
          <div className="flex gap-3">
            <div className="text-zinc-400 mt-0.5">
              <RefreshCw
                className="w-4 h-4 animate-spin text-zinc-400"
                style={{ animationDuration: "3s" }}
              />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">
                Kesintisiz Takip
              </h4>
              <p className="text-[11px] text-zinc-450 mt-0.5 leading-relaxed">
                Bağlantınız arka planda otomatik olarak test ediliyor. Sistem
                açıldığında bu ekran kendiliğinden kapanacaktır.
              </p>
            </div>
          </div>

          <div className="flex gap-3 border-t border-zinc-900/60 pt-4">
            <div className="text-zinc-400 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-205">
                Verileriniz Güvende
              </h4>
              <p className="text-[11px] text-zinc-450 mt-0.5 leading-relaxed">
                Bu süreçte aktif yatırım stratejileriniz, kayıtlı verileriniz ve
                bakiye bilgileriniz tamamen güvence altındadır.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full bg-white hover:bg-zinc-200 text-black font-semibold h-10 rounded-lg border-0 transition-all text-xs"
        >
          {retrying ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Kontrol Ediliyor...
            </div>
          ) : (
            "Hemen Yeniden Dene"
          )}
        </Button>
      </div>
    </div>
  );
}
