import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/security/auth-validation";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = await consumeRateLimit({
      namespace: "auth:register:ip",
      identifier: getClientIp(request),
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(limit) },
      );
    }
    const parsed = registerSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            parsed.error.issues[0]?.message ??
            "Invalid registration details.",
        },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    const trimmedEmail = email;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: true,
          message:
            "If an account can be created with this email, the next step is ready.",
        },
        { status: 201 }
      );
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: name ? name.trim() : null,
        passwordHash,
      },
    });

    // Clean logging
    console.log(`New user registered: ${trimmedEmail}`);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}