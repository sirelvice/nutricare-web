"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  loadBmiHistory,
  deleteBmiHistory,
  clearBmiHistory,
  type BmiHistoryEntry,
} from "@/lib/history/bmi";

import {
  loadCaloriesHistory,
  deleteCaloriesHistory,
  clearCaloriesHistory,
  type CaloriesHistoryEntry,
} from "@/lib/history/calories";

function fmtTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

const catLabel: Record<BmiHistoryEntry["category"], string> = {
  underweight: "Underweight",
  normal: "Normal",
  overweight: "Overweight",
  obese1: "Obese Class I",
  obese2: "Obese Class II",
  obese3: "Obese Class III",
};

export default function HistoryPage() {
  const [bmi, setBmi] = useState<BmiHistoryEntry[]>(() => loadBmiHistory());
  const [cal, setCal] = useState<CaloriesHistoryEntry[]>(() => loadCaloriesHistory());

  const bmiCount = useMemo(() => bmi.length, [bmi]);
  const calCount = useMemo(() => cal.length, [cal]);

  function refresh() {
    setBmi(loadBmiHistory());
    setCal(loadCaloriesHistory());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-slate-600">Your recent calculations — BMI and calories.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              clearBmiHistory();
              clearCaloriesHistory();
              refresh();
            }}
          >
            Clear all
          </Button>
          <Button variant="outline" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">BMI</CardTitle>
            <Badge variant="secondary">{bmiCount}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {bmi.length === 0 ? (
              <p className="text-slate-600">No BMI history yet.</p>
            ) : (
              <div className="divide-y rounded-2xl border">
                {bmi.slice(0, 25).map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <div className="font-semibold">
                        BMI {e.bmi.toFixed(1)} • {catLabel[e.category]}
                      </div>
                      <div className="text-sm text-slate-600">
                        {fmtTime(e.createdAt)} • {e.heightCm}cm • {e.weightKg}kg
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        deleteBmiHistory(e.id);
                        setBmi(loadBmiHistory());
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  clearBmiHistory();
                  setBmi(loadBmiHistory());
                }}
                disabled={bmi.length === 0}
              >
                Clear BMI
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Calories</CardTitle>
            <Badge variant="secondary">{calCount}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {cal.length === 0 ? (
              <p className="text-slate-600">No calories history yet.</p>
            ) : (
              <div className="divide-y rounded-2xl border">
                {cal.slice(0, 25).map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <div className="font-semibold">
                        Target {e.targetCalories} kcal • TDEE {e.tdee} • BMR {e.bmr}
                      </div>
                      <div className="text-sm text-slate-600">
                        {fmtTime(e.createdAt)} • {e.weightKg}kg • {e.heightCm}cm • {e.ageYears}y
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        deleteCaloriesHistory(e.id);
                        setCal(loadCaloriesHistory());
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  clearCaloriesHistory();
                  setCal(loadCaloriesHistory());
                }}
                disabled={cal.length === 0}
              >
                Clear Calories
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Next</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-700 text-sm">
          Next we’ll auto-save history directly from the BMI and Calories tools,
          and show “Recent calculations” on the Dashboard.
        </CardContent>
      </Card>
    </div>
  );
}
