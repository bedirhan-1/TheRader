"use client";

import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

export function DevIndicator() {
  const [isDev, setIsDev] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if running in development mode
    if (process.env.NODE_ENV === "development") {
      setIsDev(true);
    }
  }, []);

  if (!mounted || !isDev) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-amber-400 uppercase font-mono shadow-[0_4px_20px_rgba(245,158,11,0.15)] backdrop-blur-md select-none transition-all duration-300 hover:scale-105 hover:bg-amber-500/15 hover:border-amber-500/40"
      title="Yerel Geliştirme Sunucusu Aktif"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <Terminal className="h-3 w-3 mr-0.5" />
      <span>Yerel Sunucu (DEV)</span>
    </div>
  );
}
