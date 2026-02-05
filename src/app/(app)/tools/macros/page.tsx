"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Goal = "lose" | "maintain" | "gain";

type ApiOk = {
  targetCalories: number;
  goal: Goal;
  splitPercent: { protein: number; carbs: number; fat: number };
  grams: { protein: number; carbs: number; fat: number };
  notes: string[];
};
type ApiErr = { error: string };
type ApiResponse = ApiOk | ApiErr;

export default function MacrosPage() {
  const [targetCalories, setTargetCalories] = useState("");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

  const valid = useMemo(() => {
    const c = Number(targetCalories);
    return Boolean(c && c >= 800 && c <= 6000);
  }, [targetCalories]);

  async function calculate() {
    if (!valid) {
      setApi({ error: "Enter realistic target calories (800–6000)." });
      return;
    }

    setLoading(true);
    setApi(null);

    try {
      const res = await fetch("/api/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCalories: Number(targetCalories), goal }),
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
        <h1 className="text-2xl font-semibold">Macros</h1>
        <p className="text-slate-600">
          Convert target calories into practical daily protein, carbs, and fat goals.
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cal">Target calories (kcal/day)</Label>
            <Input
              id="cal"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              placeholder="e.g. 2200"
              inputMode="numeric"
            />
            <p className="text-xs text-slate-500">Tip: use the Calories tool result.</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Goal</Label>
            <div className="flex flex-wrap gap-2">
              {(["lose", "maintain", "gain"] as Goal[]).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={goal === g ? "default" : "outline"}
                  onClick={() => setGoal(g)}
                >
                  {g === "lose" ? "Lose weight" : g === "gain" ? "Gain weight" : "Maintain"}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <Button onClick={calculate} disabled={!valid || loading} className="w-full md:w-auto">
              {loading ? "Calculating..." : "Calculate macros"}
            </Button>
            {!valid ? (
              <p className="mt-2 text-xs text-slate-500">Enter target calories between 800 and 6000.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!api ? (
            <p className="text-slate-600">Enter calories and calculate.</p>
          ) : "error" in api ? (
            <p className="text-slate-600">{api.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Goal: {api.goal}</Badge>
                <Badge variant="secondary">Target: {api.targetCalories} kcal/day</Badge>
                <Badge variant="secondary">
                  Split: P {api.splitPercent.protein}% • C {api.splitPercent.carbs}% • F {api.splitPercent.fat}%
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Protein</div>
                  <div className="text-2xl font-semibold">{api.grams.protein} g</div>
                  <div className="text-xs text-slate-500">per day</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Carbs</div>
                  <div className="text-2xl font-semibold">{api.grams.carbs} g</div>
                  <div className="text-xs text-slate-500">per day</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Fat</div>
                  <div className="text-2xl font-semibold">{api.grams.fat} g</div>
                  <div className="text-xs text-slate-500">per day</div>
                </div>
              </div>

              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {api.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
