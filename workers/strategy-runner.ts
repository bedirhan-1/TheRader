import { prisma } from "@/lib/prisma";
import { getAlpacaClient } from "@/lib/alpaca";
import { RsiStrategy } from "@/lib/strategies/rsi";
import { SmaCrossoverStrategy } from "@/lib/strategies/sma-crossover";
import { MacdStrategy } from "@/lib/strategies/macd";
import { BollingerStrategy } from "@/lib/strategies/bollinger";
import { CustomStrategy } from "@/lib/strategies/custom";
import { Bar, StrategyEngine } from "@/lib/strategies";

const ENGINES: Record<string, StrategyEngine> = {
  RSI: new RsiStrategy(),
  SMA_CROSSOVER: new SmaCrossoverStrategy(),
  MACD: new MacdStrategy(),
  BOLLINGER: new BollingerStrategy(),
  CUSTOM: new CustomStrategy(),
};

// Returns true if current time is within regular NYSE market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
function isMarketHours(): boolean {
  // Convert current UTC time to EST/EDT (America/New_York)
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  });
  
  const parts = formatter.formatToParts(new Date());
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  
  const weekday = partMap.weekday; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  const hour = parseInt(partMap.hour);
  const minute = parseInt(partMap.minute);

  // Markets closed on weekends
  if (weekday === "Sat" || weekday === "Sun") {
    return false;
  }

  const minutesSinceMidnight = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60;   // 4:00 PM

  return minutesSinceMidnight >= marketOpen && minutesSinceMidnight < marketClose;
}

export async function runStrategies() {
  console.log(`[Strategy Runner] Starting strategy execution at ${new Date().toISOString()}`);

  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      console.log("[Strategy Runner] Settings not found, skipping.");
      return { success: false, reason: "Settings not found" };
    }

    // Check market hours constraint
    const currentMarketHours = isMarketHours();
    if (!currentMarketHours && !settings.tradeOutsideHours) {
      console.log("[Strategy Runner] Outside market hours and tradeOutsideHours is false. Skipping.");
      return { success: true, reason: "Outside market hours" };
    }

    // Retrieve active strategies
    const activeStrategies = await prisma.strategy.findMany({
      where: { enabled: true },
      include: { stock: true, user: true },
    });

    console.log(`[Strategy Runner] Found ${activeStrategies.length} active strategies.`);

    for (const strategy of activeStrategies) {
      const { id, name, type, params, action, qty, stock, userId } = strategy;
      console.log(`[Strategy Runner] Processing strategy: ${name} (${type}) on ${stock.symbol}`);

      const engine = ENGINES[type];
      if (!engine) {
        console.warn(`[Strategy Runner] No engine registered for strategy type: ${type}. Skipping.`);
        continue;
      }

      try {
        const alpaca = getAlpacaClient(userId);

        // Check if we already have a pending order in our database to prevent duplicate entry/calculations
        const pendingOrder = await prisma.order.findFirst({
          where: {
            userId,
            stockId: stock.id,
            status: "PENDING",
          },
        });
        if (pendingOrder) {
          console.log(`[Strategy Runner] Already have a pending order for ${stock.symbol}. Skipping.`);
          continue;
        }

        // Fetch bars from Alpaca
        // We'll fetch 100 days of daily data to ensure technical indicator calculation works (needs buffer)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 100);
        
        const result = await alpaca.getBars(
          stock.symbol,
          "1Day",
          start.toISOString(),
          end.toISOString()
        );
        const bars: Bar[] = result.bars || [];

        if (!bars || bars.length === 0) {
          console.warn(`[Strategy Runner] No bar data found for ${stock.symbol}. Skipping.`);
          continue;
        }

        // Run indicator math
        const signal = engine.calculate(bars, params as Record<string, any>);
        console.log(`[Strategy Runner] Strategy ${name} generated signal: ${signal}`);

        if (signal === "BUY" || signal === "SELL") {
          // Verify signal matches strategy action or matches either (automated trigger)
          // Since the strategy explicitly states its action (e.g. action = BUY or action = SELL),
          // we only place orders when the generated signal matches the pre-defined target action.
          if (signal !== action) {
            console.log(`[Strategy Runner] Signal ${signal} does not match strategy configuration action ${action}. Skipping order.`);
            continue;
          }



          // Check if we already have an open position to prevent duplicate entry/over-leverage
          const positions = await alpaca.getPositions();
          const hasPosition = positions.some((p) => p.symbol === stock.symbol);
          
          if (signal === "BUY" && hasPosition) {
            console.log(`[Strategy Runner] Already holding position in ${stock.symbol}. Skipping BUY order.`);
            continue;
          }

          if (signal === "SELL" && !hasPosition) {
            console.log(`[Strategy Runner] No position to sell in ${stock.symbol}. Skipping SELL order.`);
            continue;
          }

          console.log(`[Strategy Runner] Placing order: ${signal} ${qty} ${stock.symbol}`);
          const alpacaOrder = await alpaca.placeOrder({
            symbol: stock.symbol,
            qty: qty,
            side: signal.toLowerCase() as "buy" | "sell",
            type: "market",
            time_in_force: "day",
          });

          // Create order record in DB
          await prisma.order.create({
            data: {
              alpacaId: alpacaOrder.id,
              userId: userId,
              stockId: stock.id,
              strategyId: id,
              side: signal,
              qty: qty,
              type: "MARKET",
              status: "PENDING",
            },
          });

          // Toggle strategy action and update last triggered timestamp
          const nextAction = action === "BUY" ? "SELL" : "BUY";
          await prisma.strategy.update({
            where: { id },
            data: { 
              action: nextAction,
              lastTriggered: new Date() 
            },
          });


          console.log(`[Strategy Runner] Successfully executed and recorded order for ${name}`);
        }

      } catch (strategyErr) {
        console.error(`[Strategy Runner] Error running strategy ${name}:`, strategyErr);
      }
    }

    return { success: true, count: activeStrategies.length };
  } catch (error) {
    console.error("[Strategy Runner] Critical error in runner:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
