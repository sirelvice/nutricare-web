"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";
import { loadWeightEntries, summarize } from "@/lib/tracking/weight";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const reportRef = useRef<HTMLDivElement>(null);

  const bmi = loadBmiHistory();
  const cal = loadCaloriesHistory();
  const weight = loadWeightEntries();

  const latestBmi = bmi[0];
  const latestCal = cal[0];
  const weightStats = summarize(weight);

  async function onDownloadJSON() {
    const res = await fetch("/api/report", { method: "GET" });
    const json = await res.json();

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    download(`nutricare-report-${ts}.json`, JSON.stringify(json, null, 2));
  }

  async function onDownloadPDF() {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    pdf.save(`nutricare-report-${ts}.pdf`);
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

      {/* REPORT CONTENT (EXPORT TARGET) */}
      <div ref={reportRef} className="space-y-6 bg-white p-4 rounded-3xl">
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
                Your BMI is <strong>{latestBmi.category}</strong>.
              </p>
            )}
            {weightInsight && <p>{weightInsight}</p>}
            {latestCal && (
              <p>
                Daily target:{" "}
                <strong>{latestCal.targetCalories} kcal</strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ACTIONS */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={onDownloadPDF}>
            Download PDF
          </Button>

          <Button variant="outline" onClick={onDownloadJSON}>
            Download JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}