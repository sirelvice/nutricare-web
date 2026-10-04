import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const SECURITY_EVENT_TYPES = {
  AUTH_LOGIN: "AUTH_LOGIN",
  AUTH_REGISTER: "AUTH_REGISTER",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_COMPLETE: "PASSWORD_RESET_COMPLETE",
  CSRF_REJECTED: "CSRF_REJECTED",
  AUTHORIZATION_DENIED: "AUTHORIZATION_DENIED",
} as const;

export type SecurityEventType =
  (typeof SECURITY_EVENT_TYPES)[keyof typeof SECURITY_EVENT_TYPES];

export const SECURITY_EVENT_OUTCOMES = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
} as const;

export type SecurityEventOutcome =
  (typeof SECURITY_EVENT_OUTCOMES)[keyof typeof SECURITY_EVENT_OUTCOMES];

export interface RecordSecurityEventInput {
  type: SecurityEventType;
  outcome: SecurityEventOutcome;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export async function recordSecurityEvent(
  input: RecordSecurityEventInput,
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        type: input.type,
        outcome: input.outcome,
        userId: input.userId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    // Security-event persistence must not make the protected operation fail.
    console.error("Failed to record security event.", error);
  }
}
