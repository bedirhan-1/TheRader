"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/store";

const pathLabels: Record<string, string> = {
  dashboard: "Panel",
  wallet: "Cüzdan",
  stocks: "Hisseler",
  strategies: "Stratejiler",
  orders: "Emirler",
  settings: "Ayarlar",
  algorithms: "Algoritmalar",
  new: "Yeni",
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleMobileSidebar } = useUiStore();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const label = pathLabels[segment] || decodeURIComponent(segment);
    const isLast = index === segments.length - 1;
    const href = "/" + segments.slice(0, index + 1).join("/");

    return (
      <span key={segment} className="flex items-center gap-2">
        {index > 0 && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/50"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
        {isLast ? (
          <span className="text-sm font-medium text-foreground">{label}</span>
        ) : (
          <Link
            href={href}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            {label}
          </Link>
        )}
      </span>
    );
  });

  return (
    <header className="sticky top-0 z-35 flex h-14 items-center justify-between border-b border-border bg-background/70 backdrop-blur-md px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground md:hidden"
          onClick={toggleMobileSidebar}
          title="Menüyü Aç"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
        <div className="flex items-center gap-1">{breadcrumbs}</div>
      </div>

      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-card hover:bg-accent transition-all p-1 pr-3.5 pl-1.5 cursor-default select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-tr from-zinc-700 via-zinc-800 to-zinc-900 text-[10px] font-bold text-white border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              {(session.user.name ||
                session.user.email ||
                "U")[0].toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold leading-none text-foreground">
                {session.user.name ||
                  session.user.email?.split("@")[0] ||
                  "Kullanıcı"}
              </span>
              <span className="text-[9px] font-semibold leading-none text-zinc-500 mt-1 uppercase tracking-wider">
                {(session.user as { role?: string }).role === "ADMIN"
                  ? "Yönetici"
                  : "Gözlemci"}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
