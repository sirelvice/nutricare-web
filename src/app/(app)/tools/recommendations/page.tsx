"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RecommendationData = {
  bmi: number;
  category: {
    label: string;
    note: string;
  };
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
};

type ApiResponse =
  | RecommendationData
  | {
      error: string;
    };

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const res = await fetch("/api/recommendations");
        const json = (await res.json()) as ApiResponse;

        if (!res.ok) {
          setError(
            "error" in json
              ? json.error
              : "Unable to load recommendations.",
          );
          return;
        }

        setData(json as RecommendationData);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Personalised guidance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Recommendations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Practical guidance based on your current plan, profile and
            progress.
          </p>
        </section>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-700">
                Loading your recommendations
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                We&apos;re preparing guidance from your latest information.
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
            Personalised guidance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Recommendations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Practical guidance based on your current plan, profile and
            progress.
          </p>
        </section>

        <Card className="rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-red-900">
              We couldn&apos;t load your recommendations.
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { recommendations } = data;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Personalised guidance
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Recommendations
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Practical guidance based on your current plan, profile and progress.
          Use these recommendations alongside your nutrition targets.
        </p>
      </section>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div>
            <CardTitle className="text-xl text-slate-950">
              Your current position
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Key measures used to provide your current guidance.
            </p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 sm:grid-cols-3 sm:p-7">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              BMI
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {data.bmi.toFixed(1)}
            </p>
            <Badge variant="secondary" className="mt-3 bg-white">
              {data.category.label}
            </Badge>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Daily calories
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold text-slate-950">
                {data.targetCalories}
              </span>
              <span className="pb-0.5 text-sm font-medium text-slate-500">
                kcal/day
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Current nutrition target
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Guidance focus
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              Personalised plan
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Based on your current profile and progress.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div>
            <CardTitle className="text-xl text-slate-950">
              Your nutrition targets
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Daily macro targets from your current nutrition plan.
            </p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-6 md:grid-cols-3 sm:p-7">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Protein
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-950">
                {data.macros.proteinG}
              </span>
              <span className="pb-1 text-sm font-medium text-slate-500">
                g/day
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Carbohydrates
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-950">
                {data.macros.carbsG}
              </span>
              <span className="pb-1 text-sm font-medium text-slate-500">
                g/day
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fat
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-950">
                {data.macros.fatG}
              </span>
              <span className="pb-1 text-sm font-medium text-slate-500">
                g/day
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div>
            <CardTitle className="text-xl text-slate-950">
              Your recommendations
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Focus areas and practical next steps from your current plan.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-7 p-6 sm:p-7">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Summary
            </p>
            <p className="mt-2 text-base leading-7 text-slate-800">
              {recommendations.summary}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Top priorities
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {recommendations.priorities.map((item) => (
                  <li key={item} className="pl-1">
                    <span className="mr-2 text-emerald-700">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Next steps
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {recommendations.nextSteps.map((item) => (
                  <li key={item} className="pl-1">
                    <span className="mr-2 text-emerald-700">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Foods to focus
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {recommendations.foodsToFocus.map((item) => (
                  <li key={item} className="pl-1">
                    <span className="mr-2 text-emerald-700">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Foods to limit
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {recommendations.foodsToLimit.map((item) => (
                  <li key={item} className="pl-1">
                    <span className="mr-2 text-amber-700">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm leading-6 text-slate-600">
              {data.category.note}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Guidance is informational and not a medical diagnosis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
