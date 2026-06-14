import { NextRequest, NextResponse } from "next/server";
import { backendApi, getBackendHeaders } from "@/lib/backend-api";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const headers = await getBackendHeaders();
    const res = await backendApi.patch(`/api/strategies/${id}`, body, { headers });
    return NextResponse.json(res.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.message || "Backend error";
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const headers = await getBackendHeaders();
    const res = await backendApi.delete(`/api/strategies/${id}`, { headers });
    return NextResponse.json(res.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.message || "Backend error";
    return NextResponse.json({ error: msg }, { status });
  }
}
