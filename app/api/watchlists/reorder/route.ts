import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json(); // Expected: List of watchlist IDs in sorted order
    const headers = await getBackendHeaders();
    const response = await backendApi.put("/api/watchlists/reorder", body, { headers });
    return NextResponse.json({ data: response.data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}
