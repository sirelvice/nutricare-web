"use client";

import {
  useMemo,
  useState,
  useEffect,
  useSyncExternalStore,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  subscribeProfile,
  getProfileSnapshot,
  getProfileServerSnapshot,
} from "@/lib/profile/storage";

import { loadCaloriesHistory } from "@/lib/history/calories";

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
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const calHistory = useMemo(() => loadCaloriesHistory(), []);
  const latestCalories = calHistory[0] ?? null;

  const [targetCalories, setTargetCalories] = useState("");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

  // ✅ Prefill calories
  useEffect(() => {
    if (latestCalories && !targetCalories) {
      setTargetCalories(String(latestCalories.targetCalories));
    }
  }, [latestCalories, targetCalories]);

  // ✅ Prefill goal
  useEffect(() => {
    if (profile.goal) {
      setGoal(profile.goal);
    }
  }, [profile.goal]);

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
      if (!res.ok)
        setApi({ error: (json as ApiErr).error ?? "Request failed." });
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
          Explore macro splits for different calorie targets.
        </p>
      </div>

      {/* INPUT */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Target calories (kcal/day)</Label>
            <Input
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              placeholder="e.g. 2200"
              inputMode="numeric"
            />
            <p className="text-xs text-slate-500">
              Auto-filled from your dashboard.
            </p>
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
                  {g === "lose"
                    ? "Lose weight"
                    : g === "gain"
                    ? "Gain weight"
                    : "Maintain"}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <Button onClick={calculate} disabled={!valid || loading}>
              {loading ? "Calculating..." : "Calculate macros"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULT */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
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
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Goal: {api.goal}</Badge>
                <Badge variant="secondary">
                  {api.targetCalories} kcal/day
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Protein</div>
                  <div className="text-2xl font-semibold">
                    {api.grams.protein} g
                  </div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Carbs</div>
                  <div className="text-2xl font-semibold">
                    {api.grams.carbs} g
                  </div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Fat</div>
                  <div className="text-2xl font-semibold">
                    {api.grams.fat} g
                  </div>
                </div>
              </div>

              <ul className="list-disc pl-5 text-sm text-slate-600">
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