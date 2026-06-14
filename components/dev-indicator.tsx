"use client";

import { useEffect, useState } from "react";
import { Terminal, X, Copy, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function DevIndicator() {
  const [isDev, setIsDev] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [envs, setEnvs] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    if (process.env.NODE_ENV === "development") {
      setIsDev(true);
    }
  }, []);

  const fetchEnvs = async () => {
    try {
      const res = await fetch("/api/dev/env");
      if (res.ok) {
        const json = await res.json();
        setEnvs(json.data || {});
      }
    } catch (err) {
      console.error("Failed to fetch dev envs:", err);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchEnvs();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!mounted || !isDev) {
    return null;
  }

  return (
    <>
      {/* Floating Indicator Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-amber-400 uppercase font-mono shadow-[0_4px_20px_rgba(245,158,11,0.15)] backdrop-blur-md cursor-pointer select-none transition-all duration-300 hover:scale-105 hover:bg-amber-500/20 hover:border-amber-500/50"
        title="Geliştirme Detaylarını Göster"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Terminal className="h-3 w-3 mr-0.5" />
        <span>Yerel Sunucu (DEV)</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-950/95 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/30">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Geliştirme Ortamı Detayları
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Local Environment Variables
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-xs text-zinc-400">
                Aşağıda yerel geliştirme sunucunuzda (`.env.local`) tanımlı olan
                çevre değişkenleri listelenmektedir. Bu modal yalnızca
                geliştirme modunda görüntülenebilir.
              </p>

              <div className="space-y-3 font-mono text-xs">
                {Object.entries(envs).map(([key, val]) => {
                  const isVisible = !!visibleKeys[key];
                  const displayValue = val
                    ? isVisible
                      ? val
                      : "•".repeat(Math.min(val.length, 30))
                    : "Tanımlanmamış";

                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-1.5 p-3 rounded-lg border border-zinc-900 bg-black/40 hover:border-zinc-850 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-zinc-400 tracking-wide select-all">
                          {key}
                        </span>

                        {val && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleVisibility(key)}
                              className="p-1 rounded text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900 transition-all cursor-pointer"
                              title={isVisible ? "Gizle" : "Göster"}
                            >
                              {isVisible ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(key, val)}
                              className="p-1 rounded text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900 transition-all cursor-pointer"
                              title="Değeri Kopyala"
                            >
                              {copiedKey === key ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div
                        className={cn(
                          "p-2 rounded bg-zinc-950 text-[11px] break-all border border-zinc-900/60 font-mono",
                          val
                            ? isVisible
                              ? "text-zinc-200"
                              : "text-zinc-500/70"
                            : "text-red-500/70 italic",
                        )}
                      >
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-900 bg-zinc-900/10 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
