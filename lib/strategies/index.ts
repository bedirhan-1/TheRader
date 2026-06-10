export interface Bar {
  t: string; // Time
  o: number; // Open
  h: number; // High
  l: number; // Low
  c: number; // Close
  v: number; // Volume
}

export type Signal = "BUY" | "SELL" | "HOLD";

export interface StrategyEngine {
  calculate(bars: Bar[], params: Record<string, any>): Signal;
}
