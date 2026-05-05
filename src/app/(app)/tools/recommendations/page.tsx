"use client";

import {
  useState,
  useMemo,
  useSyncExternalStore,
  useEffect,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  getProfileSnapshot,
  getProfileServerSnapshot,
  subscribeProfile,
} from "@/lib/profile/storage";

import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";

type Category =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese1"
  | "obese2"
  | "obese3";

type ApiOk = {
  summary: string;
  priorities: string[];
  foodsToFocus: string[];
  foodsToLimit: string[];
  nextSteps: string[];
  macros: { proteinG: number; carbsG: number; fatG: number };
};

type ApiErr = { error: string };
type ApiResponse = ApiOk | ApiErr;

export default function RecommendationsPage() {
  const prof = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const bmiHistory = useMemo(() => loadBmiHistory(), []);
  const latestBMI = bmiHistory[0] ?? null;

  const calHistory = useMemo(() => loadCaloriesHistory(), []);
  const latestCalories = calHistory[0] ?? null;

  const [bmi, setBmi] = useState("");
  const [category, setCategory] = useState<Category>("normal");
  const [targetCalories, setTargetCalories] = useState("");

  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

  // ✅ Prefill BMI + category
  useEffect(() => {
    if (latestBMI && !bmi) {
      setBmi(String(latestBMI.bmi));
      setCategory(latestBMI.category);
    }
  }, [latestBMI, bmi]);

  // ✅ Prefill calories
  useEffect(() => {
    if (latestCalories && !targetCalories) {
      setTargetCalories(String(latestCalories.targetCalories));
    }
  }, [latestCalories, targetCalories]);

  const valid = useMemo(() => {
    const b = Number(bmi);
    const c = Number(targetCalories);
    if (!b || b < 10 || b > 70) return false;
    if (!c || c < 1000 || c > 6000) return false;
    return true;
  }, [bmi, targetCalories]);

  async function generate() {
    if (!valid) {
      setApi({ error: "Enter a valid BMI and target calories first." });
      return;
    }

    setLoading(true);
    setApi(null);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bmi: Number(bmi),
          category,
          goal: prof.goal,
          targetCalories: Number(targetCalories),
        }),
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setApi({ error: (json as ApiErr).error ?? "Request failed." });
      } else {
        setApi(json);
      }
    } catch {
      setApi({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recommendations</h1>
        <p className="text-slate-600">
          Generate a custom plan based on different inputs.
        </p>
      </div>

      {/* INPUT */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Inputs</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          {/* BMI */}
          <div className="space-y-2">
            <Label>BMI</Label>
            <Input
              value={bmi}
              onChange={(e) => setBmi(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 24.6"
            />
          </div>

          {/* Category dropdown ✅ */}
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Category)
              }
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-emerald-600"
            >
              <option value="underweight">Underweight</option>
              <option value="normal">Normal</option>
              <option value="overweight">Overweight</option>
              <option value="obese1">Obese Class I</option>
              <option value="obese2">Obese Class II</option>
              <option value="obese3">Obese Class III</option>
            </select>
          </div>

          {/* Calories */}
          <div className="space-y-2">
            <Label>Target calories (kcal/day)</Label>
            <Input
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 2100"
            />
            <div className="pt-1">
              <Badge variant="secondary">Goal: {prof.goal}</Badge>
            </div>
          </div>

          {/* Button */}
          <div className="md:col-span-3">
            <Button onClick={generate} disabled={!valid || loading}>
              {loading ? "Generating..." : "Generate recommendations"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULT */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Your plan</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!api ? (
            <p className="text-slate-600">
              Enter inputs and generate your plan.
            </p>
          ) : "error" in api ? (
            <p className="text-slate-600">{api.error}</p>
          ) : (
            <>
              <p className="text-slate-700">{api.summary}</p>

              {/* Macros */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Protein</div>
                  <div className="text-2xl font-semibold">
                    {api.macros.proteinG}g
                  </div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Carbs</div>
                  <div className="text-2xl font-semibold">
                    {api.macros.carbsG}g
                  </div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Fat</div>
                  <div className="text-2xl font-semibold">
                    {api.macros.fatG}g
                  </div>
                </div>
              </div>

              {/* Lists */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Top priorities</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {api.priorities.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Next steps</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {api.nextSteps.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Foods to focus</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {api.foodsToFocus.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Foods to limit</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {api.foodsToLimit.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Guidance is informational and not a medical diagnosis.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}