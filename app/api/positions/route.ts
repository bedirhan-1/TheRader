import { NextResponse } from "next/server";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function GET() {
  try {
    const headers = await getBackendHeaders();
    const response = await backendApi.get("/api/positions", { headers });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "Backend error" },
      { status: error.response?.status || 500 }
    );
  }
}
