"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { NutritionPlan } from "@/lib/nutrition-plan/domain";

export default function MacrosPage() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const response = await fetch("/api/nutrition-plan");

        if (!response.ok) {
          throw new Error("Unable to load your nutrition plan.");
        }

        const data = await response.json();

        if (!cancelled) {
          setPlan(data.plan);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load nutrition plan:", error);
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load your nutrition plan.",
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Macros</h1>
          <p className="text-slate-600">Loading your current nutrition plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Macros</h1>
          <p className="text-slate-600">{error}</p>
        </div>

        <Button onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Macros</h1>
          <p className="text-slate-600">
            Your macros are part of your nutrition plan.
          </p>
        </div>

        <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-slate-600">
              Generate a nutrition plan from your profile and current weight to
              see your recommended daily calorie and macro targets.
            </p>

            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Macros</h1>
        <p className="text-slate-600">
          Your current daily macro targets from your nutrition plan.
        </p>
      </div>

      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Current plan</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Goal: {plan.goal}
            </Badge>
            <Badge variant="secondary">
              {plan.targetCalories} kcal/day
            </Badge>
            <Badge variant="secondary">
              Plan v{plan.version}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-slate-500">Protein</div>
              <div className="text-2xl font-semibold">
                {plan.proteinG} g
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <div className="text-xs text-slate-500">Carbs</div>
              <div className="text-2xl font-semibold">
                {plan.carbsG} g
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <div className="text-xs text-slate-500">Fat</div>
              <div className="text-2xl font-semibold">
                {plan.fatG} g
              </div>
            </div>
          </div>

          <ul className="list-disc pl-5 text-sm text-slate-600">
            <li>
              These targets are estimates based on your current profile and
              weight.
            </li>
            <li>
              Your plan may be updated as your goals and progress change.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
