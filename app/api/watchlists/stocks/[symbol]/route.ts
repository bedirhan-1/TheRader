import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol } = await context.params;
    const headers = await getBackendHeaders();
    const response = await backendApi.get(
      `/api/watchlists/stocks/${symbol.toUpperCase()}`,
      { headers }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}
