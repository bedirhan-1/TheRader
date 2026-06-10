import { Bar, Signal, StrategyEngine } from "./index";

export class RsiStrategy implements StrategyEngine {
  calculate(bars: Bar[], params: Record<string, any>): Signal {
    const period = parseInt(params.period || "14");
    const oversold = parseFloat(params.oversold || "30");
    const overbought = parseFloat(params.overbought || "70");

    if (bars.length < period + 1) {
      return "HOLD";
    }

    const closes = bars.map((b) => b.c);
    const rsiValue = this.calculateRSI(closes, period);

    if (rsiValue === null) return "HOLD";

    if (rsiValue < oversold) {
      return "BUY";
    } else if (rsiValue > overbought) {
      return "SELL";
    }

    return "HOLD";
  }

  private calculateRSI(prices: number[], period: number): number | null {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) {
        gains += diff;
      } else {
        losses -= diff;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      let currentGain = 0;
      let currentLoss = 0;
      if (diff > 0) {
        currentGain = diff;
      } else {
        currentLoss = -diff;
      }
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }
}
