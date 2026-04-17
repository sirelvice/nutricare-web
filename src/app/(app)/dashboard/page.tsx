"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  subscribeProfile,
  getProfileSnapshot,
  getProfileServerSnapshot,
} from "@/lib/profile/storage";

import { loadWeightEntries, summarize } from "@/lib/tracking/weight";
import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const weightEntries = useMemo(() => loadWeightEntries(), []);
  const weightStats = useMemo(() => summarize(weightEntries), [weightEntries]);

  const bmiHistory = useMemo(() => loadBmiHistory(), []);
  const calHistory = useMemo(() => loadCaloriesHistory(), []);

  const latestBmi = bmiHistory[0] ?? null;
  const latestCalories = calHistory[0] ?? null;

  const bmiInfo = useMemo(() => {
    if (!profile.heightCm || !weightStats?.last?.weightKg) return null;

    const bmi =
      weightStats.last.weightKg / Math.pow(profile.heightCm / 100, 2);

    let category = "Unknown";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";

    return {
      bmi: Number(bmi.toFixed(1)),
      category,
    };
  }, [profile.heightCm, weightStats?.last?.weightKg]);

  return (
    <div className="space-y-10">
      {/* ───────── HEADER ───────── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-slate-600">
            Your health overview — track progress, review activity, and take action.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button asChild size="sm">
            <Link href="/tools/bmi">Calculate BMI</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/tools/calories">Calories</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">Profile</Link>
          </Button>
        </div>
      </div>

      {/* ───────── OVERVIEW (TOP PRIORITY) ───────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Overview</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* BMI */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>BMI</CardTitle>
            </CardHeader>
            <CardContent>
              {bmiInfo ? (
                <>
                  <div className="text-3xl font-bold">{bmiInfo.bmi}</div>
                  <div className="text-sm text-slate-500">
                    {bmiInfo.category}
                  </div>
                </>
              ) : (
                <p className="text-slate-600 text-sm">
                  Add weight + height to see BMI.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weight */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {weightStats ? (
                <>
                  <div className="text-sm">
                    Latest:{" "}
                    <b>{weightStats.last.weightKg} kg</b>
                  </div>
                  <div className="text-sm text-slate-500">
                    Change: {weightStats.change > 0 ? "+" : ""}
                    {weightStats.change} kg
                  </div>
                </>
              ) : (
                <p className="text-slate-600 text-sm">
                  No data yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ───────── PROFILE CONTEXT ───────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Profile</h2>

        <Card className="rounded-3xl">
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge>Goal: {profile.goal}</Badge>
              <Badge>Activity: {profile.activity}</Badge>
              <Badge>Gender: {profile.gender}</Badge>
            </div>

            <div className="text-sm text-slate-600">
              Height: {profile.heightCm ?? "—"} cm • Age: {profile.age ?? "—"}
            </div>

            <Button asChild variant="outline">
              <Link href="/profile">Update Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ───────── ACTIVITY ───────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* BMI history */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Recent BMI</CardTitle>
            </CardHeader>
            <CardContent>
              {!latestBmi ? (
                <p className="text-slate-600 text-sm">
                  No BMI history yet.
                </p>
              ) : (
                <>
                  <div className="font-semibold">
                    BMI {latestBmi.bmi.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {fmtTime(latestBmi.createdAt)}
                  </div>
                </>
              )}

              <Button asChild variant="link" className="p-0 mt-2">
                <Link href="/history/bmi">View history →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Calories */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Recent Calories</CardTitle>
            </CardHeader>
            <CardContent>
              {!latestCalories ? (
                <p className="text-slate-600 text-sm">
                  No calorie data yet.
                </p>
              ) : (
                <>
                  <div className="font-semibold">
                    {latestCalories.targetCalories} kcal target
                  </div>
                  <div className="text-sm text-slate-500">
                    {fmtTime(latestCalories.createdAt)}
                  </div>
                </>
              )}

              <Button asChild variant="link" className="p-0 mt-2">
                <Link href="/history/calories">View history →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ───────── ACTIONS ───────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Take Action</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <Button asChild variant="outline">
            <Link href="/tools/bmi">BMI Calculator</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/tools/calories">Calories Tool</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/tools/macros">Macros</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/tools/recommendations">Recommendations</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/tools/tracking/weight">Track Weight</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}