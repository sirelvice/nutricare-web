"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addBmiHistory } from "@/lib/history/bmi";

type Goal = "lose" | "maintain" | "gain";

type ApiOk = {
  bmi: number;
  category: { label: string; note: string };
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
  // fallback
  return "normal";
}

export default function BMIPage() {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState<Goal>("maintain");

  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

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
        }),
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok) {
        const err = json && typeof json === "object" && "error" in json
          ? String(json.error)
          : "Request failed.";
        setApi({ error: err });
      } else {
        setApi(json);

        // Save BMI to History (only when we have a successful result)
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

    // If already calculated once, refresh immediately with new goal (no useEffect loop)
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
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Your details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 172"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 70"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Goal</Label>
            <div className="flex flex-wrap gap-2">
              {(["lose", "maintain", "gain"] as Goal[]).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={goal === g ? "default" : "outline"}
                  onClick={() => onGoalChange(g)}
                >
                  {g === "lose" ? "Lose weight" : g === "gain" ? "Gain weight" : "Maintain"}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <Button
              onClick={() => fetchRecommendations()}
              disabled={!valid || loading}
              className="w-full md:w-auto"
            >
              {loading ? "Calculating..." : "Calculate & get recommendations"}
            </Button>

            {!valid ? (
              <p className="mt-2 text-xs text-slate-500">
                Enter realistic values (Height 80–250cm, Weight 20–350kg).
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Card className="rounded-3xl">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Result</CardTitle>
          <Button asChild variant="outline" size="sm">
            <a href="/history">View History</a>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {!api ? (
            <p className="text-slate-600">Fill in your details, then click calculate.</p>
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
                <div className="text-sm font-semibold">Nutrition guidance</div>
                <p className="mt-1 text-sm text-slate-600">{api.recommendations.summary}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold">Focus on</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {api.recommendations.focus.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold">Limit</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {api.recommendations.limit.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-semibold">Meal ideas</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {api.recommendations.mealIdeas.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                BMI is a screening tool and doesn’t capture all health factors. If you have medical concerns,
                consider professional guidance.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
