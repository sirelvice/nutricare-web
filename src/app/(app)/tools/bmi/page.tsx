"use client";

import { useMemo, useState, useSyncExternalStore, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addBmiHistory } from "@/lib/history/bmi";
import {
  subscribeProfile,
  getProfileSnapshot,
  getProfileServerSnapshot,
} from "@/lib/profile/storage";
import { loadWeightEntries } from "@/lib/tracking/weight";

type Goal = "lose" | "maintain" | "gain";

type ApiOk = {
  bmi: number;
  category: { label: string; note: string };
  targetCalories: number;
  recommendations: {
    bmiLabel: string;
    goal: Goal;
    summary: string;
    focus: string[];
    limit: string[];
    mealIdeas: string[];
  };
};

type ApiResponse = ApiOk | { error: string };

function isOk(res: ApiResponse): res is ApiOk {
  return "bmi" in res && "category" in res && "recommendations" in res;
}

type CategoryKey =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese1"
  | "obese2"
  | "obese3";

function categoryKeyFromLabel(label: string): CategoryKey {
  const x = label.toLowerCase();
  if (x.includes("under")) return "underweight";
  if (x.includes("normal")) return "normal";
  if (x.includes("overweight")) return "overweight";
  if (x.includes("class i")) return "obese1";
  if (x.includes("class ii")) return "obese2";
  if (x.includes("class iii")) return "obese3";
  return "normal";
}

export default function BMIPage() {
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const [heightCm, setHeightCm] = useState<string>(
    profile?.heightCm ? String(profile.heightCm) : ""
  );

  const weightEntries = useMemo(() => loadWeightEntries(), []);
  const latestWeight = weightEntries[0]?.weightKg ?? null;

  const [weightKg, setWeightKg] = useState<string>(
    latestWeight ? String(latestWeight) : ""
  );

  const [goal, setGoal] = useState<Goal>("maintain");

  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

  useEffect(() => {
    if (!profile?.heightCm) return;

    setHeightCm((prev) => {
      if (prev) return prev; // don't override user input
      return String(profile.heightCm);
    });
  }, [profile?.heightCm]);

  const valid = useMemo(() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w) return false;
    if (h < 80 || h > 250) return false;
    if (w < 20 || w > 350) return false;
    return true;
  }, [heightCm, weightKg]);

  async function fetchRecommendations(nextGoal?: Goal) {
    const g = nextGoal ?? goal;

    if (!valid) {
      setApi({ error: "Enter a valid height and weight first." });
      return;
    }

    setLoading(true);
    setApi(null);

    try {
      const h = Number(heightCm);
      const w = Number(weightKg);

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm: h,
          weightKg: w,
          goal: g,
          age: profile?.age ?? null,
          gender: profile?.gender ?? null,
          activity: profile?.activity ?? null,
        }),
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok) {
        const err =
          json && typeof json === "object" && "error" in json
            ? String(json.error)
            : "Request failed.";
        setApi({ error: err });
      } else {
        setApi(json);

        if (isOk(json)) {
          addBmiHistory({
            heightCm: h,
            weightKg: w,
            bmi: Number(json.bmi.toFixed(1)),
            category: categoryKeyFromLabel(json.category.label),
          });
        }
      }
    } catch {
      setApi({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  function onGoalChange(g: Goal) {
    setGoal(g);

    if (api && isOk(api) && valid && !loading) {
      fetchRecommendations(g);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">BMI Calculator</h1>
        <p className="text-slate-600">
          Enter your details to get BMI, category, and nutrition recommendations.
          Results are saved to History.
        </p>
      </div>

      {/* Inputs */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Your details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">

          {/* Height */}
          <div className="space-y-1">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              className="h-10 rounded-xl"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 172"
              inputMode="numeric"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              className="h-10 rounded-xl"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 70"
              inputMode="numeric"
            />
          </div>

          {/* Goal */}
          <div className="space-y-1">
            <Label>Goal</Label>
            <select
              value={goal}
              onChange={(e) => onGoalChange(e.target.value as Goal)}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-emerald-600"
            >
              <option value="" disabled>
                Select goal
              </option>
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain weight</option>
              <option value="gain">Gain weight</option>
            </select>
          </div>

          {/* CTA */}
          <div className="md:col-span-3">
            <Button
              onClick={() => fetchRecommendations()}
              disabled={!valid || loading}
              className="w-full md:w-auto"
            >
              {loading ? "Calculating..." : "Calculate & get recommendations"}
            </Button>

            {!valid && (
              <p className="mt-2 text-xs text-slate-500">
                Enter realistic values (Height 80–250cm, Weight 20–350kg).
              </p>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Result */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Result</CardTitle>
          <Button asChild variant="outline" size="sm">
            <a href="/history">View History</a>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {!api ? (
            <p className="text-slate-600">
              Fill in your details, then click calculate.
            </p>
          ) : "error" in api ? (
            <p className="text-slate-600">{api.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-3xl font-semibold">{api.bmi}</div>
                <Badge variant="secondary">{api.category.label}</Badge>
              </div>

              <p className="text-slate-600">{api.category.note}</p>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-semibold">
                  Nutrition guidance
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {api.recommendations.summary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold">Focus on</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {api.recommendations?.focus?.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold">Limit</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {api.recommendations?.limit?.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold">Next steps</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {api.recommendations?.mealIdeas?.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                BMI is a screening tool and doesn’t capture all health factors.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}