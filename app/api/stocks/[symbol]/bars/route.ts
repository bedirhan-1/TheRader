import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { alpaca } from "@/lib/alpaca";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symbol } = await params;
  const searchParams = request.nextUrl.searchParams;
  const timeframe = searchParams.get("timeframe") || "1Day";
  const days = parseInt(searchParams.get("days") || "30");

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const result = await alpaca.getBars(
      symbol.toUpperCase(),
      timeframe,
      start.toISOString(),
      end.toISOString()
    );

    return NextResponse.json({ data: result.bars || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
