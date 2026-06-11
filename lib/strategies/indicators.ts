/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number[] {
  const smas: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      smas.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j];
    }
    smas.push(sum / period);
  }
  return smas;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const emas: number[] = [];
  if (prices.length === 0) return emas;
  
  const k = 2 / (period + 1);
  let ema = prices[0];
  emas.push(ema);
  
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    emas.push(ema);
  }
  return emas;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number): number[] {
  const rsis: number[] = [];
  if (prices.length === 0) return rsis;

  // Fill initial values with NaN
  for (let i = 0; i < period; i++) {
    rsis.push(NaN);
  }

  if (prices.length < period + 1) {
    return rsis;
  }

  let gains = 0;
  let losses = 0;

  // First RSI value
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

  if (avgLoss === 0) {
    rsis.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsis.push(100 - 100 / (1 + rs));
  }

  // Subsequent RSI values using Wilder's smoothing
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

    if (avgLoss === 0) {
      rsis.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsis.push(100 - 100 / (1 + rs));
    }
  }

  return rsis;
}

/**
 * Bollinger Bands (BB)
 */
export function calculateBollingerBands(
  prices: number[],
  period: number,
  stdDevMultiplier = 2
): { upper: number[]; lower: number[]; middle: number[] } {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1 || isNaN(middle[i])) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    // Calculate Standard Deviation
    let sumSqDiff = 0;
    for (let j = 0; j < period; j++) {
      const diff = prices[i - j] - middle[i];
      sumSqDiff += diff * diff;
    }
    const stdDev = Math.sqrt(sumSqDiff / period);

    upper.push(middle[i] + stdDevMultiplier * stdDev);
    lower.push(middle[i] - stdDevMultiplier * stdDev);
  }

  return { upper, lower, middle };
}
