import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const strategy = await prisma.strategy.findFirst({
      where: { id, userId: session.user.id },
      include: {
        stock: {
          select: {
            symbol: true,
          },
        },
      },
    });

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    return NextResponse.json({ data: strategy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role?: string };

  try {
    const { id } = await params;
    
    // Ensure strategy belongs to user
    const existing = await prisma.strategy.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, stockId, type, params: strategyParams, action, qty, enabled } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (stockId !== undefined) data.stockId = stockId;
    if (type !== undefined) data.type = type;
    if (strategyParams !== undefined) data.params = strategyParams;
    if (action !== undefined) data.action = action;
    if (qty !== undefined) data.qty = parseFloat(String(qty));
    if (enabled !== undefined) data.enabled = enabled;

    const strategy = await prisma.strategy.update({
      where: { id },
      data,
      include: {
        stock: {
          select: {
            symbol: true,
          },
        },
      },
    });

    return NextResponse.json({ data: strategy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; role?: string };

  try {
    const { id } = await params;

    // Ensure strategy belongs to user
    const existing = await prisma.strategy.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    await prisma.strategy.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
