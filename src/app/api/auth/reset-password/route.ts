import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const limit = await consumeRateLimit({
      namespace: "auth:reset-password:ip",
      identifier: getClientIp(req),
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(limit) },
      );
    }

    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reset request." },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimed.count !== 1) {
        throw new Error("Password reset token is no longer valid.");
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          authVersion: { increment: 1 },
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset-password route error:", error);

    return NextResponse.json(
      { error: "Unable to reset the password right now." },
      { status: 500 },
    );
  }
}
