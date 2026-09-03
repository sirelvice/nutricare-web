"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { calcBMIKgM, bmiCategoryWHO } from "@/lib/calc/bmi";

export default function BMIPage() {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    if (!calculated) return null;

    const height = Number(heightCm);
    const weight = Number(weightKg);

    if (
      !Number.isFinite(height) ||
      !Number.isFinite(weight) ||
      height < 80 ||
      height > 250 ||
      weight < 20 ||
      weight > 350
    ) {
      return null;
    }

    const bmi = calcBMIKgM(weight, height);

    if (bmi === null) return null;

    return {
      bmi,
      category: bmiCategoryWHO(bmi),
    };
  }, [calculated, heightCm, weightKg]);

  const valid = useMemo(() => {
    const height = Number(heightCm);
    const weight = Number(weightKg);

    return (
      Number.isFinite(height) &&
      Number.isFinite(weight) &&
      height >= 80 &&
      height <= 250 &&
      weight >= 20 &&
      weight <= 350
    );
  }, [heightCm, weightKg]);

  function calculate() {
    setCalculated(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">BMI Calculator</h1>
        <p className="text-slate-600">
          Calculate your BMI and understand its general screening category.
        </p>
      </div>

      {/* Inputs */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Your details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              className="h-10 rounded-xl"
              value={heightCm}
              onChange={(e) => {
                setHeightCm(e.target.value);
                setCalculated(false);
              }}
              placeholder="e.g. 172"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              className="h-10 rounded-xl"
              value={weightKg}
              onChange={(e) => {
                setWeightKg(e.target.value);
                setCalculated(false);
              }}
              placeholder="e.g. 70"
              inputMode="decimal"
            />
          </div>

          <div className="md:col-span-3">
            <Button
              onClick={calculate}
              disabled={!valid}
              className="w-full md:w-auto"
            >
              Calculate BMI
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
          {!calculated ? (
            <p className="text-slate-600">
              Enter your height and weight, then click calculate.
            </p>
          ) : !result ? (
            <p className="text-slate-600">
              Enter valid height and weight values to calculate BMI.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-3xl font-semibold">
                  {result.bmi.toFixed(1)}
                </div>
                <Badge variant="secondary">
                  {result.category.label}
                </Badge>
              </div>

              <p className="text-slate-600">{result.category.note}</p>

              <p className="text-xs text-slate-500">
                BMI is a screening tool and does not capture all health
                factors. It should not be used as a diagnosis.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
