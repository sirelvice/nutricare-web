import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(320),
});

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
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const apiKeyConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL,
    );

    if (!apiKeyConfigured) {
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

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      new URL(req.url).origin;

    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });
      throw error;
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, reset instructions will be sent shortly.",
    });
  } catch (error) {
    console.error("Forgot-password route error:", error);

    return NextResponse.json(
      { error: "Unable to process the password reset request right now." },
      { status: 500 },
    );
  }
}
