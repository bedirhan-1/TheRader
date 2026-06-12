"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 min-w-0",
          sidebarCollapsed ? "pl-0 md:pl-[70px]" : "pl-0 md:pl-[240px]",
        )}
      >
        <Topbar />
        <main className="container mx-auto p-6 w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
