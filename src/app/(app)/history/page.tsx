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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-slate-600">
            Review your recorded weight and nutrition plan versions.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Loading your history...</p>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={tab === "weight" ? "default" : "outline"}
          onClick={() => setTab("weight")}
        >
          Weight
        </Button>

        <Button
          variant={tab === "plans" ? "default" : "outline"}
          onClick={() => setTab("plans")}
        >
          Nutrition Plans
        </Button>
      </div>

      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Current</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Latest weight</p>
            <p className="text-2xl font-semibold">
              {latestWeight ? `${latestWeight.weightKg} kg` : "—"}
            </p>
            {latestWeight && (
              <p className="text-xs text-slate-500">{latestWeight.date}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-slate-500">Current BMI</p>
            {latestBmi ? (
              <>
                <p className="text-2xl font-semibold">
                  {latestBmi.bmi.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500">
                  {latestBmi.category.label}
                </p>
              </>
            ) : (
              <p className="text-2xl font-semibold">—</p>
            )}
          </div>

          <div>
            <p className="text-sm text-slate-500">Current plan</p>
            {latestPlan ? (
              <>
                <p className="text-2xl font-semibold">
                  {latestPlan.targetCalories} kcal
                </p>
                <p className="text-xs text-slate-500">
                  Version {latestPlan.version} • {latestPlan.goal}
                </p>
              </>
            ) : (
              <p className="text-2xl font-semibold">—</p>
            )}
          </div>
        </CardContent>
      </Card>

      {tab === "weight" ? (
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Weight history</CardTitle>
            <Badge variant="secondary">{weights.length}</Badge>
          </CardHeader>

          <CardContent>
            {weights.length === 0 ? (
              <p className="text-sm text-slate-500">
                No weight entries yet. Start tracking to build your history.
              </p>
            ) : (
              <div className="divide-y rounded-2xl border bg-white">
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
                      className={`p-4 ${
                        index === 0
                          ? "bg-emerald-50 border-l-4 border-emerald-500"
                          : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {entry.weightKg} kg
                          </div>

                          <div className="text-sm text-slate-600">
                            {entry.date}
                            {entry.note ? ` • ${entry.note}` : ""}
                          </div>
                        </div>

                        {bmi !== null && category && (
                          <Badge variant="secondary">
                            BMI {bmi.toFixed(1)} • {category.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Nutrition plan history</CardTitle>
            <Badge variant="secondary">{plans.length}</Badge>
          </CardHeader>

          <CardContent>
            {plans.length === 0 ? (
              <p className="text-sm text-slate-500">
                No nutrition plans yet. Generate a plan from the Calories tool.
              </p>
            ) : (
              <div className="divide-y rounded-2xl border bg-white">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`p-4 ${
                      index === 0
                        ? "bg-emerald-50 border-l-4 border-emerald-500"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          Version {plan.version} • {plan.targetCalories} kcal
                        </div>

                        <div className="text-sm text-slate-600">
                          Goal: {plan.goal}
                        </div>

                        <div className="text-xs text-slate-500">
                          {new Date(plan.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-sm text-slate-600">
                        P {plan.proteinG}g • C {plan.carbsG}g • F {plan.fatG}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
