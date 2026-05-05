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

type Tab = "bmi" | "calories";

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("bmi");

  const [bmi, setBmi] = useState<BmiHistoryEntry[]>(() =>
    loadBmiHistory()
  );
  const [cal, setCal] = useState<CaloriesHistoryEntry[]>(() =>
    loadCaloriesHistory()
  );

  const latestBmi = useMemo(() => bmi[0] ?? null, [bmi]);
  const latestCal = useMemo(() => cal[0] ?? null, [cal]);

  function refresh() {
    setBmi(loadBmiHistory());
    setCal(loadCaloriesHistory());
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="text-slate-600">
            View your past BMI and calorie calculations.
          </p>
        </div>

        <Button variant="outline" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {/* TOGGLE */}
      <div className="flex gap-2">
        <Button
          variant={tab === "bmi" ? "default" : "outline"}
          onClick={() => setTab("bmi")}
        >
          BMI
        </Button>
        <Button
          variant={tab === "calories" ? "default" : "outline"}
          onClick={() => setTab("calories")}
        >
          Calories
        </Button>
      </div>

      {/* SUMMARY */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>

        <CardContent>
          {tab === "bmi" ? (
            !latestBmi ? (
              <p className="text-slate-500">No BMI history yet.</p>
            ) : (
              <div className="space-y-1">
                <div className="text-3xl font-semibold">
                  {latestBmi.bmi.toFixed(1)}
                </div>
                <p className="text-sm text-slate-600">
                  {catLabel[latestBmi.category]}
                </p>
                <p className="text-xs text-slate-500">
                  {fmtTime(latestBmi.createdAt)}
                </p>
              </div>
            )
          ) : !latestCal ? (
            <p className="text-slate-500">No calories history yet.</p>
          ) : (
            <div className="space-y-1">
              <div className="text-3xl font-semibold">
                {latestCal.targetCalories} kcal
              </div>
              <p className="text-sm text-slate-600">
                Goal: {latestCal.goal}
              </p>
              <p className="text-xs text-slate-500">
                {fmtTime(latestCal.createdAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LIST */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {tab === "bmi" ? "BMI history" : "Calories history"}
          </CardTitle>
          <Badge variant="secondary">
            {tab === "bmi" ? bmi.length : cal.length}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          {tab === "bmi" ? (
            bmi.length === 0 ? (
              <p className="text-slate-500">No entries yet.</p>
            ) : (
              <div className="divide-y rounded-2xl border bg-white">
                {bmi.slice(0, 25).map((e, i) => (
                  <div
                    key={e.id}
                    className={`flex items-center justify-between gap-3 p-4 ${
                      i === 0
                        ? "bg-emerald-50 border-l-4 border-emerald-500"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="font-semibold">
                        BMI {e.bmi.toFixed(1)} • {catLabel[e.category]}
                      </div>
                      <div className="text-sm text-slate-600">
                        {fmtTime(e.createdAt)} • {e.heightCm}cm •{" "}
                        {e.weightKg}kg
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
            )
          ) : cal.length === 0 ? (
            <p className="text-slate-500">No entries yet.</p>
          ) : (
            <div className="divide-y rounded-2xl border bg-white">
              {cal.slice(0, 25).map((e, i) => (
                <div
                  key={e.id}
                  className={`flex items-center justify-between gap-3 p-4 ${
                    i === 0
                      ? "bg-emerald-50 border-l-4 border-emerald-500"
                      : ""
                  }`}
                >
                  <div>
                    <div className="font-semibold">
                      {e.targetCalories} kcal • Goal: {e.goal}
                    </div>
                    <div className="text-sm text-slate-600">
                      {fmtTime(e.createdAt)} • {e.weightKg}kg •{" "}
                      {e.heightCm}cm
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

          {/* CLEAR */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (tab === "bmi") {
                  clearBmiHistory();
                  setBmi(loadBmiHistory());
                } else {
                  clearCaloriesHistory();
                  setCal(loadCaloriesHistory());
                }
              }}
              disabled={tab === "bmi" ? bmi.length === 0 : cal.length === 0}
            >
              Clear {tab === "bmi" ? "BMI" : "Calories"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}