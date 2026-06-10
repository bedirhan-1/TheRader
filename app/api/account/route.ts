import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { alpaca } from "@/lib/alpaca";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const type = request.nextUrl.searchParams.get("type");

    if (type === "history") {
      const history = await alpaca.getPortfolioHistory("1M", "1D");
      return NextResponse.json({ data: history });
    }

    const account = await alpaca.getAccount();
    return NextResponse.json({ data: account });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
