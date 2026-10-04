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
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Nutrition tool
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Macros
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            View your daily protein, carbohydrate and fat targets from your
            current nutrition plan.
          </p>
        </section>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-700">
                Loading your nutrition plan
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                We&apos;re retrieving your latest macro targets.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Nutrition tool
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Macros
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            View your daily protein, carbohydrate and fat targets from your
            current nutrition plan.
          </p>
        </section>

        <Card className="rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-red-900">
              We couldn&apos;t load your nutrition plan.
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>

            <Button onClick={() => window.location.reload()} className="mt-5">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Nutrition tool
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Macros
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            View your daily protein, carbohydrate and fat targets from your
            current nutrition plan.
          </p>
        </section>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-950">
                No nutrition plan yet
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Generate a nutrition plan from your profile and current weight
                to see your recommended daily calorie and macro targets.
              </p>

              <Button asChild className="mt-5">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Nutrition tool
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Macros
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Your current daily protein, carbohydrate and fat targets from your
            nutrition plan.
          </p>
        </div>

        <Button asChild variant="outline" className="shrink-0 bg-white">
          <Link href="/tools/calories">View calorie target</Link>
        </Button>
      </section>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-950">
                Current nutrition plan
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Your latest personalised daily macro targets.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white">
                Goal: {plan.goal}
              </Badge>
              <Badge variant="secondary" className="bg-white">
                {plan.targetCalories} kcal/day
              </Badge>
              <Badge variant="secondary" className="bg-white">
                Plan v{plan.version}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-7 p-6 sm:p-7">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-950">
                Daily macro targets
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Use these amounts as part of your current nutrition plan.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-shadow hover:shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Protein
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-slate-950">
                    {plan.proteinG}
                  </span>
                  <span className="pb-1 text-sm font-medium text-slate-500">
                    g/day
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Supports daily protein needs within your plan.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-shadow hover:shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Carbohydrates
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-slate-950">
                    {plan.carbsG}
                  </span>
                  <span className="pb-1 text-sm font-medium text-slate-500">
                    g/day
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Your planned daily carbohydrate target.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-shadow hover:shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fat
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-slate-950">
                    {plan.fatG}
                  </span>
                  <span className="pb-1 text-sm font-medium text-slate-500">
                    g/day
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Your planned daily fat target.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-950">
              About these targets
            </h2>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>
                These targets are estimates based on your current profile and
                weight.
              </li>
              <li>
                Your plan may be updated as your goals and progress change.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
