import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUnique, securityEventCreate, nextAuth } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  securityEventCreate: vi.fn(),
  nextAuth: vi.fn(),
}));

const credentialsProvider = vi.hoisted(() => vi.fn((config) => config));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
    },
    securityEvent: {
      create: securityEventCreate,
    },
  },
}));

vi.mock("next-auth", () => ({
  default: nextAuth,
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: credentialsProvider,
}));

beforeEach(() => {
  vi.resetModules();
  userFindUnique.mockReset();
  securityEventCreate.mockReset();
  nextAuth.mockReset();
  credentialsProvider.mockReset();
});

describe("Auth.js authentication security events", () => {
  it("records a failed login when credentials are invalid", async () => {
    nextAuth.mockReturnValue({
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    credentialsProvider.mockImplementation((providerConfig) => providerConfig);

    await import("./auth");

    const authConfig = vi.mocked(nextAuth).mock.calls[0]?.[0];
    const credentialsConfig = authConfig?.providers?.[0] as {
      authorize?: (credentials: Record<string, unknown>) => Promise<unknown>;
    };

    const result = await credentialsConfig.authorize?.({
      email: "not-an-email",
      password: "short",
    });

    expect(result).toBeNull();
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "AUTH_LOGIN",
        outcome: "FAILURE",
        userId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it("records a failed login without identifying an unknown account", async () => {
    userFindUnique.mockResolvedValue(null);

    nextAuth.mockReturnValue({
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    credentialsProvider.mockImplementation((providerConfig) => providerConfig);

    await import("./auth");

    const authConfig = vi.mocked(nextAuth).mock.calls[0]?.[0];
    const credentialsConfig = authConfig?.providers?.[0] as {
      authorize?: (credentials: Record<string, unknown>) => Promise<unknown>;
    };

    const result = await credentialsConfig.authorize?.({
      email: "unknown@example.com",
      password: "password-123",
    });

    expect(result).toBeNull();
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "AUTH_LOGIN",
        outcome: "FAILURE",
        userId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });
});

describe("Auth.js session invalidation", () => {
  it("embeds the user's authVersion into a newly issued JWT", async () => {
    const config = {
      callbacks: {},
      providers: [],
    };

    nextAuth.mockReturnValue({
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    credentialsProvider.mockImplementation((providerConfig) => providerConfig);

    const { default: _unused } = await import("next-auth").catch(() => ({
      default: undefined,
    }));

    void _unused;

    const authModule = await import("./auth");
    const authConfig = vi.mocked(nextAuth).mock.calls[0]?.[0];

    void config;
    void authModule;

    expect(authConfig).toBeDefined();
    expect(authConfig.callbacks?.jwt).toBeDefined();

    const token = await authConfig!.callbacks!.jwt!({
      token: {},
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
        authVersion: 7,
      },
    } as never);

    expect(token).toMatchObject({
      sub: "user-1",
      email: "user@example.com",
      name: "Test User",
      role: "USER",
      authVersion: 7,
    });
  });

  it("invalidates a JWT when the stored authVersion changes", async () => {
    userFindUnique.mockResolvedValue({ authVersion: 8 });

    nextAuth.mockReturnValue({
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    credentialsProvider.mockImplementation((providerConfig) => providerConfig);

    await import("./auth");
    const authConfig = vi.mocked(nextAuth).mock.calls[0]?.[0];

    const token = await authConfig!.callbacks!.jwt!({
      token: {
        sub: "user-1",
        authVersion: 7,
      },
    } as never);

    expect(token).toMatchObject({
      sub: "user-1",
      authVersion: 7,
      invalidated: true,
    });

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { authVersion: true },
    });
  });

  it("invalidates a legacy JWT that has no authVersion", async () => {
    userFindUnique.mockResolvedValue({ authVersion: 0 });

    nextAuth.mockReturnValue({
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    credentialsProvider.mockImplementation((providerConfig) => providerConfig);

    await import("./auth");
    const authConfig = vi.mocked(nextAuth).mock.calls[0]?.[0];

    const token = await authConfig!.callbacks!.jwt!({
      token: {
        sub: "user-1",
      },
    } as never);

    expect(token.invalidated).toBe(true);
  });

  it("does not invalidate a JWT when the stored authVersion matches", async () => {
    userFindUnique.mockResolvedValue({ authVersion: 7 });

    nextAuth.mockReturnValue({
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    credentialsProvider.mockImplementation((providerConfig) => providerConfig);

    await import("./auth");
    const authConfig = vi.mocked(nextAuth).mock.calls[0]?.[0];

    const token = await authConfig!.callbacks!.jwt!({
      token: {
        sub: "user-1",
        authVersion: 7,
      },
    } as never);

    expect(token).toMatchObject({
      sub: "user-1",
      authVersion: 7,
    });
    expect(token.invalidated).toBeUndefined();
  });

  it("rejects an invalidated session", async () => {
    nextAuth.mockReturnValue({
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    credentialsProvider.mockImplementation((providerConfig) => providerConfig);

    await import("./auth");
    const authConfig = vi.mocked(nextAuth).mock.calls[0]?.[0];

    await expect(
      authConfig!.callbacks!.session!({
        session: { user: {} },
        token: {
          sub: "user-1",
          authVersion: 7,
          invalidated: true,
        },
      } as never),
    ).rejects.toThrow("Session invalidated");
  });
});
