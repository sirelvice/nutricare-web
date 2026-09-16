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
    <div className="space-y-8">
      {/* HERO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{getGreeting()}</h1>

        <p className="mt-2 text-sm text-slate-600">
          {hasProfile
            ? `Goal: ${formatGoal(profile?.goal)}`
            : "Add your details to get started"}
        </p>

        <div className="mt-5 max-w-xl">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Setup {progressPercent}% complete
          </p>
        </div>

        {generationError && (
          <p
            className="mt-4 text-sm text-red-600"
            role="alert"
          >
            {generationError}
          </p>
        )}

        {generationSuccess && !generationError && (
          <p
            className="mt-4 text-sm text-emerald-700"
            role="status"
            aria-live="polite"
          >
            Your nutrition plan is ready.
          </p>
        )}

        {primaryAction && (
          <div className="mt-5">
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

      {/* CORE */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* BMI */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              <Link href="/tools/bmi" className="text-emerald-700 text-sm hover:underline">
                Calculate BMI →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* WEIGHT */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Weight</p>

            {latestWeight ? (
              <>
                <div className="text-4xl font-semibold">
                  {latestWeight.weightKg} kg
                </div>
                <p className="text-sm text-slate-500">
                  Recorded {formatRecordedDate(latestWeight.date)}
                </p>

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

                <Link
                  href="/tools/tracking/weight"
                  className="text-emerald-700 text-sm hover:underline"
                >
                  Log weight →
                </Link>
              </>
            ) : (
              <Link
                href="/tools/tracking/weight"
                className="text-emerald-700 text-sm hover:underline"
              >
                Add weight →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* CALORIES */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Calories</p>

            {nutritionPlan ? (
              <div>
                <div className="text-4xl font-semibold">
                  {nutritionPlan.targetCalories.toLocaleString()}
                </div>
                <p className="text-sm text-slate-500">kcal/day</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Complete your profile and add your current weight to generate
                your nutrition plan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS */}
      <section aria-labelledby="insights-heading">
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-500">Your progress</p>
          <h2
            id="insights-heading"
            className="text-xl font-semibold tracking-tight text-slate-900"
          >
            Progress & insights
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
        {/* PROGRESS */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Goal Progress</p>

            {progressLoadError ? (
              <p className="text-sm text-slate-600">
                {getOptionalLoadMessage("progress")}
              </p>
            ) : progressEvaluation ? (
              <>
                <div className="text-3xl font-semibold tracking-tight text-slate-900">
                  {progressEvaluation.headline}
                </div>

                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  {progressEvaluation.summary}
                </p>

                {progressRecommendation && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Recommendation
                    </p>

                    <p className="text-sm text-slate-700 mt-1">
                      {progressRecommendation.message}
                    </p>

                    {progressRecommendation.recommendedAction ===
                      "CONSIDER_ADJUSTMENT" &&
                      progressRecommendation.adjustmentDecision ===
                        "PENDING" && (
                        <div className="mt-3 space-y-2">
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
                                : "Accept"}
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
                              Decline
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
                          className={`mt-3 text-xs ${
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

              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  Keep logging your weight so we can understand how things are
                  changing over time.
                </p>
                <Link
                  href="/tools/tracking/weight"
                  className="text-emerald-700 text-sm hover:underline"
                >
                  Log weight →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MACROS */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-1">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Macros</p>

            {nutritionPlan ? (
              <div className="grid grid-cols-3 text-center">
                <div className="pr-3">
                  <div className="text-xl font-semibold">
                    {nutritionPlan.proteinG}g
                  </div>
                  <p className="text-xs text-slate-500">Protein</p>
                </div>

                <div className="border-x border-slate-200 px-3">
                  <div className="text-xl font-semibold">
                    {nutritionPlan.carbsG}g
                  </div>
                  <p className="text-xs text-slate-500">Carbs</p>
                </div>

                <div className="pl-3">
                  <div className="text-xl font-semibold">
                    {nutritionPlan.fatG}g
                  </div>
                  <p className="text-xs text-slate-500">Fat</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Your protein, carbs, and fat targets will appear once your
                nutrition plan is generated.
              </p>
            )}
          </CardContent>
        </Card>

        {/* RECOMMENDATIONS */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-1">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-500">Recommendations</p>

            {recommendationsLoadError ? (
              <p className="text-sm text-slate-600">
                {getOptionalLoadMessage("recommendations")}
              </p>
            ) : rec ? (
              <>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {rec.summary}
                </p>

                <Link
                  href="/tools/recommendations"
                  className="text-emerald-700 text-sm hover:underline"
                >
                  View all recommendations →
                </Link>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  Complete your profile to get personalized recommendations.
                </p>
                <Link
                  href="/tools/recommendations"
                  className="text-emerald-700 text-sm hover:underline"
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
