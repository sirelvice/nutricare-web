import { z } from "zod";

// Shared contract for profile writes and responses. Nullable measurements
// preserve partial setup; calculation readiness is a separate concern.
export const profileSchema = z.object({
  heightCm: z.number().min(80).max(250).nullable(),
  age: z.number().int().min(10).max(120).nullable(),
  gender: z.enum(["male", "female", "other"]),
  activity: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  goal: z.enum(["lose", "maintain", "gain"]),
});
