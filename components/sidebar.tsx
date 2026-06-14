"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUiStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const navItems: {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}[] = [
  {
    label: "Panel",
    href: "/dashboard",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Cüzdan",
    href: "/wallet",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <path d="M18 12a2 2 0 00-2 2v2a2 2 0 002 2h4v-6H18z" />
      </svg>
    ),
  },
  {
    label: "Takip Listem",
    href: "/watchlist",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    label: "Keşfet",
    href: "/stocks",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: "Stratejiler",
    href: "/strategies",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    label: "Algoritmalar",
    href: "/algorithms",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    label: "Emirler",
    href: "/orders",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Ayarlar",
    href: "/settings",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

function isMarketOpen(): boolean {
  const now = new Date();
  const nyTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // NYSE: Mon-Fri 9:30 AM - 4:00 PM ET
  if (day === 0 || day === 6) return false;
  return timeInMinutes >= 570 && timeInMinutes < 960;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const marketOpen = isMarketOpen();
  const userRole = (session?.user as { role?: string })?.role;
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          sidebarCollapsed ? "w-[70px]" : "w-[240px]",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
      {/* Logo & Toggle */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border transition-all duration-300 relative",
          sidebarCollapsed ? "justify-center" : "bg-[url('/logo-small.png')] bg-size-[18px_auto] bg-position-[16px_center] bg-no-repeat pl-11 pr-3",
        )}
      >
        {sidebarCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Genişlet"
          >
            <img src="/logo-small.png" alt="Logo" className="h-5 w-5" />
          </Button>
        ) : (
          <>
            <span className="text-sm font-semibold tracking-tight">The Rader</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground ml-auto"
              title="Daralt"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-3">
        {navItems
          .filter((item) => !item.adminOnly || userRole === "ADMIN")
          .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                  sidebarCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="animate-in fade-in duration-200">{item.label}</span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Bottom section */}
      <div className={cn("mt-auto space-y-3 pb-4", sidebarCollapsed ? "px-2" : "px-3")}>
        <Separator />

        {/* Market status */}
        <div
          className={cn("flex items-center gap-2 py-1", sidebarCollapsed ? "justify-center" : "px-3")}
          title={sidebarCollapsed ? `Piyasa ${marketOpen ? "Açık" : "Kapalı"}` : undefined}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              marketOpen ? "bg-success" : "bg-muted-foreground",
            )}
          />
          {!sidebarCollapsed && (
            <span className="text-xs text-muted-foreground animate-in fade-in duration-200">
              Piyasa {marketOpen ? "Açık" : "Kapalı"}
            </span>
          )}
        </div>

        {/* User */}
        <div className={cn("flex items-center justify-between py-1", sidebarCollapsed ? "flex-col gap-3 px-0" : "px-3")}>
          <div className={cn("flex items-center", sidebarCollapsed ? "flex-col gap-1" : "gap-2")}>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-tr from-zinc-700 to-zinc-800 text-[10px] font-bold text-white border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
              title={sidebarCollapsed ? (session?.user?.name || session?.user?.email || "U") : undefined}
            >
              {(session?.user?.name ||
                session?.user?.email ||
                "U")[0].toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col text-left animate-in fade-in duration-200">
                <span className="text-xs font-semibold leading-none text-foreground max-w-[120px] truncate">
                  {session?.user?.name ||
                    session?.user?.email?.split("@")[0] ||
                    "Kullanıcı"}
                </span>
                <span className="text-[9px] font-semibold leading-none text-zinc-500 mt-1 uppercase tracking-wider">
                  {userRole === "ADMIN" ? "Yönetici" : "Gözlemci"}
                </span>
              </div>
            )}
          </div>
          <div className={cn("flex items-center gap-1", sidebarCollapsed ? "flex-col" : "")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Temayı Değiştir"
            >
              {mounted && theme === "dark" ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogoutOpen(true)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Çıkış Yap"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent showCloseButton={false} className="max-w-xs p-6 bg-card border border-border">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-foreground">Çıkış Yap</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-normal">
              Hesabınızdan çıkış yapmak istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setLogoutOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-danger text-white hover:bg-danger/90"
            >
              Çıkış Yap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
    </>
  );
}
