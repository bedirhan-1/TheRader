import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { apiKey, secretKey, isLive } = body;

    if (!apiKey || !secretKey) {
      return NextResponse.json({ error: "API Key and Secret Key are required" }, { status: 400 });
    }

    // If masked placeholder is provided, retrieve key from DB depending on mode
    if (secretKey === "••••••••••••••••••••") {
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const secretEncrypted = isLive ? user?.alpacaLiveSecret : user?.alpacaPaperSecret;
      
      if (secretEncrypted) {
        secretKey = decrypt(secretEncrypted);
      } else {
        return NextResponse.json({ error: "No stored secret key to test" }, { status: 400 });
      }
    }

    const baseUrl = isLive
      ? "https://api.alpaca.markets"
      : "https://paper-api.alpaca.markets";

    const response = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
    });

    if (response.ok) {
      const accountData = await response.json();
      return NextResponse.json({ success: true, data: accountData });
    } else {
      const errBody = await response.text();
      return NextResponse.json(
        { error: `Alpaca rejected connection: ${response.statusText}. Details: ${errBody}` },
        { status: 400 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
