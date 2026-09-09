"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActivityLevel } from "@/lib/calc/metabolism";
import type { UserProfile } from "@/lib/profile/domain";

const activityOptions: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: "sedentary", label: "Sedentary", hint: "Little or no activity" },
  { value: "light", label: "Light", hint: "1–3 days/week" },
  { value: "moderate", label: "Moderate", hint: "3–5 days/week" },
  { value: "active", label: "Active", hint: "6–7 days/week" },
  { value: "very_active", label: "Very active", hint: "Very intense / physical job" },
];

export default function ProfilePage() {
  const [draft, setDraft] = useState<UserProfile>({
    heightCm: null,
    gender: "other",
    age: null,
    activity: "sedentary",
    goal: "maintain",
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");

        if (!response.ok) {
          throw new Error("Unable to load profile.");
        }

        const data = (await response.json()) as UserProfile | null;

        if (data) {
          setDraft(data);
        }
      } catch {
        setLoadError("Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const valid = useMemo(() => {
    const hOk = draft.heightCm === null || (draft.heightCm >= 80 && draft.heightCm <= 250);
    const aOk = draft.age === null || (draft.age >= 10 && draft.age <= 120);
    return hOk && aOk;
  }, [draft]);



  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setSaved(false);
    setDraft((p) => ({ ...p, [key]: value }));
  }

  async function onSave() {
    if (!valid || saving) return;

    setSaved(false);
    setSaving(true);
    setLoadError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error || "Unable to save profile.");
      }

      const profile = (await response.json()) as UserProfile;
      setDraft(profile);
      setSaved(true);

      window.setTimeout(() => setSaved(false), 1500);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to save profile.",
      );
    } finally {
      setSaving(false);
    }
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

      {loading && (
        <p className="text-sm text-slate-500">Loading your profile...</p>
      )}

      {loadError && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {loadError}
        </div>
      )}

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

      {/* CALORIES */}


      {/* FORM */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>

        {/* ✅ KEY FIXES ARE HERE */}
        <CardContent className="space-y-4">

          {/* HEIGHT + AGE */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="height-cm">Height (cm)</Label>
              <Input
                id="height-cm"
                className="h-10 rounded-xl"
                value={draft.heightCm ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  update("heightCm", v ? Number(v) : null);
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="age-years">Age (years)</Label>
              <Input
                id="age-years"
                className="h-10 rounded-xl"
                value={draft.age ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  update("age", v ? Number(v) : null);
                }}
              />
            </div>
          </div>

          {/* GENDER + GOAL (SIDE BY SIDE) */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={draft.gender ?? ""}
                onChange={(e) =>
                  update("gender", e.target.value as "male" | "female" | "other")
                }
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-emerald-600"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="goal">Your goal</Label>
              <select
                id="goal"
                value={draft.goal ?? ""}
                onChange={(e) =>
                  update("goal", e.target.value as "lose" | "maintain" | "gain")
                }
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-emerald-600"
              >
                <option value="" disabled>
                  Select goal
                </option>
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain weight</option>
                <option value="gain">Gain weight</option>
              </select>
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="space-y-1">
            <Label htmlFor="activity-level">Activity level</Label>
            <select
              id="activity-level"
              value={draft.activity ?? ""}
              onChange={(e) =>
                update("activity", e.target.value as ActivityLevel)
              }
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-emerald-600"
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
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onSave} disabled={!valid || saving}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save profile"}
            </Button>

            <span className="text-xs text-slate-500">
              Your profile is securely saved to your account.
            </span>
          </div>

        </CardContent>
      </Card>

      {/* FOOTER */}
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