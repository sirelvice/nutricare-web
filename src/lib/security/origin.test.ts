import { beforeEach, describe, expect, it } from "vitest";
import {
  assertSameOrigin,
  InvalidRequestOriginError,
} from "./origin";

describe("assertSameOrigin", () => {
  beforeEach(() => {
    process.env.APP_URL = "https://app.nutricare.app";
  });

  it("accepts a matching Origin", () => {
    const request = new Request(
      "https://app.nutricare.app/api/profile",
      {
        method: "PUT",
        headers: {
          origin: "https://app.nutricare.app",
        },
      },
    );

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("accepts a matching Referer when Origin is absent", () => {
    const request = new Request(
      "https://app.nutricare.app/api/profile",
      {
        method: "PUT",
        headers: {
          referer: "https://app.nutricare.app/profile",
        },
      },
    );

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects a foreign Origin", () => {
    const request = new Request(
      "https://app.nutricare.app/api/profile",
      {
        method: "PUT",
        headers: {
          origin: "https://evil.example",
        },
      },
    );

    expect(() => assertSameOrigin(request)).toThrow(
      InvalidRequestOriginError,
    );
  });

  it("rejects a foreign Referer", () => {
    const request = new Request(
      "https://app.nutricare.app/api/profile",
      {
        method: "PUT",
        headers: {
          referer: "https://evil.example/profile",
        },
      },
    );

    expect(() => assertSameOrigin(request)).toThrow(
      InvalidRequestOriginError,
    );
  });

  it("rejects when neither Origin nor Referer is present", () => {
    const request = new Request(
      "https://app.nutricare.app/api/profile",
      {
        method: "PUT",
      },
    );

    expect(() => assertSameOrigin(request)).toThrow(
      InvalidRequestOriginError,
    );
  });

  it("rejects a malformed Origin", () => {
    const request = new Request(
      "https://app.nutricare.app/api/profile",
      {
        method: "PUT",
        headers: {
          origin: "not-a-url",
        },
      },
    );

    expect(() => assertSameOrigin(request)).toThrow(
      InvalidRequestOriginError,
    );
  });

  it("rejects a different port", () => {
    const request = new Request(
      "https://app.nutricare.app/api/profile",
      {
        method: "PUT",
        headers: {
          origin: "https://app.nutricare.app:444",
        },
      },
    );

    expect(() => assertSameOrigin(request)).toThrow(
      InvalidRequestOriginError,
    );
  });
});
