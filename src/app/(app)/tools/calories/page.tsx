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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calories</h1>
          <p className="text-slate-600">
            Your current nutrition target based on your profile and latest
            weight.
          </p>
        </div>

        <Button asChild variant="outline">
          <a href="/history">View History</a>
        </Button>
      </div>

      {error && (
        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current plan */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Current nutrition plan</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading your plan...</p>
          ) : plan ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Goal: {plan.goal}
                </Badge>
                <Badge variant="secondary">
                  Plan version: {plan.version}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-slate-500">Daily target</p>
                <div className="text-4xl font-semibold">
                  {plan.targetCalories} kcal
                </div>
              </div>

              <div className="grid grid-cols-3 text-center">
                <div>
                  <div className="text-xl font-semibold">
                    {plan.proteinG}g
                  </div>
                  <p className="text-xs text-slate-500">Protein</p>
                </div>

                <div>
                  <div className="text-xl font-semibold">
                    {plan.carbsG}g
                  </div>
                  <p className="text-xs text-slate-500">Carbs</p>
                </div>

                <div>
                  <div className="text-xl font-semibold">
                    {plan.fatG}g
                  </div>
                  <p className="text-xs text-slate-500">Fat</p>
                </div>
              </div>

              <Button onClick={generatePlan} disabled={generating}>
                {generating ? "Updating plan..." : "Recalculate plan"}
              </Button>

              <p className="text-xs text-slate-500">
                Recalculating creates a new plan version using your current
                profile and latest weight.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                No nutrition plan exists yet. Complete your profile and log
                your current weight to generate one.
              </p>

              <Button onClick={generatePlan} disabled={generating}>
                {generating ? "Generating..." : "Generate nutrition plan"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
