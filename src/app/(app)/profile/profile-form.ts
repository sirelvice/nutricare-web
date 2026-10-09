import type { UserProfile } from "@/lib/profile/domain";
import { profileSchema } from "@/lib/profile/schema";

export type ProfileDraft = Omit<UserProfile, "heightCm" | "age"> & {
  heightCm: string;
  age: string;
};

export const emptyProfile: UserProfile = {
  heightCm: null, age: null, gender: "other", activity: "sedentary", goal: "maintain",
};

export function toProfileDraft(profile: UserProfile): ProfileDraft {
  return { ...profile, heightCm: profile.heightCm?.toString() ?? "", age: profile.age?.toString() ?? "" };
}

function measurement(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Reject formats such as hexadecimal and scientific notation in this form.
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

export function parseProfileDraft(draft: ProfileDraft) {
  return profileSchema.safeParse({
    ...draft, heightCm: measurement(draft.heightCm), age: measurement(draft.age),
  });
}
