import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";
import { getAlpacaClient } from "@/lib/alpaca";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role?: string };

  try {
    const { id } = await context.params;
    const body = await request.json();
    const symbol = body.symbol?.toUpperCase();

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    // Validate symbol on Alpaca
    try {
      const alpaca = getAlpacaClient(user.id);
      const asset = await alpaca.getAsset(symbol);
      if (!asset.tradable) {
        return NextResponse.json(
          { error: "Bu hisse alım-satıma kapalı" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Geçersiz sembol veya Alpaca bağlantısı yok" },
        { status: 400 }
      );
    }

    const headers = await getBackendHeaders();
    const response = await backendApi.post(
      `/api/watchlists/${id}/stocks`,
      { symbol },
      { headers }
    );

    return NextResponse.json({ data: response.data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}
