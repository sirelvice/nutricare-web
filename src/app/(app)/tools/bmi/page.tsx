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
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Health tool
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          BMI Calculator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          Calculate your body mass index from your height and weight, then
          review its general screening category.
        </p>
      </header>

      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <CardTitle className="text-lg text-slate-950">
            Enter your details
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Use your current height and weight for the calculation.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                value={heightCm}
                onChange={(e) => {
                  setHeightCm(e.target.value);
                  setCalculated(false);
                }}
                placeholder="e.g. 172"
                inputMode="decimal"
                className="h-11"
              />
              <p className="text-xs text-slate-500">
                Enter a value between 80 and 250 cm.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                value={weightKg}
                onChange={(e) => {
                  setWeightKg(e.target.value);
                  setCalculated(false);
                }}
                placeholder="e.g. 70"
                inputMode="decimal"
                className="h-11"
              />
              <p className="text-xs text-slate-500">
                Enter a value between 20 and 350 kg.
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  Both values are required before you can calculate BMI.
                </p>
                <Button
                  onClick={calculate}
                  disabled={!valid}
                  className="w-full sm:w-auto"
                >
                  Calculate BMI
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <CardTitle className="text-lg text-slate-950">
              Your result
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Your BMI calculation and general screening category.
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="shrink-0">
            <a href="/history">View History</a>
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {!calculated ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-700">
                Your result will appear here.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Enter your height and weight above, then calculate your BMI.
              </p>
            </div>
          ) : !result ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-900">
                We could not calculate your BMI yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Check that your height and weight are within the accepted
                ranges and try again.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Body mass index
                  </p>
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <span className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                      {result.bmi.toFixed(1)}
                    </span>
                    <span className="pb-1 text-sm font-medium text-slate-500">
                      BMI
                    </span>
                  </div>
                </div>

                <Badge variant="secondary" className="w-fit text-sm">
                  {result.category.label}
                </Badge>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  What this means
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {result.category.note}
                </p>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                BMI is a screening tool and does not capture all health
                factors. It should not be used as a diagnosis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
