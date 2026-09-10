import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/security/auth-validation";
import { getAppUrl } from "@/lib/security/runtime-config";
import { apiError, badRequest, internalServerError } from "@/lib/api/errors";
import {
  recordSecurityEvent,
  SECURITY_EVENT_TYPES,
  SECURITY_EVENT_OUTCOMES,
} from "@/lib/security/events";

export const runtime = "nodejs";

const schema = forgotPasswordSchema;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Password reset email service is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Reset your NutriCare password",
      html: `
        <p>We received a request to reset your NutriCare password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour and can only be used once.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Password reset email failed: ${response.status} ${text}`);
  }
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return badRequest("Enter a valid email address.");
    }

    const email = parsed.data.email.toLowerCase();

    const ipLimit = await consumeRateLimit({
      namespace: "auth:forgot-password:ip",
      identifier: getClientIp(req),
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!ipLimit.allowed) {
      await recordSecurityEvent({
        type: SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUEST,
        outcome: SECURITY_EVENT_OUTCOMES.FAILURE,
      });

      return apiError(
        "Too many password reset requests. Please try again later.",
        429,
        rateLimitHeaders(ipLimit),
      );
    }

    const accountLimit = await consumeRateLimit({
      namespace: "auth:forgot-password:account",
      identifier: `${email}:${getClientIp(req)}`,
      limit: 3,
      windowSeconds: 60 * 60,
    });

    if (!accountLimit.allowed) {
      await recordSecurityEvent({
        type: SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUEST,
        outcome: SECURITY_EVENT_OUTCOMES.FAILURE,
      });

      return apiError(
        "Too many password reset requests. Please try again later.",
        429,
        rateLimitHeaders(accountLimit),
      );
    }

    const apiKeyConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL,
    );

    if (!apiKeyConfigured) {
      await recordSecurityEvent({
        type: SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUEST,
        outcome: SECURITY_EVENT_OUTCOMES.FAILURE,
      });

      console.error("Password reset email service is not configured.");
      return NextResponse.json(
        { error: "Password reset is temporarily unavailable." },
        { status: 503 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({
        ok: true,
        message:
          "If an account exists for that email, reset instructions will be sent shortly.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    let baseUrl: string;

    try {
      baseUrl = getAppUrl() ?? "";
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });
      throw error;
    }

    if (!baseUrl) {
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });
      throw new Error("Application URL is not configured.");
    }

    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });
      throw error;
    }

    await recordSecurityEvent({
      type: SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUEST,
      outcome: SECURITY_EVENT_OUTCOMES.SUCCESS,
    });

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, reset instructions will be sent shortly.",
    });
  } catch (error) {
    await recordSecurityEvent({
      type: SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUEST,
      outcome: SECURITY_EVENT_OUTCOMES.FAILURE,
    });

    console.error("Forgot-password route failed.");

    return internalServerError(
      "Unable to process the password reset request right now.",
    );
  }
}
