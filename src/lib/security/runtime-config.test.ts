import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppUrl, getAuthSecret } from "./runtime-config";

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.AUTH_SECRET;
  delete process.env.NEXTAUTH_SECRET;
  delete process.env.APP_URL;
});

describe("runtime configuration", () => {
  it("accepts AUTH_SECRET in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET = "test-secret";

    expect(getAuthSecret()).toBe("test-secret");
  });

  it("fails when no auth secret is configured in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getAuthSecret()).toThrow(
      "AUTH_SECRET or NEXTAUTH_SECRET must be configured in production.",
    );
  });

  it("accepts a valid application URL", () => {
    process.env.APP_URL = "https://app.nutricare.app/";

    expect(getAppUrl()).toBe("https://app.nutricare.app");
  });

  it("rejects an invalid application URL", () => {
    process.env.APP_URL = "not-a-url";

    expect(() => getAppUrl()).toThrow(
      "APP_URL must be a valid absolute URL.",
    );
  });

  it("requires an application URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getAppUrl()).toThrow(
      "APP_URL must be configured in production.",
    );
  });

  it("allows a missing application URL outside production", () => {
    vi.stubEnv("NODE_ENV", "test");

    expect(getAppUrl()).toBeUndefined();
  });
});
