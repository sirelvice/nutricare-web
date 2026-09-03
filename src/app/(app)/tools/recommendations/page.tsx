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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Recommendations</h1>
          <p className="text-slate-600">
            Personalized guidance based on your current plan and progress.
          </p>
        </div>

        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-6">
            <p className="text-slate-600">Loading recommendations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Recommendations</h1>
          <p className="text-slate-600">
            Personalized guidance based on your current plan and progress.
          </p>
        </div>

        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-6">
            <p className="text-slate-600">{error}</p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recommendations</h1>
        <p className="text-slate-600">
          Personalized guidance based on your current plan and progress.
        </p>
      </div>

      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Your current position</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">BMI: {data.bmi.toFixed(1)}</Badge>
          <Badge variant="secondary">{data.category.label}</Badge>
          <Badge variant="secondary">
            {data.targetCalories} kcal/day
          </Badge>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Your nutrition targets</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <div className="text-xs text-slate-500">Protein</div>
            <div className="text-2xl font-semibold">
              {data.macros.proteinG}g
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-xs text-slate-500">Carbs</div>
            <div className="text-2xl font-semibold">
              {data.macros.carbsG}g
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-xs text-slate-500">Fat</div>
            <div className="text-2xl font-semibold">
              {data.macros.fatG}g
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Your recommendations</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-slate-700">{recommendations.summary}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Top priorities</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {recommendations.priorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Next steps</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {recommendations.nextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Foods to focus</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {recommendations.foodsToFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Foods to limit</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {recommendations.foodsToLimit.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            {data.category.note} Guidance is informational and not a medical
            diagnosis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
