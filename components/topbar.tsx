"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  stocks: "Hisseler",
  strategies: "Stratejiler",
  orders: "Emirler",
  settings: "Ayarlar",
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const label = pathLabels[segment] || decodeURIComponent(segment);
    const isLast = index === segments.length - 1;
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
        <span
          className={
            isLast
              ? "text-sm font-medium text-foreground"
              : "text-sm text-muted-foreground"
          }
        >
          {label}
        </span>
      </span>
    );
  });

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-1">{breadcrumbs}</div>

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-foreground">
          {session?.user?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
