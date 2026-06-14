import { NextRequest, NextResponse } from "next/server";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const headers = await getBackendHeaders();
    const response = await backendApi.get("/api/orders", {
      headers,
      params: Object.fromEntries(searchParams),
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await getBackendHeaders();
    const response = await backendApi.post("/api/orders", body, { headers });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}
