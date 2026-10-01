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
    <div className="space-y-8">
      {/* HEADER */}
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Personal settings</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Your profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          Keep your details up to date so NutriCare can calculate your daily
          needs and personalise your recommendations.
        </p>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading your profile...
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {loadError}
        </div>
      )}

      {/* CURRENT SETUP */}
      <Card className="overflow-hidden rounded-3xl border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 shadow-sm">
        <CardHeader className="pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Current setup
            </p>
            <CardTitle className="mt-1 text-xl text-slate-950">
              Your profile at a glance
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Height
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {draft.heightCm ?? "—"}
                <span className="ml-1 text-sm font-medium text-slate-500">
                  cm
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Age
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {draft.age ?? "—"}
                {draft.age !== null && (
                  <span className="ml-1 text-sm font-medium text-slate-500">
                    years
                  </span>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Goal
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {draft.goal === "gain"
                  ? "Gain weight"
                  : draft.goal === "lose"
                    ? "Lose weight"
                    : draft.goal === "maintain"
                      ? "Maintain weight"
                      : "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Activity
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {activityOptions.find((opt) => opt.value === draft.activity)?.label ??
                  "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FORM */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Personal information
          </p>
          <CardTitle className="mt-1 text-xl text-slate-950">
            Your details
          </CardTitle>
          <p className="text-sm leading-6 text-slate-600">
            These details are used to support your nutrition and progress
            calculations.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* HEIGHT + AGE */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="height-cm">Height (cm)</Label>
              <Input
                id="height-cm"
                className="h-11 rounded-xl"
                value={draft.heightCm ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  update("heightCm", v ? Number(v) : null);
                }}
              />
              <p className="text-xs leading-5 text-slate-500">
                Enter your height in centimetres.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age-years">Age (years)</Label>
              <Input
                id="age-years"
                className="h-11 rounded-xl"
                value={draft.age ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  update("age", v ? Number(v) : null);
                }}
              />
              <p className="text-xs leading-5 text-slate-500">
                Your current age in years.
              </p>
            </div>
          </div>

          {/* GENDER + GOAL */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={draft.gender ?? ""}
                onChange={(e) =>
                  update(
                    "gender",
                    e.target.value as "male" | "female" | "other",
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-background px-3 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs leading-5 text-slate-500">
                Used when calculating personalised daily needs.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Your goal</Label>
              <select
                id="goal"
                value={draft.goal ?? ""}
                onChange={(e) =>
                  update(
                    "goal",
                    e.target.value as "lose" | "maintain" | "gain",
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-background px-3 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="" disabled>
                  Select goal
                </option>
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain weight</option>
                <option value="gain">Gain weight</option>
              </select>
              <p className="text-xs leading-5 text-slate-500">
                This shapes your progress tracking and recommendations.
              </p>
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="space-y-2">
            <Label htmlFor="activity-level">Activity level</Label>
            <select
              id="activity-level"
              value={draft.activity ?? ""}
              onChange={(e) =>
                update("activity", e.target.value as ActivityLevel)
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-background px-3 text-sm shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select activity level</option>
              {activityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.hint}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-slate-500">
              Choose the level that best reflects your usual weekly activity.
            </p>
          </div>

          {/* SAVE */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
            <Button
              onClick={onSave}
              disabled={!valid || saving}
              size="lg"
            >
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save profile"}
            </Button>

            <p className="text-xs leading-5 text-slate-500">
              Your profile is securely saved to your account.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* NEXT STEP */}
      <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-slate-950">
            Keep your profile up to date
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            When your details change, update your profile so your dashboard,
            tracking and recommendations continue to reflect your current
            information.
          </p>
        </CardContent>
      </Card>
    </div>
  );

}