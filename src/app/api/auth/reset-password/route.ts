import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/security/auth-validation";
import { apiError, badRequest, internalServerError } from "@/lib/api/errors";
import {
  recordSecurityEvent,
  SECURITY_EVENT_TYPES,
  SECURITY_EVENT_OUTCOMES,
} from "@/lib/security/events";

export const runtime = "nodejs";

const schema = resetPasswordSchema;

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
      return apiError(
        "Too many password reset attempts. Please try again later.",
        429,
        rateLimitHeaders(limit),
      );
    }

    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return badRequest("Invalid reset request.");
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
      return badRequest("This password reset link is invalid or has expired.");
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

    await recordSecurityEvent({
      type: SECURITY_EVENT_TYPES.PASSWORD_RESET_COMPLETE,
      outcome: SECURITY_EVENT_OUTCOMES.SUCCESS,
      userId: resetToken.userId,
    });

    return NextResponse.json({
      ok: true,
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset-password route failed.");

    return internalServerError("Unable to reset the password right now.");
  }
}
