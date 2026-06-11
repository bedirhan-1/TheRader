import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAlpacaClient, syncPendingOrders } from "@/lib/alpaca";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sync order statuses before returning
  await syncPendingOrders(session.user.id);

  const { id } = await params;

  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: { stock: true, strategy: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role?: string };
  const { id } = await params;

  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Cancel on Alpaca if has alpacaId
    if (order.alpacaId) {
      try {
        const alpaca = getAlpacaClient(user.id);
        await alpaca.cancelOrder(order.alpacaId);
      } catch {
        // May already be filled/cancelled
      }
    }

    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
