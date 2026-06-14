"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  FolderHeart,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/sparkline";

interface Stock {
  id: string;
  symbol: string;
  name: string | null;
  _count?: { strategies: number };
  snapshot?: {
    latestTrade?: { p: number };
    dailyBar?: { c: number };
    prevDailyBar?: { c: number };
  };
}

interface Watchlist {
  id: string;
  name: string;
  stocks: Stock[];
}

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Track expanded state for each watchlist card
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({});

  // Local state for watchlists to make drag-and-drop transition smooth
  const [localWatchlists, setLocalWatchlists] = useState<Watchlist[]>([]);

  // Dialog states for adding stock to a specific watchlist
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [activeListForStock, setActiveListForStock] = useState<string | null>(null);
  const [newStockSymbol, setNewStockSymbol] = useState("");

  // Fetch watchlists
  const { data: watchlistsResponse, isLoading: listsLoading } = useQuery({
    queryKey: ["watchlists"],
    queryFn: () => fetch("/api/watchlists").then((r) => r.json()),
  });
  const watchlists: Watchlist[] = watchlistsResponse?.data ?? [];

  // Sync server data to local watchlists, expanding the first one by default if not set
  useEffect(() => {
    if (watchlists.length > 0) {
      setLocalWatchlists(watchlists);
      setExpandedLists((prev) => {
        // Expand the first list by default if there are no expanded records yet
        if (Object.keys(prev).length === 0) {
          return { [watchlists[0].id]: true };
        }
        return prev;
      });
    }
  }, [watchlists]);

  // Create watchlist mutation
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
      toast.success("Yeni liste oluşturuldu");
      setNewListName("");
      setDialogOpen(false);
      // Automatically expand the newly created list
      if (data.data?.id) {
        setExpandedLists((prev) => ({ ...prev, [data.data.id]: true }));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Liste oluşturulamadı");
    },
  });

  // Delete watchlist mutation
  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlists/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Liste silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast.success("Liste silindi");
    },
    onError: (err: any) => {
      toast.error(err.message || "Liste silinemedi");
    },
  });

  // Add stock to watchlist mutation
  const addStockMutation = useMutation({
    mutationFn: async ({ listId, symbol }: { listId: string; symbol: string }) => {
      const res = await fetch(`/api/watchlists/${listId}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast.success("Hisse listeye eklendi");
      setNewStockSymbol("");
      setStockDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Hisse eklenemedi");
    },
  });

  // Delete stock from watchlist mutation
  const deleteStockMutation = useMutation({
    mutationFn: async ({ listId, symbol }: { listId: string; symbol: string }) => {
      const res = await fetch(`/api/watchlists/${listId}/stocks/${symbol}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast.success("Hisse listeden kaldırıldı");
    },
    onError: (err: any) => {
      toast.error(err.message || "Hisse kaldırılamadı");
    },
  });

  // Reorder watchlists mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch("/api/watchlists/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderedIds),
      });
      if (!res.ok) throw new Error("Sıralama kaydedilemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
    onError: () => {
      toast.error("Sıralama güncellenirken hata oluştu");
      setLocalWatchlists(watchlists); // Rollback
    },
  });

  // Drag and Drop State variables
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...localWatchlists];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLocalWatchlists(items);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    const orderedIds = localWatchlists.map((w) => w.id);
    reorderMutation.mutate(orderedIds);
  };

  const toggleExpand = (id: string) => {
    setExpandedLists((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openAddStockDialog = (listId: string) => {
    setActiveListForStock(listId);
    setStockDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Takip Listelerim</h1>
          <p className="text-xs text-muted-foreground">
            Sürükleyip bırakarak listelerinizi reorder edin ve collapsible kartlar ile takip listenizi özelleştirin.
          </p>
        </div>

        {/* Circular Plus Button to Add New Watchlist */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <button
                className="h-10 w-10 rounded-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-md font-bold"
                title="Yeni Liste Oluştur"
              >
                <Plus className="h-5 w-5 stroke-[2.5]" />
              </button>
            }
          />
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle>Yeni Liste Oluştur</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newListName.trim()) createListMutation.mutate(newListName.trim());
              }}
              className="space-y-4"
            >
              <Input
                placeholder="Liste Adı (Örn: Teknoloji, Enerji, Kısa Vade)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="border-border bg-background"
                required
              />
              <Button
                type="submit"
                disabled={createListMutation.isPending || !newListName.trim()}
                className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
              >
                {createListMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Watchlist Collapsible & Drag & Drop Container */}
      <div className="space-y-4">
        {listsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))
        ) : localWatchlists.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card/10">
            <p className="text-sm text-muted-foreground">
              Henüz hiçbir takip listeniz bulunmuyor. Sağ üstteki circular "+" butonu ile liste oluşturun.
            </p>
          </div>
        ) : (
          localWatchlists.map((list, index) => {
            const isExpanded = !!expandedLists[list.id];
            const isDragging = draggedIndex === index;

            return (
              <div
                key={list.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "border border-border rounded-xl bg-card/25 overflow-hidden transition-all duration-200",
                  isDragging && "opacity-40 border-zinc-500 scale-[0.99] shadow-inner",
                  !isDragging && "hover:border-zinc-800"
                )}
              >
                {/* Watchlist Header */}
                <div className="flex items-center justify-between p-3.5 select-none bg-zinc-900/30">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => toggleExpand(list.id)}
                  >
                    {/* Drag Grip Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-zinc-300"
                      onClick={(e) => e.stopPropagation()} // Prevent expand on grip click
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-2">
                      <FolderHeart className="h-4 w-4 text-zinc-400" />
                      <h2 className="text-sm font-bold text-zinc-100">{list.name}</h2>
                      <Badge variant="outline" className="text-[10px] bg-zinc-900/40">
                        {list.stocks?.length ?? 0} Hisse
                      </Badge>
                    </div>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-2">
                    {/* Add Stock to this watchlist */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddStockDialog(list.id)}
                      className="h-7 text-xs border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800"
                    >
                      + Hisse Ekle
                    </Button>

                    {/* Delete List */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(`"${list.name}" listesini silmek istediğinize emin misiniz?`)
                        ) {
                          deleteListMutation.mutate(list.id);
                        }
                      }}
                      disabled={deleteListMutation.isPending}
                      className="h-7 px-2 text-danger hover:text-danger hover:bg-danger/10"
                      title="Listeyi Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Collapsible toggle */}
                    <button
                      onClick={() => toggleExpand(list.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Watchlist Collapsible Body (Stocks Table) */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-zinc-950/20 p-2 animate-in fade-in slide-in-from-top-1 duration-200 overflow-x-auto">
                    <Table className="whitespace-nowrap">
                      <TableHeader>
                        <TableRow className="border-border/60 hover:bg-transparent">
                          <TableHead className="text-[11px] h-9">Sembol</TableHead>
                          <TableHead className="text-[11px] h-9">Şirket</TableHead>
                          <TableHead className="text-[11px] h-9 text-right">Son Fiyat</TableHead>
                          <TableHead className="text-[11px] h-9 text-right">Değişim</TableHead>
                          <TableHead className="text-[11px] h-9 text-center">Grafik</TableHead>
                          <TableHead className="text-[11px] h-9 text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(list.stocks || []).length === 0 ? (
                          <TableRow className="border-transparent">
                            <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                              Bu listede henüz hisse bulunmuyor. Hisse eklemek için yukarıdaki "+ Hisse Ekle" butonunu kullanın veya Keşfet ekranından kaydedin.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (list.stocks || []).map((stock) => {
                            const price = stock.snapshot?.latestTrade?.p;
                            const prevClose = stock.snapshot?.prevDailyBar?.c;
                            const change =
                              price && prevClose
                                ? ((price - prevClose) / prevClose) * 100
                                : null;

                            return (
                              <TableRow
                                key={stock.id}
                                className="border-border/40 hover:bg-accent/20 transition-colors"
                              >
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="relative flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full bg-zinc-800 border border-white/5 font-mono text-[9px] font-bold text-zinc-300">
                                      <img
                                        src={`https://images.financialmodelingprep.com/symbol/${stock.symbol}.png`}
                                        alt={stock.symbol}
                                        className="absolute inset-0 h-full w-full rounded-full object-contain bg-zinc-900 transition-opacity duration-300"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.opacity = "0";
                                        }}
                                      />
                                      {stock.symbol[0]}
                                    </div>
                                    <Link
                                      href={`/stocks/${stock.symbol}`}
                                      className="font-mono text-xs font-semibold text-foreground hover:text-info transition-colors"
                                    >
                                      {stock.symbol}
                                    </Link>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                  {stock.name || "—"}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {price ? `$${price.toFixed(2)}` : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {change !== null ? (
                                    <span
                                      className={cn(
                                        "font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                                        change >= 0
                                          ? "text-success bg-success/10 border border-success/15"
                                          : "text-danger bg-danger/10 border border-danger/15"
                                      )}
                                    >
                                      {change >= 0 ? "+" : ""}
                                      {change.toFixed(2)}%
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell className="py-1">
                                  <div className="flex justify-center">
                                    <Sparkline symbol={stock.symbol} baseline={prevClose || price || 0} />
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={deleteStockMutation.isPending}
                                    onClick={() =>
                                      deleteStockMutation.mutate({
                                        listId: list.id,
                                        symbol: stock.symbol,
                                      })
                                    }
                                    className="h-6 text-[10px] text-danger hover:text-danger hover:bg-danger/10"
                                  >
                                    Kaldır
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Listeye Hisse Ekle</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newStockSymbol.trim() && activeListForStock) {
                addStockMutation.mutate({
                  listId: activeListForStock,
                  symbol: newStockSymbol.trim(),
                });
              }
            }}
            className="space-y-4"
          >
            <Input
              placeholder="Sembol girin (Örn: AAPL, TSLA, NVDA)"
              value={newStockSymbol}
              onChange={(e) => setNewStockSymbol(e.target.value)}
              className="border-border bg-background font-mono uppercase"
              required
            />
            <Button
              type="submit"
              disabled={addStockMutation.isPending || !newStockSymbol.trim()}
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
            >
              {addStockMutation.isPending ? "Ekleniyor..." : "Listeye Ekle"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
