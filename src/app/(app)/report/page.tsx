"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { Report } from "@/lib/report/service";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReportPage() {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const response = await fetch("/api/report");

        if (!response.ok) {
          throw new Error("Unable to load report.");
        }

        const data = (await response.json()) as Report;
        setReport(data);
      } catch {
        setError("Unable to load your report.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  const latestBmi = report?.bmi.latest ?? null;
  const latestCal = report?.nutritionPlan ?? null;
  const weightStats = report?.weight.stats ?? null;

  const weightTrend = weightStats
    ? weightStats.change > 0
      ? `+${weightStats.change} kg`
      : `${weightStats.change} kg`
    : "—";

  const weightInsight = weightStats
    ? weightStats.change < 0
      ? "Weight trending down"
      : weightStats.change > 0
      ? "Weight increasing"
      : "Weight stable"
    : "No data";

  async function onDownloadPDF() {
    if (!pdfRef.current) return;

    setIsGenerating(true);

    try {
      // Temporarily make the element visible for capture
      const originalStyle = pdfRef.current.style.cssText;
      pdfRef.current.style.position = "absolute";
      pdfRef.current.style.left = "0";
      pdfRef.current.style.top = "0";
      pdfRef.current.style.visibility = "visible";
      pdfRef.current.style.zIndex = "-1";

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Restore original hidden state
      pdfRef.current.style.cssText = originalStyle;

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = 210;
      const pdfHeight = 295;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      pdf.save(`nutricare-report-${timestamp}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
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

      {loading ? (
        <Card className="rounded-3xl">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-slate-500">Loading your report...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="rounded-3xl">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                  {latestBmi.value.toFixed(1)}
                </div>
                <p className="text-sm text-slate-600">
                  {latestBmi.category.label}
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
          <CardTitle className="text-lg">Export Full Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onDownloadPDF} 
            disabled={isGenerating || !report}
            className="rounded-2xl"
          >
            {isGenerating ? "Generating PDF..." : "Download PDF Report"}
          </Button>
          </CardContent>
          </Card>
        </>
      )}

      {/* HIDDEN PDF TEMPLATE */}
      <div ref={pdfRef} style={{ position: "absolute", left: "-99999px", top: "0", visibility: "hidden" }}>
        <div style={{
          width: "794px",
          padding: "50px 45px",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          fontFamily: "system-ui, Arial, sans-serif",
        }}>
          <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "10px" }}>
            NutriCare Health Report
          </h1>
          <p style={{ color: "#64748b", marginBottom: "40px" }}>
            Generated on {new Date().toLocaleDateString()}
          </p>

          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "12px", fontWeight: "600" }}>
              Overview
            </h2>
            <p>BMI: {latestBmi?.value?.toFixed(1) ?? "—"}</p>
            <p>Category: {latestBmi?.category.label ?? "—"}</p>
            <p>Daily Calories: {latestCal?.targetCalories ?? "—"} kcal</p>
            <p>Goal: {latestCal?.goal ?? "—"}</p>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "12px", fontWeight: "600" }}>
              Weight Trend
            </h2>
            <p style={{ fontSize: "18px" }}>{weightTrend}</p>
            <p>{weightInsight}</p>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", marginBottom: "12px", fontWeight: "600" }}>
              Insights
            </h2>
            <p>Your current BMI status: {latestBmi?.category.label ?? "—"}</p>
            <p>{weightInsight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}