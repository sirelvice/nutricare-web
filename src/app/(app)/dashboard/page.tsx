"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { ArrowRight, ArrowUpRight, CircleCheck, Scale, Utensils } from "lucide-react";
import { CardExplanation } from "@/components/ui/card-explanation";
import { ProgressStatus } from "@/components/progress/ProgressStatus";
import { useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  loadDashboardCore,
  loadDashboardProgress,
  loadDashboardRecommendations,
} from "./dashboard-loader";

import type { UserProfile } from "@/lib/profile/domain";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";
import {
  getAdjustmentResultMessage,
  getOptionalLoadMessage,
  getPrimaryAction,
  getSetupProgress,
} from "./dashboard-state";


const WeightHistoryChart = dynamic(() => import("./WeightHistoryChart"), {
  ssr: false,
  loading: () => <div role="status" className="flex h-40 items-center text-sm text-muted-foreground">Loading weight chart...</div>,
});

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
  return goal === "maintain" ? "maintain your weight" : goal;
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
  const { data: session } = useSession();
  const displayName = session?.user?.name?.trim().split(/\s+/)[0];
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
  const [adjustmentSuccess, setAdjustmentSuccess] = useState<string | null>(null);
  const insightsController = useRef<AbortController | null>(null);
  const [insightsRevision, setInsightsRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progressLoadError, setProgressLoadError] = useState(false);
  const [recommendationsLoadError, setRecommendationsLoadError] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setLoadError(null);

    async function loadCore() {
      try {
        const data = await loadDashboardCore(signal);
        if (signal.aborted) return;
        setProfile(data.profile);
        setWeightEntries(data.weightEntries);
        setNutritionPlan(data.nutritionPlan);
        setLoading(false);
      } catch {
        if (signal.aborted) return;
        setLoadError("Unable to load your dashboard data.");
        setLoading(false);
        controller.abort();
        insightsController.current?.abort();
      }
    }

    void loadCore();
    return () => controller.abort();
  }, [retryAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    insightsController.current = controller;
    setRecommendationsLoading(true);
    setProgressLoading(true);
    setRecommendations(null);
    setProgressEvaluation(null);
    setProgressRecommendation(null);
    setRecommendationsLoadError(false);
    setProgressLoadError(false);

    async function loadRecommendations() {
      try {
        const result = await loadDashboardRecommendations(signal);
        if (signal.aborted) return;
        setRecommendations(result.status === "ready" ? result.data : null);
        setRecommendationsLoadError(result.status === "error");
        setRecommendationsLoading(false);
      } catch {
        if (signal.aborted) return;
        setRecommendationsLoadError(true);
        setRecommendationsLoading(false);
      }
    }

    async function loadProgress() {
      try {
        const result = await loadDashboardProgress(signal);
        if (signal.aborted) return;
        setProgressEvaluation(result.status === "ready" ? result.data.evaluation : null);
        setProgressRecommendation(result.status === "ready" ? result.data.recommendation : null);
        setProgressLoadError(result.status === "error");
        setProgressLoading(false);
      } catch {
        if (signal.aborted) return;
        setProgressLoadError(true);
        setProgressLoading(false);
      }
    }

    void loadRecommendations();
    void loadProgress();
    return () => controller.abort();
  }, [retryAttempt, insightsRevision]);

  function refreshInsights() {
    // Stop older responses before scheduling the refreshed reads.
    insightsController.current?.abort();
    setRecommendations(null);
    setProgressEvaluation(null);
    setProgressRecommendation(null);
    setRecommendationsLoading(true);
    setProgressLoading(true);
    setInsightsRevision((revision) => revision + 1);
  }

  async function respondToAdjustment(
    decision: "ACCEPTED" | "DECLINED",
  ) {
    if (
      adjustmentSubmitting ||
      !progressEvaluation ||
      !progressRecommendation ||
      progressRecommendation.recommendedAction !== "CONSIDER_ADJUSTMENT" ||
      progressRecommendation.adjustmentDecision !== "PENDING"
    ) {
      return;
    }

    setAdjustmentSubmitting(true);
    setAdjustmentError(null);
    setAdjustmentSuccess(null);

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

      setAdjustmentSuccess(getAdjustmentResultMessage({
        decision,
        nutritionPlan: result.plan ?? nutritionPlan,
      }));
      if (decision === "ACCEPTED" && result.plan) {
        setNutritionPlan(result.plan);
        refreshInsights();
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
  const showDetailedDashboard = hasProfile || hasWeight || hasCalories ||
    !!recommendations || !!progressEvaluation || recommendationsLoadError || progressLoadError;

  const progressPercent = getSetupProgress({
    hasProfile,
    hasWeight,
    hasCalories,
  });

  async function generateNutritionPlan() {
    if (generating) return;
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
      refreshInsights();
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

  const nextAction = primaryAction ?? {
    label: "Log your weight", href: "/tools/tracking/weight",
  };
  const recentWeights = useMemo(() => [...weightEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7), [weightEntries]);

  const rec = recommendations?.recommendations ?? null;

  if (loading) {
    return (
      <div role="status" aria-busy="true" className="space-y-6">
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
          <div className="h-44 rounded-2xl border bg-card" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 rounded-2xl border bg-card" />
            <div className="h-64 rounded-2xl border bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="shadow-none">
        <CardContent className="space-y-4" role="alert">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard unavailable</h1>
          <p className="text-sm leading-6 text-muted-foreground">{loadError}</p>
          <Button size="lg" onClick={() => setRetryAttempt((attempt) => attempt + 1)}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Your health workspace</p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{getGreeting()}{displayName ? `, ${displayName}` : ""}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {hasProfile ? `Your goal is to ${formatGoal(profile?.goal)}.` : "Add your details to get started"}
          </p>
        </div>
        <Button asChild variant="ghost" size="lg" className="self-start sm:self-auto">
          <Link href="/profile">Your profile <ArrowUpRight aria-hidden="true" /></Link>
        </Button>
      </header>

      <section aria-labelledby="next-step-heading" className={`relative overflow-hidden rounded-2xl border border-primary/20 bg-card ${primaryAction ? "p-6 sm:p-8" : "p-5 sm:p-6"}`}>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Your next step</p>
            <h2 id="next-step-heading" className={`mt-2 font-semibold tracking-tight ${primaryAction ? "text-2xl" : "text-xl"}`}>
              {primaryAction ? "Build your starting point" : "Record your weight"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {primaryAction
                ? "A few details help us tailor your nutrition plan. Start here, then build a routine that works for you."
                : "Record your weight when you are ready. Consistent measurements help put changes in context."}
            </p>
          </div>
          {nextAction.href ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={nextAction.href}>{nextAction.label}<ArrowRight aria-hidden="true" /></Link>
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={generateNutritionPlan} disabled={generating}>
              {generating ? "Generating..." : nextAction.label}
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
        {primaryAction ? <div className="mt-6 border-t border-primary/15 pt-5">
          <div className="flex items-center justify-between gap-4 text-xs">
            <p className="font-medium">Setup {progressPercent}% complete</p>
          </div>
          <div role="progressbar" aria-label="Account setup" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={progressPercent} className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary motion-safe:transition-[width]" style={{ width: `${progressPercent}%` }} />
          </div>
          <ol className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
            {[
              { label: "Profile details", complete: hasProfile },
              { label: "First measurement", complete: hasWeight },
              { label: "Nutrition plan", complete: hasCalories },
            ].map((step, index) => (
              <li key={step.label} className="flex items-center gap-2">
                {step.complete ? <CircleCheck className="size-4 text-primary" aria-hidden="true" />
                  : <span aria-hidden="true" className="flex size-4 items-center justify-center rounded-full border border-primary/30 text-primary">{index + 1}</span>}
                <span className={step.complete ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
                <span className="sr-only">{step.complete ? ": complete" : ": remaining"}</span>
              </li>
            ))}
          </ol>
        </div> : <p className="mt-4 text-xs text-muted-foreground">Setup 100% complete</p>}
        {generationError && <p role="alert" className="mt-5 text-sm text-destructive">{generationError}</p>}
        {generationSuccess && !generationError && <p role="status" className="mt-5 text-sm text-primary">Your nutrition plan is ready.</p>}
      </section>

      {showDetailedDashboard ? <>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="progress-heading">
          <Card className="shadow-none">
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="progress-heading" className="text-lg font-semibold tracking-tight">Goal progress</h2>
                {!progressLoading && !progressLoadError && progressEvaluation && <ProgressStatus state={progressEvaluation.state} />}
              </div>
              {progressLoading ? (
                <p role="status" className="mt-6 text-sm text-muted-foreground">Loading progress...</p>
              ) : progressLoadError ? (
                <p role="status" className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6">{getOptionalLoadMessage("progress")}</p>
              ) : progressEvaluation ? (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold tracking-tight">{progressEvaluation.headline}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{progressEvaluation.summary}</p>
                  {progressRecommendation && (
                    <div className="mt-5 rounded-xl bg-muted/60 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recommendation</p>
                      <p className="mt-2 text-sm leading-6">{progressRecommendation.message}</p>
                      {progressRecommendation.recommendedAction === "CONSIDER_ADJUSTMENT" && progressRecommendation.adjustmentDecision === "PENDING" && (
                        <div className="mt-4 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button size="lg" onClick={() => respondToAdjustment("ACCEPTED")} disabled={adjustmentSubmitting}>
                              {adjustmentSubmitting ? "Saving..." : "Use adjusted plan"}
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => respondToAdjustment("DECLINED")} disabled={adjustmentSubmitting}>Keep current plan</Button>
                          </div>
                          {adjustmentError && <p role="alert" className="text-sm text-destructive">{adjustmentError}</p>}
                        </div>
                      )}
                      {!adjustmentSuccess && progressRecommendation.recommendedAction === "CONSIDER_ADJUSTMENT" && progressRecommendation.adjustmentDecision !== "PENDING" && (
                        <p role="status" className="mt-4 text-sm text-primary">
                          {getAdjustmentResultMessage({ decision: progressRecommendation.adjustmentDecision, nutritionPlan })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-sm leading-6 text-muted-foreground">Keep logging your weight so we can understand how things are changing over time.</p>
                  <Button asChild variant="outline" size="lg" className="mt-5"><Link href="/tools/tracking/weight">Log weight <ArrowUpRight aria-hidden="true" /></Link></Button>
                </div>
              )}
              {adjustmentSuccess && <p role="status" className="mt-5 text-sm leading-6 text-primary">{adjustmentSuccess}</p>}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="weight-heading" className="min-w-0">
          <Card className="shadow-none">
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <h2 id="weight-heading" className="text-lg font-semibold tracking-tight">Weight snapshot</h2>
                <Scale className="size-5 text-primary" aria-hidden="true" />
              </div>
              {latestWeight ? (
                <figure className="mt-5">
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">{latestWeight.weightKg} <span className="text-base font-normal text-muted-foreground">kg</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">Recorded {formatRecordedDate(latestWeight.date)}</p>
                  <div className="mt-5"><WeightHistoryChart entries={recentWeights} /></div>
                  <figcaption className="mt-3 text-xs leading-5 text-muted-foreground">
                    Your latest {recentWeights.length} {recentWeights.length === 1 ? "measurement" : "measurements"}. Progress is interpreted against your plan, not this chart alone.
                  </figcaption>
                  <details className="mt-4 rounded-xl border">
                    <summary className="min-h-11 cursor-pointer rounded-xl px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View measurement data</summary>
                    <div className="px-4 pb-4">
                      <table className="w-full text-left text-sm tabular-nums">
                        <caption className="sr-only">Recent weight measurements</caption>
                        <thead><tr className="border-b"><th scope="col" className="py-2 font-medium">Date</th><th scope="col" className="py-2 text-right font-medium">Weight (kg)</th></tr></thead>
                        <tbody>{recentWeights.map((entry) => <tr key={entry.id} className="border-b last:border-0"><th scope="row" className="py-2 font-normal text-muted-foreground">{formatRecordedDate(entry.date)}</th><td className="py-2 text-right">{entry.weightKg}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </details>
                </figure>
              ) : <p className="mt-6 text-sm leading-6 text-muted-foreground">Your first measurement gives you a starting point. Your weight history will appear here.</p>}
              <Button asChild variant="ghost" size="lg" className="mt-4"><Link href="/tools/tracking/weight">Weight history <ArrowUpRight aria-hidden="true" /></Link></Button>
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="targets-heading">
        <div className="mb-4 flex items-center gap-2"><Utensils className="size-5 text-primary" aria-hidden="true" /><h2 id="targets-heading" className="text-lg font-semibold tracking-tight">Your daily targets</h2></div>
        <Card className="shadow-none">
          <CardContent>
            {nutritionPlan ? (
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                {[
                  { label: "Calories", value: nutritionPlan.targetCalories, unit: "kcal" },
                  { label: "Protein", value: nutritionPlan.proteinG, unit: "g" },
                  { label: "Carbs", value: nutritionPlan.carbsG, unit: "g" },
                  { label: "Fat", value: nutritionPlan.fatG, unit: "g" },
                ].map((target) => (
                  <div key={target.label} className="min-w-0">
                    <p className="text-sm text-muted-foreground">{target.label}</p>
                    <p className="mt-2 flex flex-wrap items-baseline gap-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{target.value}<span className="text-sm font-normal text-muted-foreground">{target.unit}</span></p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm leading-6 text-muted-foreground">Your daily calorie and macro targets will appear once your nutrition plan is generated.</p>}
            {nutritionPlan && <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">Current plan: version {nutritionPlan.version}. These are targets, not a record of what you have eaten.</p>}
            {nutritionPlan && <CardExplanation label="How these targets are calculated" className="mt-4">
              <p>Your plan uses profile details and recorded weight to estimate daily calorie and macro targets.</p>
              <Link href="/tools/calories" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">Review or recalculate your plan</Link>
            </CardExplanation>}
          </CardContent>
        </Card>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section aria-labelledby="guidance-heading" className="lg:col-span-2">
          <Card className="shadow-none">
            <CardContent>
              <h2 id="guidance-heading" className="text-lg font-semibold tracking-tight">Personalised guidance</h2>
              {recommendationsLoading ? <p role="status" className="mt-5 text-sm text-muted-foreground">Loading recommendations...</p>
                : recommendationsLoadError ? <p role="status" className="mt-5 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6">{getOptionalLoadMessage("recommendations")}</p>
                : rec ? <p className="mt-5 text-sm leading-7 text-muted-foreground">{rec.summary}</p>
                : <p className="mt-5 text-sm leading-6 text-muted-foreground">Complete your profile to get personalised recommendations.</p>}
              <Button asChild variant="outline" size="lg" className="mt-5"><Link href="/tools/recommendations">View recommendations <ArrowUpRight aria-hidden="true" /></Link></Button>
            </CardContent>
          </Card>
        </section>
        <section aria-labelledby="bmi-heading">
          <Card className="shadow-none">
            <CardContent>
              <h2 id="bmi-heading" className="text-lg font-semibold tracking-tight">BMI context</h2>
              {recommendationsLoading ? <p role="status" className="mt-5 text-sm text-muted-foreground">Loading BMI information...</p>
                : recommendationsLoadError ? <p className="mt-5 text-sm leading-6 text-muted-foreground">BMI information is temporarily unavailable. Your other dashboard information is still available.</p>
                : recommendations ? <div className="mt-5"><p className="text-3xl font-semibold tabular-nums">{recommendations.bmi.toFixed(1)}</p><p className="mt-2 text-sm text-muted-foreground">{recommendations.category.label}</p></div>
                : <p className="mt-5 text-sm leading-6 text-muted-foreground">Calculate your BMI to see your current reading.</p>}
              <p className="mt-4 text-xs leading-5 text-muted-foreground">BMI is a screening measure, not a diagnosis. It does not capture all health factors.</p>
              <Button asChild variant="ghost" size="lg" className="mt-3"><Link href="/tools/bmi">BMI calculator <ArrowUpRight aria-hidden="true" /></Link></Button>
            </CardContent>
          </Card>
        </section>
      </div>
      </> : (
        <section aria-label="Getting started" className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Complete your profile to get personalised recommendations.</p>
          <p>Your weight history and daily targets will appear as you complete setup.</p>
          {recommendationsLoading && <p role="status">Loading recommendations...</p>}
          {progressLoading && <p role="status">Loading progress...</p>}
        </section>
      )}
    </div>
  );
}
