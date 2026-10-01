"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { UserProfile } from "@/lib/profile/domain";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";
import {
  getAdjustmentResultMessage,
  getOptionalLoadMessage,
  getPrimaryAction,
  getSetupProgress,
} from "./dashboard-state";


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

function formatRecordedDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
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
    id: string;
    state:
      | "ON_TRACK"
      | "BEHIND_OPPOSITE"
      | "PLATEAU"
      | "INSUFFICIENT_DATA";
    changeKg: number | null;
    entriesCount: number;
    evaluationDays: number | null;
    headline: string;
    summary: string;
  } | null>(null);

  const [progressRecommendation, setProgressRecommendation] = useState<{
    recommendedAction:
      | "CONTINUE"
      | "REVIEW_ADHERENCE"
      | "CONSIDER_ADJUSTMENT"
      | "SUGGEST_PROFESSIONAL_CONSULT";
    reason:
      | "insufficient_data"
      | "on_track"
      | "first_problem"
      | "consecutive_problem"
      | "recurrence_after_adjustment";
    adjustmentDecision: "PENDING" | "ACCEPTED" | "DECLINED";
    respondedAt: string | null;
    message: string;
  } | null>(null);

  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progressLoadError, setProgressLoadError] = useState(false);
  const [recommendationsLoadError, setRecommendationsLoadError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
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
          setRecommendationsLoadError(false);
        } else {
          setRecommendations(null);
          setRecommendationsLoadError(true);
        }

        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgressEvaluation(data.progress.evaluation);
          setProgressRecommendation(data.progress.recommendation);
          setProgressLoadError(false);
        } else {
          setProgressEvaluation(null);
          setProgressRecommendation(null);
          setProgressLoadError(true);
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

  async function respondToAdjustment(
    decision: "ACCEPTED" | "DECLINED",
  ) {
    if (
      !progressEvaluation ||
      !progressRecommendation ||
      progressRecommendation.recommendedAction !== "CONSIDER_ADJUSTMENT" ||
      progressRecommendation.adjustmentDecision !== "PENDING"
    ) {
      return;
    }

    setAdjustmentSubmitting(true);
    setAdjustmentError(null);

    try {
      if (!progressEvaluation.id) {
        throw new Error("Current progress evaluation is unavailable.");
      }

      const response = await fetch("/api/progress/adjustment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluationId: progressEvaluation.id,
          decision,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || "Unable to record your adjustment decision.",
        );
      }

      const result = await response.json();

      setProgressRecommendation((current) =>
        current
          ? {
              ...current,
              adjustmentDecision: result.adjustmentDecision,
              respondedAt: result.respondedAt,
            }
          : current,
      );

      if (decision === "ACCEPTED" && result.plan) {
        setNutritionPlan(result.plan);
      }
    } catch (error) {
      setAdjustmentError(
        error instanceof Error
          ? error.message
          : "Unable to record your adjustment decision.",
      );
    } finally {
      setAdjustmentSubmitting(false);
    }
  }

  const latestWeight = useMemo(() => {
    if (weightEntries.length === 0) return null;

    return [...weightEntries].sort((a, b) =>
      a.date > b.date ? -1 : 1
    )[0];
  }, [weightEntries]);

  const hasProfile = !!(profile?.heightCm && profile?.age);
  const hasWeight = !!latestWeight;
  const hasCalories = !!nutritionPlan;

  const progressPercent = getSetupProgress({
    hasProfile,
    hasWeight,
    hasCalories,
  });

  async function generateNutritionPlan() {
    setGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);

    try {
      const response = await fetch("/api/nutrition-plan", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to generate nutrition plan.");
      }

      setNutritionPlan(data.plan);
      setGenerationSuccess(true);
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

  const primaryAction = getPrimaryAction({
    hasProfile,
    hasWeight,
    hasCalories,
  });

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
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
          <div className="h-2 max-w-xl animate-pulse rounded-full bg-slate-100" />
          <p className="text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="alert"
      >
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard unavailable
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {loadError}
            </p>
          </div>

          <Button onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-emerald-700">Your health workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{getGreeting()}</h1>

        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          {hasProfile
            ? `Goal: ${formatGoal(profile?.goal)}`
            : "Add your details to get started"}
        </p>

        <div className="mt-6 max-w-xl">
          <div className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200/70">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Setup {progressPercent}% complete
          </p>
        </div>

        {generationError && (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {generationError}
          </p>
        )}

        {generationSuccess && !generationError && (
          <p
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            role="status"
            aria-live="polite"
          >
            Your nutrition plan is ready.
          </p>
        )}

        {primaryAction && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Next step
            </p>
            {primaryAction.href ? (
              <Button asChild className="w-full sm:w-auto">
                <Link href={primaryAction.href}>
                  {primaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto"
                onClick={generateNutritionPlan}
                disabled={generating}
              >
                {generating ? "Generating..." : primaryAction.label}
              </Button>
            )}
          </div>
        )}
        </div>
      </section>

      {/* CORE */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* BMI */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">BMI</p>
            <p className="mt-1 text-xs text-slate-400">Current reading</p>

            {recommendationsLoadError ? (
              <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-600">
                BMI information is temporarily unavailable. Your other
                dashboard information is still available.
              </p>
            ) : recommendations ? (
              <div className="mt-6">
                <div className="text-4xl font-semibold tracking-tight text-slate-950">
                  {recommendations.bmi.toFixed(1)}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {recommendations.category.label}
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm leading-6 text-slate-500">
                  Calculate your BMI to see your current reading.
                </p>
                <Link
                  href="/tools/bmi"
                  className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                >
                  Calculate BMI →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WEIGHT */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Weight</p>
            <p className="mt-1 text-xs text-slate-400">Latest measurement</p>

            {latestWeight ? (
              <div className="mt-6">
                <div className="text-4xl font-semibold tracking-tight text-slate-950">
                  {latestWeight.weightKg} kg
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Recorded {formatRecordedDate(latestWeight.date)}
                </p>

                <div className="mt-4 h-20">
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

                <Link
                  href="/tools/tracking/weight"
                  className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                >
                  Log weight →
                </Link>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm leading-6 text-slate-500">
                  Start tracking your weight to see your progress here.
                </p>
                <Link
                  href="/tools/tracking/weight"
                  className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                >
                  Add weight →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CALORIES */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Calories</p>
            <p className="mt-1 text-xs text-slate-400">Daily target</p>

            {nutritionPlan ? (
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-slate-950">
                    {nutritionPlan.targetCalories.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    kcal/day
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your current recommended daily intake.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <p className="text-sm leading-6 text-slate-500">
                  Complete your profile and add your current weight to generate
                  your nutrition plan.
                </p>
                {hasProfile && hasWeight && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm text-emerald-700"
                    onClick={generateNutritionPlan}
                    disabled={generating}
                  >
                    {generating ? "Generating..." : "Generate nutrition plan →"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS */}
      <section aria-labelledby="insights-heading">
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-500">Your progress</p>
          <h2
            id="insights-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
          >
            Progress & insights
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            A clearer view of how your plan is working and what to focus on next.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* PROGRESS */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Goal progress
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    How your current plan is tracking
                  </p>
                </div>
              </div>

              {progressLoadError ? (
                <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-600">
                  {getOptionalLoadMessage("progress")}
                </p>
              ) : progressEvaluation ? (
                <div className="mt-6">
                  <div className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    {progressEvaluation.headline}
                  </div>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                    {progressEvaluation.summary}
                  </p>

                  {progressRecommendation && (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Recommendation
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {progressRecommendation.message}
                      </p>

                      {progressRecommendation.recommendedAction ===
                        "CONSIDER_ADJUSTMENT" &&
                        progressRecommendation.adjustmentDecision ===
                          "PENDING" && (
                          <div className="mt-4 space-y-2">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  respondToAdjustment("ACCEPTED")
                                }
                                disabled={adjustmentSubmitting}
                              >
                                {adjustmentSubmitting
                                  ? "Saving..."
                                  : "Use adjusted plan"}
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  respondToAdjustment("DECLINED")
                                }
                                disabled={adjustmentSubmitting}
                              >
                                Keep current plan
                              </Button>
                            </div>

                            {adjustmentError && (
                              <p role="alert" className="text-xs text-red-600">
                                {adjustmentError}
                              </p>
                            )}
                          </div>
                        )}

                      {progressRecommendation.recommendedAction ===
                        "CONSIDER_ADJUSTMENT" &&
                        progressRecommendation.adjustmentDecision !==
                          "PENDING" && (
                          <p
                            className={`mt-4 text-xs ${
                              progressRecommendation.adjustmentDecision ===
                              "ACCEPTED"
                                ? "text-emerald-700"
                                : "text-slate-500"
                            }`}
                            role="status"
                            aria-live="polite"
                          >
                            {progressRecommendation.adjustmentDecision ===
                            "ACCEPTED"
                              ? getAdjustmentResultMessage({
                                  decision: "ACCEPTED",
                                  nutritionPlan,
                                })
                              : getAdjustmentResultMessage({
                                  decision: "DECLINED",
                                  nutritionPlan,
                                })}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6">
                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                    Keep logging your weight so we can understand how things
                    are changing over time.
                  </p>
                  <Link
                    href="/tools/tracking/weight"
                    className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Log weight →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MACROS */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">Macros</p>
              <p className="mt-1 text-xs text-slate-400">Daily targets</p>

              {nutritionPlan ? (
                <div className="mt-6 grid grid-cols-3">
                  <div className="pr-3">
                    <div className="text-2xl font-semibold tracking-tight text-slate-950">
                      {nutritionPlan.proteinG}g
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Protein
                    </p>
                  </div>

                  <div className="border-x border-slate-200 px-3">
                    <div className="text-2xl font-semibold tracking-tight text-slate-950">
                      {nutritionPlan.carbsG}g
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Carbs
                    </p>
                  </div>

                  <div className="pl-3">
                    <div className="text-2xl font-semibold tracking-tight text-slate-950">
                      {nutritionPlan.fatG}g
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Fat
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-slate-500">
                  Your protein, carbs, and fat targets will appear once your
                  nutrition plan is generated.
                </p>
              )}
            </CardContent>
          </Card>

          {/* RECOMMENDATIONS */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">
                Recommendations
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Personalised guidance
              </p>

              {recommendationsLoadError ? (
                <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-600">
                  {getOptionalLoadMessage("recommendations")}
                </p>
              ) : rec ? (
                <div className="mt-6">
                  <p className="text-sm leading-6 text-slate-600 line-clamp-3">
                    {rec.summary}
                  </p>

                  <Link
                    href="/tools/recommendations"
                    className="mt-4 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                  >
                    View all recommendations →
                  </Link>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-sm leading-6 text-slate-500">
                    Complete your profile to get personalised recommendations.
                  </p>
                  <Link
                    href="/tools/recommendations"
                    className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                  >
                    View recommendations →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
