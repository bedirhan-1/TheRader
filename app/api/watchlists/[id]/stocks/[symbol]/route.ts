import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; symbol: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, symbol } = await context.params;
    const headers = await getBackendHeaders();
    const response = await backendApi.delete(
      `/api/watchlists/${id}/stocks/${symbol.toUpperCase()}`,
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
