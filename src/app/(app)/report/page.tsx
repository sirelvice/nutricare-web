"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";
import { loadWeightEntries, summarize } from "@/lib/tracking/weight";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportPage() {
  const bmi = loadBmiHistory();
  const cal = loadCaloriesHistory();
  const weight = loadWeightEntries();

  const latestBmi = bmi[0];
  const latestCal = cal[0];
  const weightStats = useMemo(() => summarize(weight), [weight]);

  async function onDownload() {
    const res = await fetch("/api/report", { method: "GET" });
    const json = await res.json();

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    download(`nutricare-report-${ts}.json`, JSON.stringify(json, null, 2));
  }

  const weightTrend = weightStats
    ? weightStats.change > 0
      ? `+${weightStats.change} kg`
      : `${weightStats.change} kg`
    : null;

  const weightInsight = weightStats
    ? weightStats.change < 0
      ? "Weight trending down — good progress"
      : weightStats.change > 0
      ? "Weight increasing — review intake"
      : "Weight stable — maintain consistency"
    : null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Health Report</h1>
        <p className="text-slate-600">
          A snapshot of your nutrition, weight, and health indicators.
        </p>
      </div>

      {/* OVERVIEW */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="text-sm">BMI</CardTitle>
          </CardHeader>
          <CardContent>
            {latestBmi ? (
              <>
                <div className="text-3xl font-semibold">
                  {latestBmi.bmi.toFixed(1)}
                </div>
                <p className="text-sm text-slate-600">
                  {latestBmi.category}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="text-sm">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            {latestCal ? (
              <>
                <div className="text-3xl font-semibold">
                  {latestCal.targetCalories}
                </div>
                <p className="text-sm text-slate-600">
                  Goal: {latestCal.goal}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="text-sm">Weight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weightStats ? (
              <>
                <div className="text-3xl font-semibold">
                  {weightTrend}
                </div>
                <p className="text-sm text-slate-600">
                  {weightInsight}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS */}
      <Card className="rounded-3xl bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {latestBmi && (
            <p>
              Your BMI is <strong>{latestBmi.category}</strong>. Maintain
              balanced nutrition and activity.
            </p>
          )}
          {weightInsight && <p>{weightInsight}</p>}
          {latestCal && (
            <p>
              Daily target is <strong>{latestCal.targetCalories} kcal</strong>{" "}
              for a <strong>{latestCal.goal}</strong> goal.
            </p>
          )}
        </CardContent>
      </Card>

      {/* EXPORT */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-700">
          <p className="text-sm">
            Download your report for sharing or record-keeping.
          </p>

          <Button onClick={onDownload}>
            Download JSON report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}