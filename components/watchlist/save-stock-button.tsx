"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Stock {
  id: string;
  symbol: string;
  name: string | null;
}

interface Watchlist {
  id: string;
  name: string;
  stocks: Stock[];
}

export function SaveStockButton({ symbol }: { symbol: string }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Fetch all watchlists
  const { data: watchlistsResponse, isLoading } = useQuery({
    queryKey: ["watchlists"],
    queryFn: () => fetch("/api/watchlists").then((r) => r.json()),
  });
  const watchlists: Watchlist[] = watchlistsResponse?.data ?? [];

  // Determine if stock is saved in any watchlist
  const isSaved = watchlists.some((w) =>
    (w.stocks || []).some((s) => s.symbol.toUpperCase() === symbol.toUpperCase())
  );

  // Mutation to create a new watchlist
  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Liste oluşturulamadı");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast.success(`"${data.data.name}" listesi oluşturuldu`);
      setNewListName("");
    },
    onError: () => {
      toast.error("Liste oluşturulurken bir hata oluştu");
    },
  });

  // Mutation to add stock to watchlist (with optimistic updates)
  const addStockMutation = useMutation({
    mutationFn: async ({ listId, symbol }: { listId: string; symbol: string }) => {
      const res = await fetch(`/api/watchlists/${listId}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) throw new Error("Hisse eklenemedi");
      return res.json();
    },
    onMutate: async ({ listId, symbol }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["watchlists"] });

      // Snapshot the previous watchlists state
      const previousWatchlists = queryClient.getQueryData(["watchlists"]);

      // Optimistically update the cache
      queryClient.setQueryData(["watchlists"], (old: any) => {
        if (!old || !old.data) return old;
        const updatedData = old.data.map((w: any) => {
          if (w.id === listId) {
            const exists = (w.stocks || []).some(
              (s: any) => s.symbol.toUpperCase() === symbol.toUpperCase()
            );
            if (!exists) {
              return {
                ...w,
                stocks: [
                  ...(w.stocks || []),
                  { id: `temp-${Date.now()}`, symbol: symbol.toUpperCase(), name: symbol.toUpperCase() }
                ],
              };
            }
          }
          return w;
        });
        return { ...old, data: updatedData };
      });

      // Return context with snapshotted value for rollback
      return { previousWatchlists };
    },
    onError: (err, variables, context) => {
      if (context?.previousWatchlists) {
        queryClient.setQueryData(["watchlists"], context.previousWatchlists);
      }
      toast.error("Hisse eklenemedi");
    },
    onSuccess: () => {
      toast.success("Hisse listeye eklendi");
    },
    onSettled: () => {
      // Invalidate query to sync back with backend database truth
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });

  // Mutation to remove stock from watchlist (with optimistic updates)
  const removeStockMutation = useMutation({
    mutationFn: async ({ listId, symbol }: { listId: string; symbol: string }) => {
      const res = await fetch(`/api/watchlists/${listId}/stocks/${symbol}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Hisse silinemedi");
      return res.json();
    },
    onMutate: async ({ listId, symbol }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["watchlists"] });

      // Snapshot the previous watchlists state
      const previousWatchlists = queryClient.getQueryData(["watchlists"]);

      // Optimistically update the cache
      queryClient.setQueryData(["watchlists"], (old: any) => {
        if (!old || !old.data) return old;
        const updatedData = old.data.map((w: any) => {
          if (w.id === listId) {
            return {
              ...w,
              stocks: (w.stocks || []).filter(
                (s: any) => s.symbol.toUpperCase() !== symbol.toUpperCase()
              ),
            };
          }
          return w;
        });
        return { ...old, data: updatedData };
      });

      // Return context for rollback
      return { previousWatchlists };
    },
    onError: (err, variables, context) => {
      if (context?.previousWatchlists) {
        queryClient.setQueryData(["watchlists"], context.previousWatchlists);
      }
      toast.error("Hisse kaldırılamadı");
    },
    onSuccess: () => {
      toast.success("Hisse listeden kaldırıldı");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 256;
      const dropdownHeight = 280; // Estimated max height of the popover

      // Align right side of dropdown with right side of button
      let left = rect.right - dropdownWidth;
      // Clamp within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8));

      // Check vertical space below
      let top = rect.bottom + 8;
      if (top + dropdownHeight > window.innerHeight && rect.top > dropdownHeight) {
        top = rect.top - dropdownHeight - 8;
      }

      setCoords({ top, left });
    }
  };

  // Handle outside clicks & window resize/scroll positioning
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      updateCoords();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isOpen]);

  const handleToggle = (listId: string, hasStock: boolean) => {
    if (hasStock) {
      removeStockMutation.mutate({ listId, symbol });
    } else {
      addStockMutation.mutate({ listId, symbol });
    }
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      createListMutation.mutate(newListName.trim());
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1.5 rounded-full transition-all duration-200 border",
          isSaved
            ? "bg-zinc-100 border-zinc-100 text-zinc-950 hover:bg-zinc-200"
            : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        )}
        title="Listeye Kaydet"
      >
        <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="w-64 rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md z-9999 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="mb-2 pb-1.5 border-b border-zinc-800/60 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">Listelerim</span>
              {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>

            {/* List options */}
            <div className="max-h-44 overflow-y-auto space-y-1 mb-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {watchlists.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-3">
                  Henüz bir listeniz yok.
                </p>
              ) : (
                watchlists.map((list) => {
                  const hasStock = (list.stocks || []).some(
                    (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
                  );

                  return (
                    <button
                      key={list.id}
                      onClick={() => handleToggle(list.id, hasStock)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors text-left"
                    >
                      <span>{list.name}</span>
                      <div
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-all",
                          hasStock
                            ? "bg-zinc-100 border-zinc-100 text-zinc-950"
                            : "border-zinc-700 bg-transparent text-transparent"
                        )}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Create new list inline */}
            <form onSubmit={handleCreateList} className="flex gap-2 pt-2 border-t border-zinc-800/60">
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Yeni liste oluştur..."
                className="h-8 text-[11px] border-zinc-800 bg-zinc-900/50 focus-visible:ring-1 focus-visible:ring-zinc-700 text-white placeholder:text-muted-foreground/60"
              />
              <Button
                type="submit"
                disabled={createListMutation.isPending || !newListName.trim()}
                size="icon"
                className="h-8 w-8 rounded-full shrink-0 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}
