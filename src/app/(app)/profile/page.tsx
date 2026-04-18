"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  type ActivityLevel,
  type UserProfile,
  saveProfile,
  subscribeProfile,
  getProfileSnapshot,
  getProfileServerSnapshot,
} from "@/lib/profile/storage";

const activityOptions: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: "sedentary", label: "Sedentary", hint: "Little or no activity" },
  { value: "light", label: "Light", hint: "1–3 days/week" },
  { value: "moderate", label: "Moderate", hint: "3–5 days/week" },
  { value: "active", label: "Active", hint: "6–7 days/week" },
  { value: "very_active", label: "Very active", hint: "Very intense / physical job" },
];

export default function ProfilePage() {
  const storedProfile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const [draft, setDraft] = useState<UserProfile>(storedProfile);
  const [saved, setSaved] = useState(false);

  const valid = useMemo(() => {
    const hOk = draft.heightCm === null || (draft.heightCm >= 80 && draft.heightCm <= 250);
    const aOk = draft.age === null || (draft.age >= 10 && draft.age <= 120);
    return hOk && aOk;
  }, [draft]);

  const estimatedCalories = useMemo(() => {
    if (!draft.heightCm || !draft.age || !draft.gender) return null;

    const weightGuess = 70;

    const bmr =
      draft.gender === "male"
        ? 10 * weightGuess + 6.25 * draft.heightCm - 5 * draft.age + 5
        : 10 * weightGuess + 6.25 * draft.heightCm - 5 * draft.age - 161;

    const multiplier =
      draft.activity === "sedentary" ? 1.2 :
      draft.activity === "light" ? 1.375 :
      draft.activity === "moderate" ? 1.55 :
      draft.activity === "active" ? 1.725 : 1.9;

    return Math.round(bmr * multiplier);
  }, [draft]);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setSaved(false);
    setDraft((p) => ({ ...p, [key]: value }));
  }

  function onSave() {
    if (!valid) return;
    saveProfile(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="text-slate-600">
          Your information helps us calculate your daily needs and recommendations.
        </p>
      </div>

      {/* SUMMARY */}
      <Card className="rounded-3xl border bg-gradient-to-br from-green-50 to-white shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-slate-600">Current setup</p>

          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-white border">
              Height: {draft.heightCm ?? "—"} cm
            </span>
            <span className="px-3 py-1 rounded-full bg-white border">
              Age: {draft.age ?? "—"}
            </span>
            <span className="px-3 py-1 rounded-full bg-white border">
              Goal: {draft.goal === "gain"
                ? "Gain weight"
                : draft.goal === "lose"
                  ? "Lose weight"
                  : draft.goal === "maintain"
                    ? "Maintain"
                    : "—"}
            </span>
            <span className="px-3 py-1 rounded-full bg-white border">
              Activity: {draft.activity ?? "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* PREMIUM CALORIE CARD */}
      {estimatedCalories && (
        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 via-white to-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Estimated daily calories</p>
              <p className="text-3xl font-bold">~{estimatedCalories} kcal</p>
              <p className="text-xs text-slate-500">
                Based on your profile
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
              🔥
            </div>
          </CardContent>
        </Card>
      )}

      {/* FORM */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                value={draft.heightCm ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  update("heightCm", v ? Number(v) : null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Age (years)</Label>
              <Input
                value={draft.age ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  update("age", v ? Number(v) : null);
                }}
              />
            </div>
          </div>

          {/* GENDER - Changed to Select */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <select
              value={draft.gender ?? ""}
              onChange={(e) => update("gender", e.target.value as "male" | "female" | "other")}
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 text-sm focus:outline-none focus:border-emerald-600"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* GOAL - Changed to Select */}
          <div className="space-y-2">
            <Label>Your goal</Label>
            <select
              value={draft.goal ?? ""}
              onChange={(e) => update("goal", e.target.value as "lose" | "maintain" | "gain")}
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 text-sm focus:outline-none focus:border-emerald-600"
            >
              <option value="">Select goal</option>
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain weight</option>
              <option value="gain">Gain weight</option>
            </select>
          </div>

          {/* ACTIVITY - Changed to Select */}
          <div className="space-y-2">
            <Label>Activity level</Label>
            <select
              value={draft.activity ?? ""}
              onChange={(e) => update("activity", e.target.value as ActivityLevel)}
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 text-sm focus:outline-none focus:border-emerald-600"
            >
              <option value="">Select activity level</option>
              {activityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.hint}
                </option>
              ))}
            </select>
          </div>

          {/* SAVE */}
          <div className="flex items-center gap-3">
            <Button onClick={onSave} disabled={!valid}>
              {saved ? "Saved ✓" : "Save profile"}
            </Button>

            <span className="text-xs text-slate-500">
              Your data stays on this device.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ACTIONABLE NEXT STEP */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardContent className="p-5">
          <p className="text-sm text-slate-600">
            Once your profile is complete, you can start tracking your weight and calories from the dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}