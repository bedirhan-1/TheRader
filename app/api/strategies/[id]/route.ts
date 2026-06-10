import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const strategy = await prisma.strategy.findUnique({
      where: { id },
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
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
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
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.strategy.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
