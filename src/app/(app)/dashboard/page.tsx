"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getProfileSnapshot } from "@/lib/profile/storage";
import { loadWeightEntries, summarize } from "@/lib/tracking/weight";

import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function bmiCategoryFromValue(bmi: number) {
  if (bmi < 18.5) return { key: "underweight", label: "Underweight" };
  if (bmi < 25) return { key: "normal", label: "Normal" };
  if (bmi < 30) return { key: "overweight", label: "Overweight" };
  if (bmi < 35) return { key: "obese1", label: "Obese Class I" };
  if (bmi < 40) return { key: "obese2", label: "Obese Class II" };
  return { key: "obese3", label: "Obese Class III" };
}

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
function fmtTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function DashboardPage() {
  // ── Data loading ────────────────────────────────────────
  const profile = useMemo(() => getProfileSnapshot(), []);
  const weightEntries = useMemo(() => loadWeightEntries(), []);
  const weightStats = useMemo(
    () => summarize(weightEntries),
    [weightEntries]
  );
  const bmiHistory = useMemo(() => loadBmiHistory(), []);
  const calHistory = useMemo(() => loadCaloriesHistory(), []);

  const latestBmi = bmiHistory[0] ?? null;
  const latestCalories = calHistory[0] ?? null;

  // ── Derived values ──────────────────────────────────────
  const bmiInfo = useMemo(() => {
    const heightCm = profile.heightCm;
    const latestWeight = weightStats?.last?.weightKg;

    if (!heightCm || !latestWeight) return null;

    const bmi = latestWeight / Math.pow(heightCm / 100, 2);
    const category = bmiCategoryFromValue(bmi);

    return {
      bmi: Number(bmi.toFixed(1)),
      category: category.label,
    };
  }, [profile.heightCm, weightStats?.last?.weightKg]);

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-slate-600">
            Your NutriCare overview — profile, tools, and progress at a glance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/profile">Update profile</Link>
          </Button>
          <Button asChild>
            <Link href="/tools/bmi">Calculate BMI</Link>
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-700">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Goal: {profile.goal}</Badge>
              <Badge variant="secondary">Activity: {profile.activity}</Badge>
              <Badge variant="secondary">Gender: {profile.gender}</Badge>
            </div>

            <div className="text-sm text-slate-600">
              Height:{" "}
              <span className="font-medium text-slate-800">
                {profile.heightCm ?? "—"}
              </span>{" "}
              cm • Age:{" "}
              <span className="font-medium text-slate-800">
                {profile.age ?? "—"}
              </span>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/profile">View profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* BMI Snapshot Card */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">BMI snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bmiInfo ? (
              <>
                <div className="text-3xl font-semibold">{bmiInfo.bmi}</div>
                <div className="text-sm text-slate-600">
                  {bmiInfo.category}
                </div>
                <p className="text-xs text-slate-500">
                  Based on latest weight entry + your saved height.
                </p>
              </>
            ) : (
              <p className="text-slate-600">
                Add a weight entry and set your height in Profile to see BMI
                here.
              </p>
            )}

            <div className="pt-2 flex gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/tools/tracking/weight">Add weight</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/tools/bmi">BMI tool</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weight Trend Card */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Weight trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weightStats ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Entries: {weightStats.count}</Badge>
                  <Badge variant="secondary">
                    Change: {weightStats.change > 0 ? "+" : ""}
                    {weightStats.change} kg
                  </Badge>
                </div>
                <div className="text-sm text-slate-600">
                  Latest:{" "}
                  <span className="font-medium text-slate-800">
                    {weightStats.last.weightKg} kg
                  </span>{" "}
                  on{" "}
                  <span className="font-medium text-slate-800">
                    {weightStats.last.date}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-slate-600">
                No weight data yet. Add your first entry.
              </p>
            )}

            <div className="pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/tools/tracking/weight">Open weight tracking</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent calculations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent BMI</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!latestBmi ? (
              <p className="text-slate-600">No BMI history yet.</p>
            ) : (
              <div className="rounded-2xl border p-4">
                <div className="font-semibold">BMI {latestBmi.bmi.toFixed(1)}</div>
                <div className="text-sm text-slate-600">
                  {fmtTime(latestBmi.createdAt)} • {latestBmi.heightCm}cm • {latestBmi.weightKg}kg
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Calories</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!latestCalories ? (
              <p className="text-slate-600">No calories history yet.</p>
            ) : (
              <div className="rounded-2xl border p-4">
                <div className="font-semibold">
                  Target {latestCalories.targetCalories} kcal • TDEE {latestCalories.tdee} • BMR {latestCalories.bmr}
                </div>
                <div className="text-sm text-slate-600">
                  {fmtTime(latestCalories.createdAt)} • {latestCalories.weightKg}kg • {latestCalories.heightCm}cm • {latestCalories.ageYears}y
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tools Section */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Tools</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <div className="font-semibold">BMI</div>
            <p className="mt-1 text-sm text-slate-600">
              Calculate BMI and understand category.
            </p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href="/tools/bmi">Open</Link>
            </Button>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="font-semibold">Calories</div>
            <p className="mt-1 text-sm text-slate-600">
              Estimate BMR/TDEE and daily target calories.
            </p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href="/tools/calories">Open</Link>
            </Button>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="font-semibold">Recommendations</div>
            <p className="mt-1 text-sm text-slate-600">
              Get a practical plan: priorities, macros, foods.
            </p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href="/tools/recommendations">Open</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="rounded-3xl border bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Next steps</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-700">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>
              Save your Profile (age, height, goal, activity) so tools can
              auto-fill.
            </li>
            <li>
              Add weight entries weekly to see trend and BMI snapshot.
            </li>
            <li>
              Next build: history + “export report” (donor/partner friendly).
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}