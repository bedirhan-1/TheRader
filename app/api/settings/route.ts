import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = session.user as { id: string; role?: string };

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let globalSettings = null;
    if (currentUser.role === "ADMIN") {
      globalSettings = await prisma.settings.findFirst();
      if (!globalSettings) {
        globalSettings = await prisma.settings.create({
          data: {
            cronExpression: "*/5 * * * *",
            tradeOutsideHours: false,
          },
        });
      }
    }

    const decryptedSettings = {
      alpacaMode: user.alpacaMode,
      alpacaPaperKey: user.alpacaPaperKey ? decrypt(user.alpacaPaperKey) : "",
      alpacaPaperSecret: user.alpacaPaperSecret ? "••••••••••••••••••••" : "",
      alpacaLiveKey: user.alpacaLiveKey ? decrypt(user.alpacaLiveKey) : "",
      alpacaLiveSecret: user.alpacaLiveSecret ? "••••••••••••••••••••" : "",
      cronExpression: globalSettings?.cronExpression ?? "*/5 * * * *",
      tradeOutsideHours: globalSettings?.tradeOutsideHours ?? false,
    };

    return NextResponse.json({ data: decryptedSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = session.user as { id: string; role?: string };

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

    const userUpdateData: Record<string, any> = {};
    if (alpacaMode !== undefined) userUpdateData.alpacaMode = alpacaMode;
    
    if (alpacaPaperKey !== undefined) {
      userUpdateData.alpacaPaperKey = alpacaPaperKey ? encrypt(alpacaPaperKey) : "";
    }
    if (alpacaPaperSecret !== undefined && alpacaPaperSecret !== "••••••••••••••••••••") {
      userUpdateData.alpacaPaperSecret = alpacaPaperSecret ? encrypt(alpacaPaperSecret) : "";
    }
    if (alpacaLiveKey !== undefined) {
      userUpdateData.alpacaLiveKey = alpacaLiveKey ? encrypt(alpacaLiveKey) : "";
    }
    if (alpacaLiveSecret !== undefined && alpacaLiveSecret !== "••••••••••••••••••••") {
      userUpdateData.alpacaLiveSecret = alpacaLiveSecret ? encrypt(alpacaLiveSecret) : "";
    }

    // Update user-specific Alpaca Settings
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: userUpdateData,
    });

    let globalSettings = null;
    if (cronExpression !== undefined || tradeOutsideHours !== undefined) {
      if (currentUser.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Global settings can only be changed by Admin" }, { status: 403 });
      }

      let settings = await prisma.settings.findFirst();
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            cronExpression: "*/5 * * * *",
            tradeOutsideHours: false,
          },
        });
      }

      const globalUpdateData: Record<string, any> = {};
      if (cronExpression !== undefined) globalUpdateData.cronExpression = cronExpression;
      if (tradeOutsideHours !== undefined) globalUpdateData.tradeOutsideHours = tradeOutsideHours;

      globalSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: globalUpdateData,
      });
    } else if (currentUser.role === "ADMIN") {
      globalSettings = await prisma.settings.findFirst();
    }

    const decryptedSettings = {
      alpacaMode: updatedUser.alpacaMode,
      alpacaPaperKey: updatedUser.alpacaPaperKey ? decrypt(updatedUser.alpacaPaperKey) : "",
      alpacaPaperSecret: updatedUser.alpacaPaperSecret ? "••••••••••••••••••••" : "",
      alpacaLiveKey: updatedUser.alpacaLiveKey ? decrypt(updatedUser.alpacaLiveKey) : "",
      alpacaLiveSecret: updatedUser.alpacaLiveSecret ? "••••••••••••••••••••" : "",
      cronExpression: globalSettings?.cronExpression ?? "*/5 * * * *",
      tradeOutsideHours: globalSettings?.tradeOutsideHours ?? false,
    };

    return NextResponse.json({ data: decryptedSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
