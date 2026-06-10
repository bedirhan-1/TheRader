import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { alpaca } from "@/lib/alpaca";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stocks = await prisma.stock.findMany({
      where: { active: true },
      include: { _count: { select: { strategies: true } } },
      orderBy: { symbol: "asc" },
    });

    // Get snapshots for all symbols
    const symbols = stocks.map((s: { symbol: string }) => s.symbol);
    let snapshots: Record<string, unknown> = {};
    if (symbols.length > 0) {
      try {
        snapshots = await alpaca.getSnapshots(symbols);
      } catch {
        // Alpaca may not be configured yet
      }
    }

    const data = stocks.map((stock: any) => ({
      ...stock,
      snapshot: snapshots[stock.symbol] || null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol } = await request.json();
    const upperSymbol = symbol.toUpperCase();

    // Check if already exists
    const existing = await prisma.stock.findUnique({
      where: { symbol: upperSymbol },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu hisse zaten mevcut" },
        { status: 400 }
      );
    }

    // Validate on Alpaca
    let asset;
    try {
      asset = await alpaca.getAsset(upperSymbol);
    } catch {
      return NextResponse.json(
        { error: "Geçersiz sembol veya Alpaca bağlantısı yok" },
        { status: 400 }
      );
    }

    if (!asset.tradable) {
      return NextResponse.json(
        { error: "Bu hisse alım-satıma kapalı" },
        { status: 400 }
      );
    }

    const stock = await prisma.stock.create({
      data: {
        symbol: upperSymbol,
        name: asset.name || null,
      },
    });

    return NextResponse.json({ data: stock }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
