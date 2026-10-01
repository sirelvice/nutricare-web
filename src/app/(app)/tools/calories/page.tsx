"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { NutritionPlan } from "@/lib/nutrition-plan/domain";

type ApiResponse = {
  plan?: NutritionPlan | null;
  error?: string;
};

export default function CaloriesToolPage() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const response = await fetch("/api/nutrition-plan");
        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load nutrition plan.");
        }

        if (!cancelled) {
          setPlan(data.plan ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load nutrition plan.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  async function generatePlan() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/nutrition-plan", {
        method: "POST",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.plan) {
        throw new Error(
          data.error ?? "Unable to generate nutrition plan.",
        );
      }

      setPlan(data.plan);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate nutrition plan.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Nutrition tool
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Calories
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            View your current daily calorie target and macronutrient plan based
            on your profile and latest weight.
          </p>
        </div>

        <Button asChild variant="outline" className="shrink-0 bg-white">
          <a href="/history">View history</a>
        </Button>
      </section>

      {error && (
        <Card className="rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-red-900">
              We couldn&apos;t load your nutrition plan.
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-950">
                Current nutrition plan
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Your latest personalised daily target and macro breakdown.
              </p>
            </div>

            {plan && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white">
                  Goal: {plan.goal}
                </Badge>
                <Badge variant="secondary" className="bg-white">
                  Version {plan.version}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-7">
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-700">
                Loading your nutrition plan
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                We&apos;re retrieving your latest personalised target.
              </p>
            </div>
          ) : plan ? (
            <div className="space-y-7">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Daily calorie target
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    {plan.targetCalories}
                  </span>
                  <span className="pb-1 text-sm font-medium text-slate-600">
                    kcal/day
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use this as your current daily energy target.
                </p>
              </div>

              <div>
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-slate-950">
                    Macronutrient targets
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your daily protein, carbohydrate and fat targets.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Protein
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {plan.proteinG}g
                    </p>
                    <p className="mt-1 text-xs text-slate-500">per day</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Carbohydrates
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {plan.carbsG}g
                    </p>
                    <p className="mt-1 text-xs text-slate-500">per day</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fat
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {plan.fatG}g
                    </p>
                    <p className="mt-1 text-xs text-slate-500">per day</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Need an updated target?
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Recalculating creates a new plan version using your current
                    profile and latest weight.
                  </p>
                </div>

                <Button
                  onClick={generatePlan}
                  disabled={generating}
                  className="shrink-0"
                >
                  {generating ? "Updating plan..." : "Recalculate plan"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8">
              <p className="text-base font-semibold text-slate-950">
                No nutrition plan yet
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Complete your profile and log your current weight before
                generating a personalised nutrition plan.
              </p>

              <Button
                onClick={generatePlan}
                disabled={generating}
                className="mt-5"
              >
                {generating ? "Generating plan..." : "Generate nutrition plan"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
