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

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      pdf.save(`nutricare-report-${ts}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
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
            <CardTitle className="text-sm">Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{weightTrend}</div>
            <p className="text-sm text-slate-600">{weightInsight}</p>
          </CardContent>
        </Card>
      </div>

      {/* EXPORT BUTTON */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Export</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onDownloadPDF} className="rounded-2xl">
            Download PDF Report
          </Button>
        </CardContent>
      </Card>

      {/* ================= PDF LAYOUT (HIDDEN) ================= */}
      <div className="fixed left-[-9999px] top-0 overflow-hidden">
        <div
          ref={pdfRef}
          style={{
            width: "794px",
            padding: "40px",
            background: "#ffffff",
            color: "#0f172a",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: "1.6",
          }}
        >
          <h1 style={{ fontSize: "28px", marginBottom: "8px", fontWeight: 600 }}>
            NutriCare Health Report
          </h1>
          <p style={{ color: "#64748b", marginBottom: "32px" }}>
            Generated on {new Date().toLocaleDateString()}
          </p>

          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "12px", fontWeight: 600 }}>
              Overview
            </h2>
            <p>BMI: {latestBmi?.bmi?.toFixed(1) ?? "—"}</p>
            <p>Category: {latestBmi?.category ?? "—"}</p>
            <p>Daily Calories: {latestCal?.targetCalories ?? "—"} kcal</p>
            <p>Goal: {latestCal?.goal ?? "—"}</p>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "12px", fontWeight: 600 }}>
              Weight Trend
            </h2>
            <p style={{ fontSize: "17px" }}>{weightTrend}</p>
            <p>{weightInsight}</p>
          </div>

          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "12px", fontWeight: 600 }}>
              Insights
            </h2>
            <p>Your current BMI status: {latestBmi?.category ?? "—"}</p>
            <p>{weightInsight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}