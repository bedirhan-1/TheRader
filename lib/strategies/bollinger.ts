import { Bar, Signal, StrategyEngine } from "./index";
import { calculateBollingerBands } from "./indicators";

export class BollingerStrategy implements StrategyEngine {
  calculate(bars: Bar[], params: Record<string, any>): Signal {
    const period = parseInt(params.period || "20");
    const stdDevMultiplier = parseFloat(params.stdDevMultiplier || "2");

    if (bars.length < period) {
      return "HOLD";
    }

    const prices = bars.map((b) => b.c);
    const { upper, lower } = calculateBollingerBands(prices, period, stdDevMultiplier);

    const currentPrice = prices[prices.length - 1];
    const currentUpper = upper[upper.length - 1];
    const currentLower = lower[lower.length - 1];

    if (isNaN(currentUpper) || isNaN(currentLower)) {
      return "HOLD";
    }

    if (currentPrice < currentLower) {
      return "BUY";
    } else if (currentPrice > currentUpper) {
      return "SELL";
    }

    return "HOLD";
  }
}
