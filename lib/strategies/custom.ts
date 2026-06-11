import { Bar, Signal, StrategyEngine } from "./index";
import { calculateRSI, calculateSMA, calculateEMA } from "./indicators";

export interface Condition {
  indicator: "PRICE" | "RSI" | "SMA" | "EMA";
  period?: number;
  operator: "less_than" | "greater_than" | "equals" | "crosses_above" | "crosses_below";
  valueType: "number" | "indicator";
  value: string; // static number or indicator name
  valuePeriod?: number; // period if value is indicator
}

export class CustomStrategy implements StrategyEngine {
  calculate(bars: Bar[], params: Record<string, any>): Signal {
    const buyConditions: Condition[] = params.buyConditions || [];
    const sellConditions: Condition[] = params.sellConditions || [];
    const buyOperator = params.buyOperator || "AND";
    const sellOperator = params.sellOperator || "AND";

    if (bars.length < 2) {
      return "HOLD";
    }

    // Fallback if no conditions configured
    if (buyConditions.length === 0 && sellConditions.length === 0) {
      return "HOLD";
    }

    const isBuyTriggered = this.evaluateConditions(bars, buyConditions, buyOperator);
    const isSellTriggered = this.evaluateConditions(bars, sellConditions, sellOperator);

    if (isBuyTriggered && !isSellTriggered) {
      return "BUY";
    } else if (isSellTriggered && !isBuyTriggered) {
      return "SELL";
    }

    return "HOLD";
  }

  private evaluateConditions(bars: Bar[], conditions: Condition[], operator: "AND" | "OR"): boolean {
    if (conditions.length === 0) return false;

    const results = conditions.map((cond) => this.evaluateCondition(bars, cond));

    if (operator === "OR") {
      return results.some((r) => r === true);
    } else {
      return results.every((r) => r === true);
    }
  }

  private evaluateCondition(bars: Bar[], cond: Condition): boolean {
    const prices = bars.map((b) => b.c);

    const getValHistory = (indicator: string, period?: number): number[] => {
      if (indicator === "PRICE") {
        return prices;
      }
      const p = period || 14;
      if (indicator === "RSI") {
        return calculateRSI(prices, p);
      }
      if (indicator === "SMA") {
        return calculateSMA(prices, p);
      }
      if (indicator === "EMA") {
        return calculateEMA(prices, p);
      }
      return [];
    };

    const leftHistory = getValHistory(cond.indicator, cond.period);
    
    let rightHistory: number[];
    if (cond.valueType === "indicator") {
      rightHistory = getValHistory(cond.value, cond.valuePeriod);
    } else {
      const staticVal = parseFloat(cond.value);
      rightHistory = new Array(prices.length).fill(staticVal);
    }

    if (leftHistory.length < 2 || rightHistory.length < 2) {
      return false;
    }

    const currentIdx = leftHistory.length - 1;
    const prevIdx = leftHistory.length - 2;

    const leftCurr = leftHistory[currentIdx];
    const leftPrev = leftHistory[prevIdx];
    const rightCurr = rightHistory[currentIdx];
    const rightPrev = rightHistory[prevIdx];

    if (isNaN(leftCurr) || isNaN(rightCurr) || isNaN(leftPrev) || isNaN(rightPrev)) {
      return false;
    }

    switch (cond.operator) {
      case "less_than":
        return leftCurr < rightCurr;
      case "greater_than":
        return leftCurr > rightCurr;
      case "equals":
        return leftCurr === rightCurr;
      case "crosses_above":
        return leftPrev <= rightPrev && leftCurr > rightCurr;
      case "crosses_below":
        return leftPrev >= rightPrev && leftCurr < rightCurr;
      default:
        return false;
    }
  }
}
