"use client";

import { useMemo, useState, useEffect, useSyncExternalStore } from "react";
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

import { loadWeightEntries } from "@/lib/tracking/weight";
import { addCaloriesHistory } from "@/lib/history/calories";

type ApiOk = {
  targetCalories: number;
};

type ApiErr = { error: string };
type ApiResponse = ApiOk | ApiErr;

export default function CaloriesToolPage() {
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const weightEntries = useMemo(() => loadWeightEntries(), []);
  const latestWeight = weightEntries[0]?.weightKg ?? null;

  const [weightKg, setWeightKg] = useState<string>(
    latestWeight ? String(latestWeight) : ""
  );

  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

  const valid = useMemo(() => {
    const w = Number(weightKg);
    return !!w && w >= 20 && w <= 350 && profile.heightCm && profile.age;
  }, [weightKg, profile]);

  async function calculate() {
    if (!valid) {
      setApi({ error: "Missing required profile or weight." });
      return;
    }

    setLoading(true);
    setApi(null);

    try {
      const payload = {
        heightCm: profile.heightCm,
        weightKg: Number(weightKg),
        age: profile.age,
        gender: profile.gender,
        activity: profile.activity,
        goal: profile.goal,
      };

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setApi({ error: (json as ApiErr).error ?? "Request failed." });
      } else {
        setApi(json);

        const ok = json as ApiOk;

        addCaloriesHistory({
          heightCm: payload.heightCm,
          weightKg: payload.weightKg,
          ageYears: payload.age,
          gender: payload.gender,
          activity: payload.activity,
          goal: payload.goal,
          targetCalories: ok.targetCalories,
        });
      }
    } catch {
      setApi({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ✅ AUTO RUN when possible
  useEffect(() => {
    if (valid && !api) {
      calculate();
    }
  }, [valid]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calories</h1>
          <p className="text-slate-600">
            Automatically calculated from your profile and latest weight.
          </p>
        </div>

        <Button asChild variant="outline">
          <a href="/history">View History</a>
        </Button>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">

          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Height: {profile.heightCm}</Badge>
            <Badge variant="secondary">Age: {profile.age}</Badge>
            <Badge variant="secondary">Gender: {profile.gender}</Badge>
            <Badge variant="secondary">Activity: {profile.activity}</Badge>
            <Badge variant="secondary">Goal: {profile.goal}</Badge>
          </div>

          <div className="md:col-span-3">
            <Button onClick={calculate} disabled={!valid || loading}>
              {loading ? "Calculating..." : "Recalculate"}
            </Button>
          </div>

        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Result</CardTitle>
        </CardHeader>
        <CardContent>
          {!api ? (
            <p className="text-slate-600">Calculating...</p>
          ) : "error" in api ? (
            <p className="text-slate-600">{api.error}</p>
          ) : (
            <div className="text-3xl font-semibold">
              {api.targetCalories} kcal/day
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}