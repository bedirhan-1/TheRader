import { Bar, Signal, StrategyEngine } from "./index";

export class SmaCrossoverStrategy implements StrategyEngine {
  calculate(bars: Bar[], params: Record<string, any>): Signal {
    const fastPeriod = parseInt(params.fastPeriod || "10");
    const slowPeriod = parseInt(params.slowPeriod || "20");

    if (bars.length < slowPeriod + 1) {
      return "HOLD";
    }

    const closes = bars.map((b) => b.c);

    // Current Fast and Slow SMAs
    const currentFastSma = this.calculateSMA(closes.slice(-fastPeriod));
    const currentSlowSma = this.calculateSMA(closes.slice(-slowPeriod));

    // Previous Fast and Slow SMAs (to detect crossover)
    const prevFastSma = this.calculateSMA(closes.slice(-fastPeriod - 1, -1));
    const prevSlowSma = this.calculateSMA(closes.slice(-slowPeriod - 1, -1));

    if (
      currentFastSma === null ||
      currentSlowSma === null ||
      prevFastSma === null ||
      prevSlowSma === null
    ) {
      return "HOLD";
    }

    // Golden Cross: Fast SMA crosses above Slow SMA
    if (prevFastSma <= prevSlowSma && currentFastSma > currentSlowSma) {
      return "BUY";
    }

    // Death Cross: Fast SMA crosses below Slow SMA
    if (prevFastSma >= prevSlowSma && currentFastSma < currentSlowSma) {
      return "SELL";
    }

    return "HOLD";
  }

  private calculateSMA(prices: number[]): number | null {
    if (prices.length === 0) return null;
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }
}
