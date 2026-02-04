"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
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

const categories: { value: Category; label: string }[] = [
  { value: "underweight", label: "Underweight" },
  { value: "normal", label: "Normal" },
  { value: "overweight", label: "Overweight" },
  { value: "obese1", label: "Obese Class I" },
  { value: "obese2", label: "Obese Class II" },
  { value: "obese3", label: "Obese Class III" },
];

export default function RecommendationsPage() {
  const prof = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );
  const [bmi, setBmi] = useState("");
  const [category, setCategory] = useState<Category>("normal");
  const [targetCalories, setTargetCalories] = useState("");
  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

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
      if (!res.ok) setApi({ error: (json as ApiErr).error ?? "Request failed." });
      else setApi(json);
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
          A practical plan based on BMI, calorie target, and your goal.
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bmi">BMI</Label>
            <Input id="bmi" value={bmi} onChange={(e) => setBmi(e.target.value)} inputMode="decimal" placeholder="e.g. 24.6" />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={[
                    "rounded-2xl border px-3 py-2 text-left text-sm",
                    category === c.value ? "border-slate-900 bg-slate-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cal">Target calories (kcal/day)</Label>
            <Input id="cal" value={targetCalories} onChange={(e) => setTargetCalories(e.target.value)} inputMode="numeric" placeholder="e.g. 2100" />
            <div className="pt-2">
              <Badge variant="secondary">Goal: {prof.goal}</Badge>
            </div>
          </div>

          <div className="md:col-span-3">
            <Button onClick={generate} disabled={!valid || loading} className="w-full md:w-auto">
              {loading ? "Generating..." : "Generate recommendations"}
            </Button>
            {!valid ? (
              <p className="mt-2 text-xs text-slate-500">
                Valid BMI: 10–70. Calories: 1000–6000.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Your plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!api ? (
            <p className="text-slate-600">Enter inputs and generate your plan.</p>
          ) : "error" in api ? (
            <p className="text-slate-600">{api.error}</p>
          ) : (
            <>
              <p className="text-slate-700">{api.summary}</p>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Protein</div>
                  <div className="text-2xl font-semibold">{api.macros.proteinG}g</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Carbs</div>
                  <div className="text-2xl font-semibold">{api.macros.carbsG}g</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Fat</div>
                  <div className="text-2xl font-semibold">{api.macros.fatG}g</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold">Top priorities</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {api.priorities.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Next steps</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {api.nextSteps.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Foods to focus</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {api.foodsToFocus.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Foods to limit</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {api.foodsToLimit.map((x) => <li key={x}>{x}</li>)}
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
