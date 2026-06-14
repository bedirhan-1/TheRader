import { NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backendUrl = process.env.SPRING_API_URL || "http://localhost:8080";
    const res = await axios.get(`${backendUrl}/api/health`, { timeout: 2000 });
    return NextResponse.json(res.data);
  } catch (error) {
    return NextResponse.json({ status: "DOWN" }, { status: 503 });
  }
}
