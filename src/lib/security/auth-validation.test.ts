import { describe, expect, it } from "vitest";
import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  nameSchema,
  passwordSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth-validation";

describe("auth validation", () => {
  it("normalizes and validates email addresses", () => {
    expect(emailSchema.parse("  USER@EXAMPLE.COM ")).toBe("user@example.com");
  });

  it("rejects invalid or overlong email addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse(`${"a".repeat(321)}@example.com`).success).toBe(false);
  });

  it("enforces password length bounds", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });

  it("allows an omitted or empty name but validates non-empty names", () => {
    expect(registerSchema.parse({
      email: "user@example.com",
      password: "password-123",
    }).name).toBeUndefined();

    expect(nameSchema.parse("")).toBe("");
    expect(nameSchema.safeParse("A").success).toBe(false);
    expect(nameSchema.safeParse("Test User").success).toBe(true);
    expect(nameSchema.safeParse("a".repeat(101)).success).toBe(false);
  });

  it("uses the same email/password rules for login", () => {
    expect(loginSchema.parse({
      email: "USER@EXAMPLE.COM",
      password: "password-123",
    })).toEqual({
      email: "user@example.com",
      password: "password-123",
    });
  });

  it("uses the shared rules for password reset flows", () => {
    expect(forgotPasswordSchema.parse({
      email: "USER@EXAMPLE.COM",
    })).toEqual({
      email: "user@example.com",
    });

    expect(resetPasswordSchema.safeParse({
      token: "a".repeat(32),
      password: "password-123",
    }).success).toBe(true);
  });
});
