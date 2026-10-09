import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(320);

// Keep the established login contract for existing bcrypt hashes.
export const passwordSchema = z.string().min(8).max(128);

export const PASSWORD_BYTE_LIMIT_MESSAGE =
  "Password is too long. Use at most 72 UTF-8 bytes; accented characters and emoji may use multiple bytes.";

// bcrypt silently truncates input after 72 bytes. Bound new passwords before hashing.
export const newPasswordSchema = passwordSchema.refine(
  (value) => new TextEncoder().encode(value).byteLength <= 72,
  { message: PASSWORD_BYTE_LIMIT_MESSAGE },
);

export const nameSchema = z
  .string()
  .trim()
  .max(100)
  .refine((value) => value.length === 0 || value.length >= 2, {
    message: "Name must be at least 2 characters long.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema,
  password: newPasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: newPasswordSchema,
});
