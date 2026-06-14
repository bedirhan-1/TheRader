import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAlpacaClient } from "@/lib/alpaca";
import { promises as fs } from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "highlights-cache.json");
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const POPULAR_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX", "AMD", "INTC",
  "BABA", "PYPL", "DIS", "NKE", "SBUX", "COIN", "TSM", "ASML", "AVGO", "QCOM"
];

const INDEX_ETFS = ["SPY", "QQQ", "DIA", "IWM"];

const SYMBOL_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com, Inc.",
  TSLA: "Tesla, Inc.",
  NVDA: "NVIDIA Corporation",
  META: "Meta Platforms, Inc.",
  NFLX: "Netflix, Inc.",
  AMD: "Advanced Micro Devices",
  INTC: "Intel Corporation",
  BABA: "Alibaba Group Holding",
  PYPL: "PayPal Holdings, Inc.",
  DIS: "The Walt Disney Company",
  NKE: "NIKE, Inc.",
  SBUX: "Starbucks Corporation",
  COIN: "Coinbase Global, Inc.",
  TSM: "Taiwan Semiconductor",
  ASML: "ASML Holding N.V.",
  AVGO: "Broadcom Inc.",
  QCOM: "QUALCOMM Incorporated",
  SPY: "S&P 500 ETF",
  QQQ: "Nasdaq 100 ETF",
  DIA: "Dow Jones ETF",
  IWM: "Russell 2000 ETF"
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Try reading from the persistent cache on disk
  try {
    const stats = await fs.stat(CACHE_FILE);
    const age = Date.now() - stats.mtimeMs;
    if (age < CACHE_DURATION) {
      const cachedContent = await fs.readFile(CACHE_FILE, "utf-8");
      const data = JSON.parse(cachedContent);
      return NextResponse.json({ data });
    }
  } catch (error) {
    // Cache file missing or invalid, fetch fresh data below
  }

  // 2. Fetch fresh data from Alpaca
  try {
    const alpaca = getAlpacaClient(session.user.id);
    const allSymbols = [...POPULAR_SYMBOLS, ...INDEX_ETFS];
    const snapshots = await alpaca.getSnapshots(allSymbols);

    // Process index ETFs
    const indices = INDEX_ETFS.map((symbol) => {
      const snap = snapshots[symbol];
      const price = snap?.latestTrade?.p || 0;
      const prevClose = snap?.prevDailyBar?.c || price || 1;
      const change = ((price - prevClose) / prevClose) * 100;
      return {
        symbol,
        name: symbol === "SPY" ? "S&P 500" : symbol === "QQQ" ? "NASDAQ" : symbol === "DIA" ? "DOW" : "Russell 2000",
        price,
        change
      };
    });

    // Process popular stocks list
    const stocks = POPULAR_SYMBOLS.map((symbol) => {
      const snap = snapshots[symbol];
      const price = snap?.latestTrade?.p || 0;
      const prevClose = snap?.prevDailyBar?.c || price || 1;
      const change = ((price - prevClose) / prevClose) * 100;
      const volume = snap?.dailyBar?.v || 0;

      return {
        symbol,
        name: SYMBOL_NAMES[symbol] || symbol,
        price,
        change,
        volume
      };
    });

    // Categorized lists
    const popular = stocks.slice(0, 5);
    const gainers = [...stocks].sort((a, b) => b.change - a.change).slice(0, 5);
    const losers = [...stocks].sort((a, b) => a.change - b.change).slice(0, 5);
    const volume = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5);

    const highlightsResult = {
      indices,
      popular,
      gainers,
      losers,
      volume
    };

    // 3. Write data to the cache file
    try {
      await fs.writeFile(CACHE_FILE, JSON.stringify(highlightsResult, null, 2), "utf-8");
    } catch (writeError) {
      console.error("Failed to write market highlights cache file:", writeError);
    }

    return NextResponse.json({ data: highlightsResult });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch highlights" },
      { status: 500 }
    );
  }
}
