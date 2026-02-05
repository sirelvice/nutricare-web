"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
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

import { addCaloriesHistory } from "@/lib/history/calories";

type ApiOk = { bmr: number; tdee: number; targetCalories: number };
type ApiErr = { error: string };
type ApiResponse = ApiOk | ApiErr;

export default function CaloriesToolPage() {
  const profile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const [heightCm, setHeightCm] = useState<string>(profile.heightCm ? String(profile.heightCm) : "");
  const [ageYears, setAgeYears] = useState<string>(profile.age ? String(profile.age) : "");
  const [weightKg, setWeightKg] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiResponse | null>(null);

  const valid = useMemo(() => {
    const h = Number(heightCm);
    const a = Number(ageYears);
    const w = Number(weightKg);
    if (!h || !a || !w) return false;
    if (h < 80 || h > 250) return false;
    if (a < 10 || a > 120) return false;
    if (w < 20 || w > 350) return false;
    return true;
  }, [heightCm, ageYears, weightKg]);

  async function calculate() {
    if (!valid) {
      setApi({ error: "Enter valid height, age and weight first." });
      return;
    }

    setLoading(true);
    setApi(null);

    try {
      const payload = {
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        ageYears: Number(ageYears),
        gender: profile.gender,
        activity: profile.activity,
        goal: profile.goal,
      };

      const res = await fetch("/api/metabolism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setApi({ error: (json as ApiErr).error ?? "Request failed." });
      } else {
        setApi(json);

        // Auto-save to History (only on success)
        const ok = json as ApiOk;
        addCaloriesHistory({
          heightCm: payload.heightCm,
          weightKg: payload.weightKg,
          ageYears: payload.ageYears,
          gender: payload.gender,
          activity: payload.activity,
          goal: payload.goal,
          bmr: ok.bmr,
          tdee: ok.tdee,
          targetCalories: ok.targetCalories,
        });
      }
    } catch {
      setApi({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calories (BMR & TDEE)</h1>
          <p className="text-slate-600">
            Uses your saved profile for gender, activity and goal. Enter weight to calculate calorie needs.
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
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age (years)</Label>
            <Input
              id="age"
              value={ageYears}
              onChange={(e) => setAgeYears(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Gender: {profile.gender}</Badge>
            <Badge variant="secondary">Activity: {profile.activity}</Badge>
            <Badge variant="secondary">Goal: {profile.goal}</Badge>
          </div>

          <div className="md:col-span-3">
            <Button onClick={calculate} disabled={!valid || loading} className="w-full md:w-auto">
              {loading ? "Calculating..." : "Calculate calories"}
            </Button>

            {!valid ? (
              <p className="mt-2 text-xs text-slate-500">
                Enter realistic values (Height 80–250cm, Age 10–120, Weight 20–350kg).
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!api ? (
            <p className="text-slate-600">Enter your details and calculate.</p>
          ) : "error" in api ? (
            <p className="text-slate-600">{api.error}</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">BMR</div>
                  <div className="text-2xl font-semibold">{api.bmr}</div>
                  <div className="text-xs text-slate-500">kcal/day (resting)</div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">TDEE</div>
                  <div className="text-2xl font-semibold">{api.tdee}</div>
                  <div className="text-xs text-slate-500">kcal/day (maintenance)</div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Target calories</div>
                  <div className="text-2xl font-semibold">{api.targetCalories}</div>
                  <div className="text-xs text-slate-500">kcal/day (based on goal)</div>
                </div>
              </div>

              <p className="text-xs text-slate-500">Saved to History.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
