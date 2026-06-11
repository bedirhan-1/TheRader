"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ActiveStrategies() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => fetch("/api/strategies").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strateji güncellendi");
    },
    onError: () => {
      toast.error("Güncelleme başarısız");
    },
  });

  const strategies = data?.data ?? [];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Aktif Stratejiler
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : strategies.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Henüz strateji yok.
          </div>
        ) : (
          <div className="space-y-3">
            {strategies.map(
              (strategy: {
                id: string;
                name: string;
                stock: { symbol: string };
                type: string;
                enabled: boolean;
                lastTriggered: string | null;
              }) => (
                <div
                  key={strategy.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div
                    className="space-y-1 cursor-pointer group flex-1"
                    onClick={() =>
                      router.push(`/stocks/${strategy.stock?.symbol}`)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium group-hover:text-info transition-colors">
                        {strategy.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {strategy.stock?.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{strategy.type.replace("_", " ")}</span>
                      {strategy.lastTriggered && (
                        <span>
                          Son:{" "}
                          {new Date(strategy.lastTriggered).toLocaleDateString(
                            "tr-TR",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={strategy.enabled}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({
                        id: strategy.id,
                        enabled: checked,
                      })
                    }
                  />
                </div>
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
