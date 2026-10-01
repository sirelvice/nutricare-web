"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { calcBMIKgM, bmiCategoryWHO } from "@/lib/calc/bmi";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";
import type { UserProfile } from "@/lib/profile/domain";

type Tab = "weight" | "plans";

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("weight");

  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const [weightsResponse, plansResponse, profileResponse] =
          await Promise.all([
            fetch("/api/weight-entries"),
            fetch("/api/nutrition-plan/history"),
            fetch("/api/profile"),
          ]);

        if (!weightsResponse.ok || !plansResponse.ok || !profileResponse.ok) {
          throw new Error("Unable to load history.");
        }

        const [weightData, planData, profileData] = await Promise.all([
          weightsResponse.json(),
          plansResponse.json(),
          profileResponse.json(),
        ]);

        setWeights(weightData as WeightEntry[]);
        setPlans((planData.plans ?? []) as NutritionPlan[]);
        setProfile(profileData as UserProfile | null);
      } catch {
        setError("Unable to load your history.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const latestWeight = weights[0] ?? null;
  const latestPlan = plans[0] ?? null;

  const latestBmi = useMemo(() => {
    if (!latestWeight || profile?.heightCm === null || !profile?.heightCm) {
      return null;
    }

    const bmi = calcBMIKgM(latestWeight.weightKg, profile.heightCm);

    if (bmi === null) return null;

    return {
      bmi,
      category: bmiCategoryWHO(bmi),
    };
  }, [latestWeight, profile]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Your records
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            History
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Review your recorded weight and nutrition plan versions over time.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Loading your history...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 sm:w-fit sm:flex-row"
        aria-label="History sections"
      >
        <Button
          variant={tab === "weight" ? "default" : "ghost"}
          onClick={() => setTab("weight")}
          className="w-full sm:w-auto"
        >
          Weight
        </Button>

        <Button
          variant={tab === "plans" ? "default" : "ghost"}
          onClick={() => setTab("plans")}
          className="w-full sm:w-auto"
        >
          Nutrition Plans
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/70 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-6 py-5">
          <CardTitle className="text-xl text-slate-950">Current snapshot</CardTitle>
          <p className="text-sm text-slate-500">
            Your most recent recorded measurements and plan.
          </p>
        </CardHeader>

        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Latest weight
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {latestWeight ? `${latestWeight.weightKg} kg` : "—"}
            </p>
            {latestWeight ? (
              <p className="mt-1 text-xs text-slate-500">{latestWeight.date}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">No weight recorded</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current BMI
            </p>
            {latestBmi ? (
              <>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {latestBmi.bmi.toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {latestBmi.category.label}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  —
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Height and weight needed
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current plan
            </p>
            {latestPlan ? (
              <>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {latestPlan.targetCalories} kcal
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Version {latestPlan.version} • {latestPlan.goal}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  —
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  No nutrition plan yet
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {tab === "weight" ? (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex-col items-start gap-1 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-950">Weight history</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Your recorded weights and calculated BMI.
              </p>
            </div>
            <Badge variant="secondary">{weights.length} entries</Badge>
          </CardHeader>

          <CardContent className="p-6">
            {weights.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="font-medium text-slate-800">
                  No weight entries yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Start tracking your weight to build your history.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="divide-y divide-slate-100 bg-white">
                  {weights.map((entry, index) => {
                    const bmi =
                      profile?.heightCm
                        ? calcBMIKgM(entry.weightKg, profile.heightCm)
                        : null;

                    const category =
                      bmi !== null ? bmiCategoryWHO(bmi) : null;

                    return (
                      <div
                        key={entry.id}
                        className={`p-4 sm:p-5 ${
                          index === 0
                            ? "border-l-4 border-emerald-500 bg-emerald-50/70"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="text-lg font-semibold text-slate-950">
                                {entry.weightKg} kg
                              </span>
                              {index === 0 && (
                                <span className="text-xs font-medium text-emerald-700">
                                  Latest
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-sm text-slate-600">
                              {entry.date}
                              {entry.note ? ` • ${entry.note}` : ""}
                            </div>
                          </div>

                          {bmi !== null && category && (
                            <Badge variant="secondary" className="w-fit">
                              BMI {bmi.toFixed(1)} • {category.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex-col items-start gap-1 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-950">
                Nutrition plan history
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Your generated nutrition plans and their targets.
              </p>
            </div>
            <Badge variant="secondary">{plans.length} plans</Badge>
          </CardHeader>

          <CardContent className="p-6">
            {plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="font-medium text-slate-800">
                  No nutrition plans yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Generate a plan from the Calories tool to start building
                  your plan history.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="divide-y divide-slate-100 bg-white">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`p-4 sm:p-5 ${
                        index === 0
                          ? "border-l-4 border-emerald-500 bg-emerald-50/70"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-lg font-semibold text-slate-950">
                              Version {plan.version} • {plan.targetCalories} kcal
                            </span>
                            {index === 0 && (
                              <span className="text-xs font-medium text-emerald-700">
                                Latest
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-sm text-slate-600">
                            Goal: {plan.goal}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {new Date(plan.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="w-fit rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                          P {plan.proteinG}g • C {plan.carbsG}g • F {plan.fatG}g
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

}
