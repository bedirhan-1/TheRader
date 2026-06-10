import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          alpacaMode: "paper",
          alpacaPaperKey: "",
          alpacaPaperSecret: "",
          alpacaLiveKey: "",
          alpacaLiveSecret: "",
          cronExpression: "*/5 * * * *",
          tradeOutsideHours: false,
        },
      });
    }

    // Mask secret keys and decrypt API keys for viewing
    const decryptedSettings = {
      ...settings,
      alpacaPaperKey: settings.alpacaPaperKey ? decrypt(settings.alpacaPaperKey) : "",
      alpacaPaperSecret: settings.alpacaPaperSecret ? "••••••••••••••••••••" : "",
      alpacaLiveKey: settings.alpacaLiveKey ? decrypt(settings.alpacaLiveKey) : "",
      alpacaLiveSecret: settings.alpacaLiveSecret ? "••••••••••••••••••••" : "",
    };

    return NextResponse.json({ data: decryptedSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      alpacaMode,
      alpacaPaperKey,
      alpacaPaperSecret,
      alpacaLiveKey,
      alpacaLiveSecret,
      cronExpression,
      tradeOutsideHours,
    } = body;

    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          alpacaMode: "paper",
          alpacaPaperKey: "",
          alpacaPaperSecret: "",
          alpacaLiveKey: "",
          alpacaLiveSecret: "",
          cronExpression: "*/5 * * * *",
          tradeOutsideHours: false,
        },
      });
    }

    const updateData: Record<string, any> = {};
    if (alpacaMode !== undefined) updateData.alpacaMode = alpacaMode;
    
    if (alpacaPaperKey !== undefined) {
      updateData.alpacaPaperKey = alpacaPaperKey ? encrypt(alpacaPaperKey) : "";
    }
    if (alpacaPaperSecret !== undefined && alpacaPaperSecret !== "••••••••••••••••••••") {
      updateData.alpacaPaperSecret = alpacaPaperSecret ? encrypt(alpacaPaperSecret) : "";
    }
    if (alpacaLiveKey !== undefined) {
      updateData.alpacaLiveKey = alpacaLiveKey ? encrypt(alpacaLiveKey) : "";
    }
    if (alpacaLiveSecret !== undefined && alpacaLiveSecret !== "••••••••••••••••••••") {
      updateData.alpacaLiveSecret = alpacaLiveSecret ? encrypt(alpacaLiveSecret) : "";
    }
    
    if (cronExpression !== undefined) updateData.cronExpression = cronExpression;
    if (tradeOutsideHours !== undefined) updateData.tradeOutsideHours = tradeOutsideHours;

    const updated = await prisma.settings.update({
      where: { id: settings.id },
      data: updateData,
    });

    const decryptedSettings = {
      ...updated,
      alpacaPaperKey: updated.alpacaPaperKey ? decrypt(updated.alpacaPaperKey) : "",
      alpacaPaperSecret: updated.alpacaPaperSecret ? "••••••••••••••••••••" : "",
      alpacaLiveKey: updated.alpacaLiveKey ? decrypt(updated.alpacaLiveKey) : "",
      alpacaLiveSecret: updated.alpacaLiveSecret ? "••••••••••••••••••••" : "",
    };

    return NextResponse.json({ data: decryptedSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
