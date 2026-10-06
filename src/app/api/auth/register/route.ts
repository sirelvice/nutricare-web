import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/security/auth-validation";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { apiError, badRequest, internalServerError } from "@/lib/api/errors";
import {
  recordSecurityEvent,
  SECURITY_EVENT_TYPES,
  SECURITY_EVENT_OUTCOMES,
} from "@/lib/security/events";

const REGISTRATION_ACCEPTED_RESPONSE = {
  ok: true,
  message:
    "If an account can be created with this email, the next step is ready.",
};

export async function POST(request: NextRequest) {
  try {
    const limit = await consumeRateLimit({
      namespace: "auth:register:ip",
      identifier: getClientIp(request),
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (!limit.allowed) {
      await recordSecurityEvent({
        type: SECURITY_EVENT_TYPES.AUTH_REGISTER,
        outcome: SECURITY_EVENT_OUTCOMES.FAILURE,
      });

      return apiError(
        "Too many registration attempts. Please try again later.",
        429,
        rateLimitHeaders(limit),
      );
    }
    const parsed = registerSchema.safeParse(await request.json());

    if (!parsed.success) {
      return badRequest(
        parsed.error.issues[0]?.message ??
          "Invalid registration details.",
      );
    }

    const { name, email, password } = parsed.data;
    const trimmedEmail = email;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(REGISTRATION_ACCEPTED_RESPONSE, {
        status: 201,
      });
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: name ? name.trim() : null,
        passwordHash,
      },
    }).catch(async (error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // Confirm an email collision before accepting a concurrent registration.
        const concurrentUser = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (concurrentUser) {
          return null;
        }
      }

      throw error;
    });

    if (!user) {
      return NextResponse.json(REGISTRATION_ACCEPTED_RESPONSE, {
        status: 201,
      });
    }

    await recordSecurityEvent({
      type: SECURITY_EVENT_TYPES.AUTH_REGISTER,
      outcome: SECURITY_EVENT_OUTCOMES.SUCCESS,
      userId: user.id,
    });

    // Clean logging
    console.log("New user registration completed.");

    return NextResponse.json(REGISTRATION_ACCEPTED_RESPONSE, {
      status: 201,
    });
  } catch {
    console.error("Register API request failed.");
    return internalServerError(
      "Something went wrong. Please try again later.",
    );
  }
}
