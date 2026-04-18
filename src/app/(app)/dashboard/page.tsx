"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { Card, CardContent } from "@/components/ui/card";
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

// Helpers
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

  // ─────────────────────────────
  // STATE LOGIC (this is key)
  // ─────────────────────────────
  const hasProfile = profile.heightCm && profile.age;
  const hasWeight = !!weightStats?.last;
  const hasBMI = !!bmiInfo;
  const hasCalories = !!latestCalories;

  const nextStep = !hasProfile
    ? "Complete your profile"
    : !hasWeight
    ? "Add your first weight entry"
    : !hasBMI
    ? "Calculate your BMI"
    : !hasCalories
    ? "Get your calorie target"
    : "You're on track — keep going";

  return (
    <div className="space-y-10">
      {/* ───────── HERO ───────── */}
      <div className="rounded-3xl bg-gradient-to-br from-green-50 to-white p-6 border">
        <h1 className="text-2xl font-semibold">
          {getGreeting()} 👋
        </h1>

        <p className="text-slate-600 mt-1">
          {hasProfile
            ? `Goal: ${profile.goal} • Activity: ${profile.activity}`
            : "Let’s get you set up — start by adding your profile details."}
        </p>

        <div className="mt-4">
          <Badge className="text-sm px-3 py-1 bg-green-100 text-green-700">
            Next step: {nextStep}
          </Badge>
        </div>

        <div className="mt-4 flex gap-3 flex-wrap">
          {!hasProfile && (
            <Button asChild>
              <Link href="/profile">Complete profile</Link>
            </Button>
          )}

          {hasProfile && !hasWeight && (
            <Button asChild>
              <Link href="/tools/tracking/weight">Add weight</Link>
            </Button>
          )}

          {hasWeight && !hasBMI && (
            <Button asChild>
              <Link href="/tools/bmi">Calculate BMI</Link>
            </Button>
          )}

          {hasBMI && !hasCalories && (
            <Button asChild>
              <Link href="/tools/calories">Get calories</Link>
            </Button>
          )}
        </div>
      </div>

      {/* ───────── INSIGHTS ───────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* BMI */}
        <Card className="rounded-3xl">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-slate-500">BMI</p>

            {bmiInfo ? (
              <>
                <div className="text-3xl font-bold">{bmiInfo.bmi}</div>
                <p className="text-sm text-slate-500">
                  {bmiInfo.category}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Not calculated yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weight */}
        <Card className="rounded-3xl">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-slate-500">Weight</p>

            {weightStats ? (
              <>
                <div className="text-3xl font-bold">
                  {weightStats.last.weightKg} kg
                </div>
                <p className="text-sm text-slate-500">
                  Change: {weightStats.change > 0 ? "+" : ""}
                  {weightStats.change} kg
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No entries yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Calories */}
        <Card className="rounded-3xl">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-slate-500">Calories</p>

            {latestCalories ? (
              <>
                <div className="text-3xl font-bold">
                  {latestCalories.targetCalories}
                </div>
                <p className="text-sm text-slate-500">
                  Daily target (kcal)
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Not set yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ───────── GUIDED ACTIONS ───────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your next steps</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="rounded-3xl p-5 flex justify-between items-center">
            <div>
              <p className="font-medium">Update your profile</p>
              <p className="text-sm text-slate-500">
                Keep your data accurate for better results
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/profile">Open</Link>
            </Button>
          </Card>

          <Card className="rounded-3xl p-5 flex justify-between items-center">
            <div>
              <p className="font-medium">Track your weight</p>
              <p className="text-sm text-slate-500">
                Monitor progress over time
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/tools/tracking/weight">Track</Link>
            </Button>
          </Card>

          <Card className="rounded-3xl p-5 flex justify-between items-center">
            <div>
              <p className="font-medium">Calculate BMI</p>
              <p className="text-sm text-slate-500">
                Understand your current health range
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/tools/bmi">Calculate</Link>
            </Button>
          </Card>

          <Card className="rounded-3xl p-5 flex justify-between items-center">
            <div>
              <p className="font-medium">Set calorie target</p>
              <p className="text-sm text-slate-500">
                Get your daily intake recommendation
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/tools/calories">Start</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}