import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAlpacaClient } from "@/lib/alpaca";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symbol } = await params;

  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: {
        strategies: {
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        },
        orders: {
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!stock) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get snapshot
    let snapshot = null;
    try {
      const alpaca = getAlpacaClient(session.user.id);
      const snapshots = await alpaca.getSnapshots([stock.symbol]);
      snapshot = snapshots[stock.symbol] || null;
    } catch {
      // Alpaca may not be configured
    }

    return NextResponse.json({ data: { ...stock, snapshot } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symbol } = await params;

  try {
    await prisma.stock.delete({
      where: { symbol: symbol.toUpperCase() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
