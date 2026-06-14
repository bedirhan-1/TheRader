"use client";

import { useQuery } from "@tanstack/react-query";
import { useId } from "react";

interface SparklineProps {
  symbol: string;
  baseline: number;
}

export function Sparkline({ symbol, baseline }: SparklineProps) {
  const gradientId = useId().replace(/:/g, "-");

  const { data: barsData, isLoading } = useQuery({
    queryKey: ["sparkline-bars", symbol],
    queryFn: () =>
      fetch(`/api/stocks/${symbol}/bars?timeframe=1Day&days=15`).then((r) =>
        r.json(),
      ),
    staleTime: 60000, // cache for 1 minute
  });

  const bars = barsData?.data ?? [];
  const prices: number[] = bars.map((b: any) => b.c);

  if (isLoading || prices.length < 2) {
    return (
      <div className="w-[100px] h-[32px] flex items-center justify-center">
        <div className="w-full h-px bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  // Include baseline in min/max to ensure it's always in view
  const minVal = Math.min(...prices, baseline);
  const maxVal = Math.max(...prices, baseline);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const width = 100;
  const height = 32;
  const padding = 2;

  const getX = (index: number) => {
    return (index / (prices.length - 1)) * width;
  };

  const getY = (val: number) => {
    return padding + ((maxVal - val) / range) * (height - 2 * padding);
  };

  const baselineY = getY(baseline);
  const baselinePercent = (baselineY / height) * 100;

  // Build SVG path
  const points = prices.map((price, idx) => `${getX(idx)},${getY(price)}`);
  const pathD = `M ${points.join(" L ")}`;

  return (
    <div className="w-[100px] h-[32px] flex items-center select-none pointer-events-none">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset={`${baselinePercent}%`} stopColor="#22c55e" />
            <stop offset={`${baselinePercent}%`} stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Dotted Reference Baseline */}
        <line
          x1="0"
          y1={baselineY}
          x2={width}
          y2={baselineY}
          stroke="#4b5563"
          strokeDasharray="2 2"
          strokeWidth="1"
          opacity={0.6}
        />

        {/* Multicolored Sparkline */}
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
