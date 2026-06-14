import { NextRequest, NextResponse } from "next/server";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function GET() {
  try {
    const headers = await getBackendHeaders();
    const res = await backendApi.get("/api/strategies", { headers });
    return NextResponse.json(res.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.message || "Backend error";
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await getBackendHeaders();
    const res = await backendApi.post("/api/strategies", body, { headers });
    return NextResponse.json(res.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.message || "Backend error";
    return NextResponse.json({ error: msg }, { status });
  }
}
