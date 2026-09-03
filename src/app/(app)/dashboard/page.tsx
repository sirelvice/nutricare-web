"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { UserProfile } from "@/lib/profile/domain";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";


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

function formatProgressState(state: string, goal?: string) {
  if (state === "ON_TRACK") {
    return goal === "maintain"
      ? "Your weight is staying fairly steady"
      : "You're moving toward your goal";
  }

  if (state === "BEHIND_OPPOSITE") {
    return "Your recent weight change is moving away from your goal";
  }

  if (state === "PLATEAU") {
    return "Your weight has changed very little so far";
  }

  return "We need a little more history to understand your progress";
}

function formatWeightChange(changeKg: number) {
  if (changeKg === 0) return "Your logged weight stayed the same";

  const amount = Math.abs(changeKg).toFixed(1);
  const direction = changeKg > 0 ? "increased" : "decreased";

  return `Your logged weight ${direction} by ${amount}`;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [nutritionPlan, setNutritionPlan] =
    useState<NutritionPlan | null>(null);
  const [recommendations, setRecommendations] = useState<{
    bmi: number;
    category: { label: string; note: string };
    targetCalories: number;
    macros: {
      proteinG: number;
      carbsG: number;
      fatG: number;
    };
    recommendations: {
      summary: string;
      priorities: string[];
      foodsToFocus: string[];
      foodsToLimit: string[];
      nextSteps: string[];
    };
  } | null>(null);

  const [progressEvaluation, setProgressEvaluation] = useState<{
    state:
      | "ON_TRACK"
      | "BEHIND_OPPOSITE"
      | "PLATEAU"
      | "INSUFFICIENT_DATA";
    changeKg: number | null;
    entriesCount: number;
    evaluationDays: number | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [
          profileRes,
          weightRes,
          planRes,
          recommendationsRes,
          progressRes,
        ] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/weight-entries"),
          fetch("/api/nutrition-plan"),
          fetch("/api/recommendations"),
          fetch("/api/progress"),
        ]);

        if (cancelled) return;

        if (!profileRes.ok || !weightRes.ok || !planRes.ok) {
          throw new Error("Unable to load your dashboard data.");
        }

        setProfile(await profileRes.json());
        setWeightEntries(await weightRes.json());

        const data = await planRes.json();
        setNutritionPlan(data.plan);

        if (recommendationsRes.ok) {
          setRecommendations(await recommendationsRes.json());
        }

        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgressEvaluation(data.progress);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load dashboard:", error);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load your dashboard.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const latestWeight = useMemo(() => {
    if (weightEntries.length === 0) return null;

    return [...weightEntries].sort((a, b) =>
      a.date > b.date ? -1 : 1
    )[0];
  }, [weightEntries]);

  const hasProfile = !!(profile?.heightCm && profile?.age);
  const hasWeight = !!latestWeight;
  const hasCalories = !!nutritionPlan;

  const progress = [
    hasProfile,
    hasWeight,
    hasCalories,
  ].filter(Boolean).length;

  const progressPercent = Math.round((progress / 3) * 100);

  async function generateNutritionPlan() {
    setGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/nutrition-plan", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to generate nutrition plan.");
      }

      setNutritionPlan(data.plan);
    } catch (error) {
      console.error("Failed to generate nutrition plan:", error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Unable to generate nutrition plan.",
      );
    } finally {
      setGenerating(false);
    }
  }

  const primaryAction = !hasProfile
    ? { label: "Add your details", href: "/profile" }
    : !hasWeight
      ? { label: "Log your first weight", href: "/tools/tracking/weight" }
      : !hasCalories
        ? { label: "Generate your nutrition plan", href: null }
        : null;

  const chartData = [...weightEntries]
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-7)
    .map((w, i) => ({
      name: `${i + 1}`,
      weight: w.weightKg,
    }));

  const rec = recommendations?.recommendations ?? null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-500">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard unavailable</h1>
        <p className="text-sm text-slate-600">{loadError}</p>
        <Button onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-br from-green-50 via-white to-green-50 p-6 border shadow-sm">
        <h1 className="text-2xl font-semibold">{getGreeting()}</h1>

        <p className="text-slate-600 mt-1">
          {hasProfile
            ? `Goal: ${formatGoal(profile?.goal)}`
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

        {generationError && (
          <p className="mt-4 text-sm text-red-600">
            {generationError}
          </p>
        )}

        {primaryAction && (
          <div className="mt-4">
            {primaryAction.href ? (
              <Button asChild>
                <Link href={primaryAction.href}>
                  {primaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                onClick={generateNutritionPlan}
                disabled={generating}
              >
                {generating ? "Generating..." : primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* CORE */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* BMI */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">BMI</p>
            {recommendations ? (
              <>
                <div className="text-4xl font-semibold">
                  {recommendations.bmi.toFixed(1)}
                </div>
                <p className="text-sm text-slate-600">
                  {recommendations.category.label}
                </p>
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

            {latestWeight ? (
              <>
                <div className="text-4xl font-semibold">
                  {latestWeight.weightKg} kg
                </div>

                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line
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
              <Link
                href="/tools/tracking/weight"
                className="text-green-600 text-sm"
              >
                Add weight →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* CALORIES */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Calories</p>

            {nutritionPlan ? (
              <div className="text-4xl font-semibold">
                {nutritionPlan.targetCalories}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Generate your nutrition plan from your profile and current
                weight.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* PROGRESS */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Goal Progress</p>

            {progressEvaluation ? (
              <>
                <div className="text-2xl font-semibold">
                  {formatProgressState(
                    progressEvaluation.state,
                    profile?.goal,
                  )}
                </div>

                <p className="text-sm text-slate-600">
                  {progressEvaluation.state === "INSUFFICIENT_DATA"
                    ? "Keep logging your weight consistently. We’ll use a longer view to give you a more meaningful picture."
                    : progressEvaluation.changeKg === null ||
                        progressEvaluation.evaluationDays === null
                      ? "We don’t have enough information to describe the change yet."
                      : `${formatWeightChange(progressEvaluation.changeKg)} over ${progressEvaluation.evaluationDays} days.`}
                </p>

                {progressEvaluation.state === "PLATEAU" && (
                  <p className="text-xs text-slate-500">
                    Small changes are normal. Focus on consistent habits rather
                    than day-to-day fluctuations.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Keep logging your weight so we can understand how things are
                changing over time.
              </p>
            )}
          </CardContent>
        </Card>

        {/* MACROS */}
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Macros</p>

            {nutritionPlan ? (
              <div className="grid grid-cols-3 text-center">
                <div>
                  <div className="text-xl font-semibold">
                    {nutritionPlan.proteinG}g
                  </div>
                  <p className="text-xs text-slate-500">Protein</p>
                </div>

                <div>
                  <div className="text-xl font-semibold">
                    {nutritionPlan.carbsG}g
                  </div>
                  <p className="text-xs text-slate-500">Carbs</p>
                </div>

                <div>
                  <div className="text-xl font-semibold">
                    {nutritionPlan.fatG}g
                  </div>
                  <p className="text-xs text-slate-500">Fat</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Your macros will appear once your nutrition plan is generated.
              </p>
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
