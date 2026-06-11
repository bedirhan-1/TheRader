import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { alpaca } from "@/lib/alpaca";

// In-memory cache for Alpaca asset list
let cachedAssets: any[] | null = null;
let lastFetched: number = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toUpperCase() || "";

  try {
    const now = Date.now();
    if (!cachedAssets || now - lastFetched > CACHE_TTL) {
      // Fetch active, tradable US equities from Alpaca
      const allAssets = await alpaca.getAssets("active", "us_equity");
      cachedAssets = allAssets.filter((asset: any) => asset.tradable);
      lastFetched = now;
    }

    // Filter and score by query
    let results = cachedAssets;
    if (query) {
      const scored = cachedAssets
        .map((asset: any) => {
          const symbol = asset.symbol.toUpperCase();
          const name = (asset.name || "").toUpperCase();
          let score = 0;

          if (symbol === query) {
            score = 100; // Exact symbol match
          } else if (symbol.startsWith(query)) {
            score = 80; // Symbol starts with query
          } else if (name === query) {
            score = 70; // Exact name match
          } else if (name.startsWith(query)) {
            score = 50; // Name starts with query
          } else if (symbol.includes(query)) {
            score = 30; // Symbol contains query
          } else if (name.includes(query)) {
            score = 20; // Name contains query
          }

          return { asset, score };
        })
        .filter((item: any) => item.score > 0);

      // Sort by score (descending), then alphabetically by symbol (ascending)
      scored.sort((a: any, b: any) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.asset.symbol.localeCompare(b.asset.symbol);
      });

      results = scored.map((item: any) => item.asset);
    }

    // Limit to top 50 results to keep it performant
    return NextResponse.json({ data: results.slice(0, 50) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
