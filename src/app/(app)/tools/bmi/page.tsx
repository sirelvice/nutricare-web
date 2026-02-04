"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcBMIKgM, bmiCategory } from "@/lib/calc/bmi";

export default function BMIPage() {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const bmi = useMemo(() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w) return null;
    if (h < 80 || h > 250) return null;
    if (w < 20 || w > 350) return null;
    return calcBMIKgM(w, h);
  }, [heightCm, weightKg]);

  const interpretation = bmi ? bmiCategory(bmi) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">BMI Calculator</h1>
        <p className="text-slate-600">Enter height and weight to get BMI plus interpretation.</p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Your details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bmi ? (
            <>
              <div className="text-3xl font-semibold">{bmi}</div>
              <div className="text-sm text-slate-700">
                <span className="font-medium">{interpretation?.label}</span> — {interpretation?.note}
              </div>
              <div className="text-xs text-slate-500">
                BMI is a screening tool and doesn’t capture all health factors.
              </div>
            </>
          ) : (
            <p className="text-slate-600">Enter valid height and weight to view BMI.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
