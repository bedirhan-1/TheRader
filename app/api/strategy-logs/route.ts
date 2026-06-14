import { NextRequest, NextResponse } from "next/server";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const headers = await getBackendHeaders();
    const res = await backendApi.get(`/api/strategy-logs?limit=${limit}`, { headers });
    return NextResponse.json(res.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.message || "Backend error";
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE() {
  try {
    const headers = await getBackendHeaders();
    const res = await backendApi.delete("/api/strategy-logs", { headers });
    return NextResponse.json(res.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.message || "Backend error";
    return NextResponse.json({ error: msg }, { status });
  }
}
