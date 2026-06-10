import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | null;
  format: "currency" | "number";
  colored?: boolean;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  format,
  colored,
  loading,
}: MetricCardProps) {
  const formatted =
    value !== null
      ? format === "currency"
        ? `$${value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : value.toLocaleString()
      : "—";

  const isPositive = value !== null && value >= 0;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-28" />
        ) : (
          <p
            className={cn(
              "mt-1 font-mono text-2xl font-semibold tracking-tight",
              colored && value !== null
                ? isPositive
                  ? "text-success"
                  : "text-danger"
                : "text-foreground"
            )}
          >
            {colored && value !== null && isPositive ? "+" : ""}
            {formatted}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
