import { describe, expect, it } from "vitest";
import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  nameSchema,
  passwordSchema,
  newPasswordSchema,
  PASSWORD_BYTE_LIMIT_MESSAGE,
  registerSchema,
  resetPasswordSchema,
} from "./auth-validation";

describe("auth validation", () => {
  it.each(["a".repeat(72), "é".repeat(36), "😀".repeat(18)])(
    "accepts new passwords at the 72-byte boundary", (password) => {
      expect(newPasswordSchema.safeParse(password).success).toBe(true);
      expect(registerSchema.safeParse({ email: "user@example.com", password }).success).toBe(true);
      expect(resetPasswordSchema.safeParse({ token: "a".repeat(64), password }).success).toBe(true);
    },
  );

  it.each(["a".repeat(73), "é".repeat(37), "😀".repeat(19)])(
    "rejects new passwords beyond 72 bytes while preserving existing login input", (password) => {
      const result = newPasswordSchema.safeParse(password);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toBe(PASSWORD_BYTE_LIMIT_MESSAGE);
      expect(registerSchema.safeParse({ email: "user@example.com", password }).success).toBe(false);
      expect(resetPasswordSchema.safeParse({ token: "a".repeat(64), password }).success).toBe(false);
      expect(loginSchema.safeParse({ email: "user@example.com", password }).success).toBe(true);
    },
  );

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
