import { Bar, Signal, StrategyEngine } from "./index";

export class CustomStrategy implements StrategyEngine {
  calculate(bars: Bar[], params: Record<string, any>): Signal {
    if (bars.length < 2) {
      return "HOLD";
    }

    const currentClose = bars[bars.length - 1].c;
    const prevClose = bars[bars.length - 2].c;

    const threshold = parseFloat(params.threshold || "2"); // price change %
    const percentChange = ((currentClose - prevClose) / prevClose) * 100;

    if (percentChange >= threshold) {
      return "BUY";
    } else if (percentChange <= -threshold) {
      return "SELL";
    }

    return "HOLD";
  }
}
