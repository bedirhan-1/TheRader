import { Bar, Signal, StrategyEngine } from "./index";

export class MacdStrategy implements StrategyEngine {
  calculate(bars: Bar[], params: Record<string, any>): Signal {
    const fastPeriod = parseInt(params.fastPeriod || "12");
    const slowPeriod = parseInt(params.slowPeriod || "26");
    const signalPeriod = parseInt(params.signalPeriod || "9");

    const minBars = slowPeriod + signalPeriod + 1;
    if (bars.length < minBars) {
      return "HOLD";
    }

    const closes = bars.map((b) => b.c);
    const macdValues = this.calculateMACD(closes, fastPeriod, slowPeriod, signalPeriod);

    if (macdValues.length < 2) {
      return "HOLD";
    }

    const current = macdValues[macdValues.length - 1];
    const prev = macdValues[macdValues.length - 2];

    // Crossover: MACD line crossing above Signal line is BUY
    if (prev.macd <= prev.signal && current.macd > current.signal) {
      return "BUY";
    }

    // Crossunder: MACD line crossing below Signal line is SELL
    if (prev.macd >= prev.signal && current.macd < current.signal) {
      return "SELL";
    }

    return "HOLD";
  }

  private calculateMACD(
    prices: number[],
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number
  ): { macd: number; signal: number }[] {
    const fastEma = this.calculateEMA(prices, fastPeriod);
    const slowEma = this.calculateEMA(prices, slowPeriod);

    // Align indices since slowEma starts later than fastEma
    const macdLines: number[] = [];
    const startIndex = slowPeriod - 1;

    for (let i = startIndex; i < prices.length; i++) {
      const fastVal = fastEma[i - (fastPeriod - 1)];
      const slowVal = slowEma[i - (slowPeriod - 1)];
      macdLines.push(fastVal - slowVal);
    }

    // Now calculate Signal line (EMA of MACD line)
    const signalEma = this.calculateEMA(macdLines, signalPeriod);

    const results: { macd: number; signal: number }[] = [];
    for (let i = signalPeriod - 1; i < macdLines.length; i++) {
      results.push({
        macd: macdLines[i],
        signal: signalEma[i - (signalPeriod - 1)],
      });
    }

    return results;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [];

    // First value is simple average
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    let currentEma = sum / period;
    ema.push(currentEma);

    for (let i = period; i < prices.length; i++) {
      currentEma = prices[i] * k + currentEma * (1 - k);
      ema.push(currentEma);
    }

    return ema;
  }
}
