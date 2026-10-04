import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    securityEvent: {
      create: mockCreate,
    },
  },
}));

import {
  recordSecurityEvent,
  SECURITY_EVENT_OUTCOMES,
  SECURITY_EVENT_TYPES,
} from "@/lib/security/events";

describe("recordSecurityEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a structured security event", async () => {
    mockCreate.mockResolvedValue({
      id: "event-1",
    });

    await recordSecurityEvent({
      type: SECURITY_EVENT_TYPES.AUTH_LOGIN,
      outcome: SECURITY_EVENT_OUTCOMES.SUCCESS,
      userId: "user-1",
      ipAddress: "203.0.113.10",
      userAgent: "test-agent",
      metadata: {
        method: "credentials",
      },
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        type: "AUTH_LOGIN",
        outcome: "SUCCESS",
        userId: "user-1",
        ipAddress: "203.0.113.10",
        userAgent: "test-agent",
        metadata: {
          method: "credentials",
        },
      },
    });
  });

  it("allows unauthenticated events without a user id", async () => {
    mockCreate.mockResolvedValue({
      id: "event-2",
    });

    await recordSecurityEvent({
      type: SECURITY_EVENT_TYPES.AUTH_REGISTER,
      outcome: SECURITY_EVENT_OUTCOMES.FAILURE,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        type: "AUTH_REGISTER",
        outcome: "FAILURE",
        userId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it("does not propagate audit persistence failures", async () => {
    const error = new Error("database unavailable");
    mockCreate.mockRejectedValue(error);

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      recordSecurityEvent({
        type: SECURITY_EVENT_TYPES.CSRF_REJECTED,
        outcome: SECURITY_EVENT_OUTCOMES.FAILURE,
      }),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to record security event.",
      error,
    );

    consoleError.mockRestore();
  });
});
