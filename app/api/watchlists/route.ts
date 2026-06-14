import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";
import { getAlpacaClient } from "@/lib/alpaca";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const headers = await getBackendHeaders();
    const response = await backendApi.get("/api/watchlists", { headers });
    const watchlists = response.data || [];

    // Extract all unique stock symbols across all watchlists
    const symbols = Array.from(
      new Set(
        watchlists.flatMap((w: any) => (w.stocks || []).map((s: any) => s.symbol))
      )
    ) as string[];

    let snapshots: Record<string, any> = {};
    if (symbols.length > 0) {
      try {
        const alpaca = getAlpacaClient(session.user.id);
        snapshots = await alpaca.getSnapshots(symbols);
      } catch (e) {
        console.error("Error fetching Alpaca snapshots for watchlists:", e);
      }
    }

    // Map snapshots into watchlist stocks
    const enrichedWatchlists = watchlists.map((w: any) => ({
      ...w,
      stocks: (w.stocks || []).map((stock: any) => ({
        ...stock,
        snapshot: snapshots[stock.symbol] || null,
      })),
    }));

    return NextResponse.json({ data: enrichedWatchlists });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const headers = await getBackendHeaders();
    const response = await backendApi.post("/api/watchlists", body, { headers });
    return NextResponse.json({ data: response.data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}
