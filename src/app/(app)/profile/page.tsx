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
  { value: "sedentary", label: "Sedentary", hint: "Little or no exercise" },
  { value: "light", label: "Light", hint: "1–3 days/week" },
  { value: "moderate", label: "Moderate", hint: "3–5 days/week" },
  { value: "active", label: "Active", hint: "6–7 days/week" },
  { value: "very_active", label: "Very active", hint: "Hard exercise / physical job" },
];

export default function ProfilePage() {
  // Hydration-safe external store pattern (no useEffect, no lint error)
  const storedProfile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const [draft, setDraft] = useState<UserProfile>(storedProfile);
  const [saved, setSaved] = useState(false);

  // If storage changes (another tab / future feature), keep draft aligned
  // (simple approach: when user refreshes, it loads from snapshot anyway)

  const valid = useMemo(() => {
    const hOk = draft.heightCm === null || (draft.heightCm >= 80 && draft.heightCm <= 250);
    const aOk = draft.age === null || (draft.age >= 10 && draft.age <= 120);
    return hOk && aOk;
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
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-slate-600">
          Save your basic details once. NutriCare will use them for smarter tools (BMR/TDEE, targets, tracking).
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Your details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              value={draft.heightCm ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                update("heightCm", v ? Number(v) : null);
              }}
              placeholder="e.g. 172"
              inputMode="numeric"
            />
            <p className="text-xs text-slate-500">Used for BMI and other calculations.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age (years)</Label>
            <Input
              id="age"
              value={draft.age ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                update("age", v ? Number(v) : null);
              }}
              placeholder="e.g. 24"
              inputMode="numeric"
            />
            <p className="text-xs text-slate-500">Used for BMR/TDEE.</p>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <div className="flex flex-wrap gap-2">
              {(["male", "female", "other"] as const).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={draft.gender === g ? "default" : "outline"}
                  onClick={() => update("gender", g)}
                >
                  {g === "male" ? "Male" : g === "female" ? "Female" : "Other"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Goal</Label>
            <div className="flex flex-wrap gap-2">
              {(["lose", "maintain", "gain"] as const).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={draft.goal === g ? "default" : "outline"}
                  onClick={() => update("goal", g)}
                >
                  {g === "lose" ? "Lose weight" : g === "gain" ? "Gain weight" : "Maintain"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Activity level</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {activityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("activity", opt.value)}
                  className={[
                    "rounded-2xl border p-3 text-left",
                    draft.activity === opt.value ? "border-slate-900 bg-slate-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-xs text-slate-600">{opt.hint}</div>
                </button>
              ))}
            </div>

            {!valid ? (
              <p className="text-xs text-red-600">
                Please enter realistic values (Height 80–250cm, Age 10–120).
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <Button onClick={onSave} disabled={!valid}>
              {saved ? "Saved ✓" : "Save profile"}
            </Button>

            {/* Optional: show what's currently stored */}
            <span className="text-xs text-slate-500">
              Stored goal: <span className="font-medium">{storedProfile.goal}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-600">
          Calorie targets (BMR/TDEE) and smarter recommendations based on your profile.
        </CardContent>
      </Card>
    </div>
  );
}
