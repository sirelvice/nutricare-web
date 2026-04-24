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

import { buildRecommendations } from "@/lib/reco/engine";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatGoal(goal?: string) {
  if (!goal) return "";
  if (goal === "gain") return "gain weight";
  if (goal === "lose") return "lose weight";
  return goal;
}

function macrosFromCalories(target: number, goal: string) {
  const proteinPct = goal === "lose" ? 0.3 : 0.25;
  const fatPct = 0.25;
  const carbsPct = 1 - proteinPct - fatPct;

  return {
    protein: Math.round((target * proteinPct) / 4),
    fat: Math.round((target * fatPct) / 9),
    carbs: Math.round((target * carbsPct) / 4),
  };
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

  const bmiHistory = useMemo(() => loadBmiHistory(), []);
  const latestBMI = bmiHistory[0] ?? null;

  const hasProfile = !!(profile.heightCm && profile.age);
  const hasWeight = !!weightStats?.last;
  const hasBMI = !!latestBMI;
  const hasCalories = !!latestCalories;

  const progress = [hasProfile, hasWeight, hasBMI, hasCalories].filter(Boolean).length;
  const progressPercent = Math.round((progress / 4) * 100);

  const primaryAction = !hasProfile
    ? { label: "Add your details", href: "/profile" }
    : !hasWeight
    ? { label: "Log your first weight", href: "/tools/tracking/weight" }
    : !hasBMI
    ? { label: "Check your BMI", href: "/tools/bmi" }
    : !hasCalories
    ? { label: "Set your calories", href: "/tools/calories" }
    : null;

  const chartData = weightEntries.slice(-7).map((w, i) => ({
    name: `${i + 1}`,
    weight: w.weightKg,
  }));

  // 🥗 Macros
  const macros =
    latestCalories && profile.goal
      ? macrosFromCalories(latestCalories.targetCalories, profile.goal)
      : null;

  // 🧠 Recommendations
  const rec =
    latestBMI && profile.goal && latestCalories
      ? buildRecommendations({
          bmi: latestBMI.bmi,
          category: latestBMI.category,
          goal: profile.goal,
          targetCalories: latestCalories.targetCalories,
        })
      : null;

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

        <div className="mt-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Setup progress: {progressPercent}%
          </p>
        </div>

        {primaryAction && (
          <div className="mt-4">
            <Button asChild>
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
          </div>
        )}
      </div>

      {/* CORE */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* BMI */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">BMI</p>
            {latestBMI ? (
              <>
                <div className="text-4xl font-semibold">{latestBMI.bmi}</div>
                <p className="text-sm text-slate-600">{latestBMI.category}</p>
              </>
            ) : (
              <Link href="/tools/bmi" className="text-green-600 text-sm">
                Calculate →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* WEIGHT */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Weight</p>

            {weightStats ? (
              <>
                <div className="text-4xl font-semibold">
                  {weightStats.last.weightKg} kg
                </div>

                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line dataKey="weight" strokeWidth={2} dot={false} />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <Link href="/tools/tracking/weight" className="text-green-600 text-sm">
                Add weight →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* CALORIES */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Calories</p>
            {latestCalories ? (
              <div className="text-4xl font-semibold">
                {latestCalories.targetCalories}
              </div>
            ) : (
              <Link href="/tools/calories" className="text-green-600 text-sm">
                Set →
              </Link>
            )}
          </CardContent>
        </Card>

      </div>

      {/* INSIGHTS */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* MACROS */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Macros</p>

            {macros ? (
              <div className="grid grid-cols-3 text-center">
                <div>
                  <div className="text-xl font-semibold">{macros.protein}g</div>
                  <p className="text-xs text-slate-500">Protein</p>
                </div>
                <div>
                  <div className="text-xl font-semibold">{macros.carbs}g</div>
                  <p className="text-xs text-slate-500">Carbs</p>
                </div>
                <div>
                  <div className="text-xl font-semibold">{macros.fat}g</div>
                  <p className="text-xs text-slate-500">Fat</p>
                </div>
              </div>
            ) : (
              <Link href="/tools/calories" className="text-green-600 text-sm">
                Calculate macros →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* RECOMMENDATIONS */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Recommendations</p>

            {rec ? (
              <>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {rec.summary}
                </p>

                <Link
                  href="/tools/recommendations"
                  className="text-green-600 text-sm"
                >
                  View full →
                </Link>
              </>
            ) : (
              <Link href="/tools/bmi" className="text-green-600 text-sm">
                Generate →
              </Link>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}