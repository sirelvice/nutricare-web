import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(320);

export const passwordSchema = z.string().min(8).max(128);

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
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
});
