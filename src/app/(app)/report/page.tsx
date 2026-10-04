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
  const progress = report?.progress ?? null;

  const weightTrend = weightStats
    ? weightStats.change > 0
      ? `+${weightStats.change} kg`
      : `${weightStats.change} kg`
    : "—";

  const weightInsight =
    progress?.evaluation?.headline ?? "No progress evaluation available";

  const weightSummary =
    progress?.evaluation?.summary ??
    "We don't have enough information to describe your progress yet.";

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
        onclone: (clonedDocument) => {
          // The report template uses inline styles, so isolate the capture
          // from application styles that may contain unsupported CSS
          // colour functions such as lab().
          clonedDocument
            .querySelectorAll("style, link[rel=\"stylesheet\"]")
            .forEach((element) => element.remove());

          clonedDocument.documentElement.style.backgroundColor = "#ffffff";
          clonedDocument.body.style.backgroundColor = "#ffffff";
          clonedDocument.body.style.color = "#0f172a";
        },
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
    <div className="space-y-8">
      {/* HEADER */}
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Your health summary</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Health Report
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          A clear snapshot of your nutrition, weight and health indicators,
          based on the information currently available in your account.
        </p>
      </div>

      {loading ? (
        <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-none">
          <CardContent className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Loading your report...
            </p>
            <p className="mt-1 text-xs text-slate-500">
              We are gathering your latest health information.
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="rounded-2xl border-red-200 bg-red-50 shadow-none">
          <CardContent className="py-8">
            <p className="text-sm font-semibold text-red-800">
              Unable to load your report
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700">
              {error}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KEY METRICS */}
          <section aria-labelledby="report-overview">
            <div className="mb-5">
              <h2
                id="report-overview"
                className="text-2xl font-semibold tracking-tight text-slate-950"
              >
                At a glance
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your latest available measurements and plan information.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    BMI
                  </p>
                  <CardTitle className="text-base text-slate-950">
                    Body mass index
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestBmi ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold tracking-tight text-slate-950">
                          {latestBmi.value.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-500">BMI</span>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-medium text-slate-500">
                          Category
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800">
                          {latestBmi.category.label}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4">
                      <p className="text-sm font-medium text-slate-600">
                        No BMI data available
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Add the required information to see your latest BMI.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Nutrition
                  </p>
                  <CardTitle className="text-base text-slate-950">
                    Daily calorie target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latestCal ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-semibold tracking-tight text-slate-950">
                          {latestCal.targetCalories}
                        </span>
                        <span className="text-sm text-slate-500">kcal/day</span>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-medium text-slate-500">
                          Goal
                        </p>
                        <p className="mt-0.5 text-sm font-semibold capitalize text-slate-800">
                          {latestCal.goal}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4">
                      <p className="text-sm font-medium text-slate-600">
                        No nutrition plan available
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Complete your profile to generate nutrition guidance.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Weight
                  </p>
                  <CardTitle className="text-base text-slate-950">
                    Recent change
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-slate-950">
                      {weightTrend}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium text-slate-500">
                      Progress insight
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {weightInsight}
                    </p>
                  </div>

                  {progress?.evaluation && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {weightSummary}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* PROGRESS SUMMARY */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Progress
              </p>
              <CardTitle className="text-xl text-slate-950">
                What your report says
              </CardTitle>
              <p className="text-sm leading-6 text-slate-600">
                Your latest progress evaluation, when enough information is
                available.
              </p>
            </CardHeader>

            <CardContent>
              {progress?.evaluation ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Current assessment
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {weightInsight}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {weightSummary}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-slate-800">
                    More progress data is needed
                  </p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    We do not have enough information to describe your progress
                    yet. Continue tracking your weight to build a clearer
                    picture over time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* EXPORT */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 shadow-sm">
            <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Export
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Take your report with you
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Download a PDF containing your current overview, weight
                  trend and available insights.
                </p>
              </div>

              <Button
                onClick={onDownloadPDF}
                disabled={isGenerating || !report}
                size="lg"
                className="shrink-0"
              >
                {isGenerating ? "Generating PDF..." : "Download PDF report"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* HIDDEN PDF TEMPLATE */}
      <div
        ref={pdfRef}
        style={{
          position: "absolute",
          left: "-99999px",
          top: "0",
          visibility: "hidden",
        }}
      >
        <div
          style={{
            width: "794px",
            padding: "50px 45px",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontFamily: "system-ui, Arial, sans-serif",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "600",
              marginBottom: "10px",
            }}
          >
            NutriCare Health Report
          </h1>
          <p style={{ color: "#64748b", marginBottom: "40px" }}>
            Generated on {new Date().toLocaleDateString()}
          </p>

          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "12px",
                fontWeight: "600",
              }}
            >
              Overview
            </h2>
            <p>BMI: {latestBmi?.value?.toFixed(1) ?? "—"}</p>
            <p>Category: {latestBmi?.category.label ?? "—"}</p>
            <p>Daily Calories: {latestCal?.targetCalories ?? "—"} kcal</p>
            <p>Goal: {latestCal?.goal ?? "—"}</p>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "12px",
                fontWeight: "600",
              }}
            >
              Weight Trend
            </h2>
            <p style={{ fontSize: "18px" }}>{weightTrend}</p>
            <p>{weightInsight}</p>
            <p>{weightSummary}</p>
          </div>

          <div>
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "12px",
                fontWeight: "600",
              }}
            >
              Insights
            </h2>
            <p>Your current BMI status: {latestBmi?.category.label ?? "—"}</p>
            <p>{weightInsight}</p>
            <p>{weightSummary}</p>
          </div>
        </div>
      </div>
    </div>
  );

}