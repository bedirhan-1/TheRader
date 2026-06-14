"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function HealthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/maintenance") {
      setChecking(false);
      return;
    }

    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health-check");
        if (!res.ok) {
          router.replace("/maintenance");
        } else {
          setChecking(false);
        }
      } catch (error) {
        router.replace("/maintenance");
      }
    };

    checkHealth();

    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [pathname, router]);

  if (checking && pathname !== "/maintenance") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Sunucu bağlantısı kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
export default HealthGuard;
