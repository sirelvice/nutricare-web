import { describe, expect, it } from "vitest";
import { isSafeLoginPath } from "./login-redirect";

describe("isSafeLoginPath", () => {
  it.each([
    "/dashboard",
    "/tools/bmi?source=login",
    "/profile#goal",
  ])("allows an internal destination: %s", (value) => {
    expect(isSafeLoginPath(value)).toBe(true);
  });

  it.each([
    "",
    "dashboard",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "/dashboard\u0000",
    "/dashboard\u007f",
    "javascript:alert(1)",
  ])("rejects an unsafe destination: %j", (value) => {
    expect(isSafeLoginPath(value)).toBe(false);
  });
});
