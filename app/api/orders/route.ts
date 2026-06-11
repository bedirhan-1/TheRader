import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAlpacaClient, syncPendingOrders } from "@/lib/alpaca";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sync order statuses before returning
  await syncPendingOrders(session.user.id);

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");
  const side = searchParams.get("side");
  const symbol = searchParams.get("symbol");

  const where: Record<string, any> = { userId: session.user.id };
  if (status) where.status = status;
  if (side) where.side = side;
  if (symbol) where.stock = { symbol: { contains: symbol.toUpperCase() } };

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { stock: { select: { symbol: true } }, strategy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ data: orders, total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role?: string };

  try {
    const body = await request.json();
    const { symbol, side, qty, type, time_in_force, limit_price, stop_price } = body;

    const alpaca = getAlpacaClient(user.id);

    // Place order via Alpaca
    const alpacaOrder = await alpaca.placeOrder({
      symbol,
      qty,
      side,
      type,
      time_in_force: time_in_force || "day",
      limit_price,
      stop_price,
    });

    // Find or create stock
    let stock = await prisma.stock.findUnique({ where: { symbol: symbol.toUpperCase() } });
    if (!stock) {
      stock = await prisma.stock.create({
        data: { symbol: symbol.toUpperCase(), name: null },
      });
    }

    // Save to DB
    const order = await prisma.order.create({
      data: {
        alpacaId: alpacaOrder.id,
        userId: user.id,
        stockId: stock.id,
        side: side.toUpperCase() as "BUY" | "SELL",
        qty: parseFloat(String(qty)),
        type: type.toUpperCase() as "MARKET" | "LIMIT" | "STOP",
        limitPrice: limit_price ? parseFloat(String(limit_price)) : null,
        status: "PENDING",
      },
      include: { stock: true },
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
