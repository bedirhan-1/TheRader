import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const strategies = await prisma.strategy.findMany({
      where: { userId: session.user.id },
      include: {
        stock: {
          select: {
            symbol: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ data: strategies });
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
    const { name, stockId, type, params, action, orderType, qty, enabled } = body;

    if (!name || !stockId || !type || !action || !qty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const strategy = await prisma.strategy.create({
      data: {
        name,
        stockId,
        type,
        userId: user.id,
        params: params || {},
        action,
        orderType: orderType || "MARKET",
        qty: parseFloat(String(qty)),
        enabled: enabled ?? true,
      },
      include: {
        stock: {
          select: {
            symbol: true,
          },
        },
      },
    });

    return NextResponse.json({ data: strategy }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
