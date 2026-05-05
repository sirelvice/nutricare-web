"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";
import { loadWeightEntries, summarize } from "@/lib/tracking/weight";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReportPage() {
  const pdfRef = useRef<HTMLDivElement>(null);

  const bmi = loadBmiHistory();
  const cal = loadCaloriesHistory();
  const weight = loadWeightEntries();

  const latestBmi = bmi[0];
  const latestCal = cal[0];
  const weightStats = summarize(weight);

  const weightTrend = weightStats
    ? weightStats.change > 0
      ? `+${weightStats.change} kg`
      : `${weightStats.change} kg`
    : "—";

  const weightInsight = weightStats
    ? weightStats.change < 0
      ? "Weight trending down — good progress"
      : weightStats.change > 0
      ? "Weight increasing — review intake"
      : "Weight stable — maintain consistency"
    : "No data";

  async function onDownloadPDF() {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

    while (imgHeight + position > 297) {
      position -= 297;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    }

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    pdf.save(`nutricare-report-${ts}.pdf`);
  }

  return (
    <div className="space-y-6">
      {/* UI HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Health Report</h1>
        <p className="text-slate-600">
          A snapshot of your nutrition, weight, and health indicators.
        </p>
      </div>

      {/* UI CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl bg-white border">
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

        <Card className="rounded-3xl bg-white border">
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

        <Card className="rounded-3xl bg-white border">
          <CardHeader>
            <CardTitle className="text-sm">Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{weightTrend}</div>
            <p className="text-sm text-slate-600">{weightInsight}</p>
          </CardContent>
        </Card>
      </div>

      {/* EXPORT */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Export</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onDownloadPDF}>
            Download PDF Report
          </Button>
        </CardContent>
      </Card>

      {/* ================= PDF LAYOUT (ISOLATED) ================= */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={pdfRef}
          style={{
            width: "794px",
            padding: "40px",
            backgroundColor: "#ffffff",
            color: "#000000",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* HEADER */}
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "24px", marginBottom: "4px" }}>
              NutriCare Health Report
            </h1>
            <p style={{ fontSize: "12px", color: "#555" }}>
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* OVERVIEW */}
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
              Overview
            </h2>
            <p><strong>BMI:</strong> {latestBmi?.bmi?.toFixed(1) ?? "—"}</p>
            <p><strong>Category:</strong> {latestBmi?.category ?? "—"}</p>
            <p><strong>Calories:</strong> {latestCal?.targetCalories ?? "—"} kcal</p>
            <p><strong>Goal:</strong> {latestCal?.goal ?? "—"}</p>
          </div>

          {/* WEIGHT */}
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
              Weight Trend
            </h2>
            <p>{weightTrend}</p>
            <p>{weightInsight}</p>
          </div>

          {/* INSIGHTS */}
          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
              Insights
            </h2>
            <p>Your BMI status: {latestBmi?.category ?? "—"}</p>
            <p>{weightInsight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}