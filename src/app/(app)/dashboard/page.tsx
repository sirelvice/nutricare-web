"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  subscribeProfile,
  getProfileSnapshot,
  getProfileServerSnapshot,
} from "@/lib/profile/storage";

import { loadWeightEntries, summarize } from "@/lib/tracking/weight";
import { loadCaloriesHistory } from "@/lib/history/calories";
import { loadBmiHistory } from "@/lib/history/bmi";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatGoal(goal?: string) {
  if (!goal) return "";
  if (goal === "gain") return "gain weight";
  if (goal === "lose") return "lose weight";
  return goal;
}

export default function DashboardPage() {
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const weightEntries = useMemo(() => loadWeightEntries(), []);
  const weightStats = useMemo(() => summarize(weightEntries), [weightEntries]);

  const calHistory = useMemo(() => loadCaloriesHistory(), []);
  const latestCalories = calHistory[0] ?? null;

  // ✅ FIX: use BMI history instead of recalculating
  const bmiHistory = useMemo(() => loadBmiHistory(), []);
  const latestBMI = bmiHistory[0] ?? null;

  // state
  const hasProfile = profile.heightCm && profile.age;
  const hasWeight = !!weightStats?.last;
  const hasBMI = !!latestBMI;
  const hasCalories = !!latestCalories;

  const primaryAction = !hasProfile
    ? { label: "Add your details", href: "/profile" }
    : !hasWeight
      ? { label: "Log your first weight", href: "/tools/tracking/weight" }
      : !hasBMI
        ? { label: "Check your BMI", href: "/tools/bmi" }
        : !hasCalories
          ? { label: "Set your calories", href: "/tools/calories" }
          : null;

  const chartData = useMemo(() => {
    return weightEntries.slice(-7).map((w, i) => ({
      name: `${i + 1}`,
      weight: w.weightKg,
    }));
  }, [weightEntries]);

  return (
    <div className="space-y-12">

      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-br from-green-50 via-white to-green-50 p-6 border shadow-sm">
        <h1 className="text-2xl font-semibold">{getGreeting()}</h1>

        <p className="text-slate-600 mt-1">
          {hasProfile
            ? `Goal: ${formatGoal(profile.goal)}`
            : "Add your details to get started"}
        </p>

        {primaryAction && (
          <div className="mt-4">
            <Button asChild>
              <Link href={primaryAction.href}>
                {primaryAction.label}
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* INSIGHTS */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* BMI */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50 hover:shadow-md transition">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-slate-500">BMI</p>

            {latestBMI ? (
              <>
                <div className="text-4xl font-semibold">
                  {latestBMI.bmi}
                </div>
                <p className="text-sm text-slate-600">
                  {latestBMI.category}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">
                  No BMI yet
                </p>
                <Link href="/tools/bmi" className="text-sm text-green-600">
                  Calculate now →
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* WEIGHT */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50 hover:shadow-md transition">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Weight</p>

            {weightStats ? (
              <>
                <div className="text-4xl font-semibold">
                  {weightStats.last.weightKg} kg
                </div>

                <p className="text-sm text-slate-600">
                  {weightStats.change > 0
                    ? `Up ${weightStats.change} kg`
                    : `Down ${Math.abs(weightStats.change)} kg`}
                </p>

                <div className="h-20 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line
                        type="monotone"
                        dataKey="weight"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">
                  No weight entries
                </p>
                <Link
                  href="/tools/tracking/weight"
                  className="text-sm text-green-600"
                >
                  Add your first entry →
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* CALORIES */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50 hover:shadow-md transition">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-slate-500">Calories</p>

            {latestCalories ? (
              <>
                <div className="text-4xl font-semibold">
                  {latestCalories.targetCalories}
                </div>
                <p className="text-sm text-slate-600">
                  Daily target
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">
                  No target set
                </p>
                <Link
                  href="/tools/calories"
                  className="text-sm text-green-600"
                >
                  Set calories →
                </Link>
              </>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}