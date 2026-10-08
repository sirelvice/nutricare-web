"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CardExplanation } from "@/components/ui/card-explanation";
import { Button } from "@/components/ui/button";
import { readReport, readReportPDF, type ReportSnapshot } from "@/lib/report/client";

const goalLabel = { lose: "Lose weight", gain: "Gain weight", maintain: "Maintain weight" };
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "UTC",
}).format(new Date(value));

export default function ReportPage() {
  const [revision, setRevision] = useState(0);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-medium uppercase tracking-wider text-primary">Your overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Health Report</h1>
        <p className="mt-2 text-sm text-muted-foreground">Measurements, saved targets and progress.</p></div>
      <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Refresh</Button>
    </header>
    <ReportContent key={revision} onRetry={() => setRevision((value) => value + 1)} />
  </div>;
}

function ReportContent({ onRetry }: { onRetry: () => void }) {
  const [report, setReport] = useState<ReportSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const downloadRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void readReport(controller.signal).then((value) => {
      if (!controller.signal.aborted) setReport(value);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => { controller.abort(); downloadRequest.current?.abort(); };
  }, []);

  async function download() {
    if (downloadRequest.current) return;
    const controller = new AbortController();
    downloadRequest.current = controller;
    setDownloading(true); setDownloadError(false);
    try {
      const blob = await readReportPDF(controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "nutricare-personal-report.pdf";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (!controller.signal.aborted) setDownloadError(true);
    } finally {
      downloadRequest.current = null;
      if (!controller.signal.aborted) setDownloading(false);
    }
  }

  if (loading) return <p role="status" className="py-8 text-sm text-muted-foreground">Loading your report...</p>;
  if (failed) return <Card><CardContent className="space-y-3 p-5">
    <p role="alert" className="text-sm text-destructive">Unable to load your report. Try again.</p>
    <Button variant="outline" onClick={onRetry}>Try again</Button>
  </CardContent></Card>;
  if (!report) return <Card><CardContent className="space-y-3 p-5">
    <h2 className="text-lg font-semibold">Start with your profile</h2>
    <p className="text-sm text-muted-foreground">Save your profile to create a personal report.</p>
    <Button asChild><Link href="/profile">Complete your profile</Link></Button>
  </CardContent></Card>;

  const bmi = report.bmi.latest;
  const plan = report.nutritionPlan;
  const stats = report.weight.stats;
  const progress = report.progress;
  return <div className="space-y-4">
    <p className="text-xs text-muted-foreground">Generated {dateLabel(report.generatedAt)} UTC</p>
    <section aria-label="Report overview" className="grid gap-4 md:grid-cols-3">
      <Card><CardContent className="space-y-3 p-5">
        <h2 className="text-sm font-medium">Body mass index</h2>
        <p className="text-3xl font-semibold tabular-nums">{bmi ? bmi.value.toFixed(1) : "Not available"}</p>
        {bmi ? <p className="text-sm text-muted-foreground">{bmi.category.label}</p> : null}
        <p className="text-xs leading-5 text-muted-foreground">Calculated from latest weight and current height. Adult screening measure, not a diagnosis.</p>
      </CardContent></Card>
      <Card><CardContent className="space-y-3 p-5">
        <h2 className="text-sm font-medium">Daily calorie target</h2>
        <p className="text-3xl font-semibold tabular-nums">{plan ? <>{plan.targetCalories}<span className="ml-2 text-sm font-normal text-muted-foreground">kcal/day</span></> : "Not available"}</p>
        {plan ? <><p className="text-sm text-muted-foreground">{goalLabel[plan.goal]}</p>
          <p className="text-xs text-muted-foreground">Saved version {plan.version}</p>
          <CardExplanation label="Macro targets"><p>Protein {plan.proteinG} g/day; carbs {plan.carbsG} g/day; fat {plan.fatG} g/day.</p></CardExplanation></>
          : <Button asChild variant="outline"><Link href="/tools/calories">Review nutrition plan</Link></Button>}
        <p className="text-xs text-muted-foreground">Saved targets, not food consumed.</p>
      </CardContent></Card>
      <Card><CardContent className="space-y-3 p-5">
        <h2 className="text-sm font-medium">Recorded weight change</h2>
        <p className="text-3xl font-semibold tabular-nums">{stats ? `${stats.change > 0 ? "+" : ""}${stats.change} kg` : "Not available"}</p>
        <p className="text-xs text-muted-foreground">{stats ? `${stats.first.date} to ${stats.last.date}` : "Record weight to begin."}</p>
        <p className="text-sm text-muted-foreground">{report.weight.entriesCount} measurements</p>
        <Button asChild variant="outline"><Link href="/history">View history</Link></Button>
      </CardContent></Card>
    </section>
    <Card><CardContent className="space-y-3 p-5">
      <h2 className="text-lg font-semibold">Progress insight</h2>
      {progress ? <><p className="font-medium">{progress.evaluation.headline}</p>
        <p className="text-sm leading-6 text-muted-foreground">{progress.evaluation.summary}</p>
        <p className="text-sm leading-6">{progress.recommendation.message}</p>
        <p className="text-xs text-muted-foreground">Evaluated {dateLabel(progress.evaluation.evaluatedAt)} UTC</p></>
        : <p className="text-sm text-muted-foreground">No progress evaluation available</p>}
    </CardContent></Card>
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="space-y-1"><h2 className="text-lg font-semibold">Take your report with you</h2>
        <p className="text-xs leading-5 text-muted-foreground">The PDF uses your latest saved data at download time. Keep it private.</p></div>
      <Button onClick={download} disabled={downloading}>{downloading ? "Preparing PDF..." : "Download PDF report"}</Button>
      {downloadError ? <p role="alert" className="w-full text-sm text-destructive">Unable to download your report. Try again.</p> : null}
    </CardContent></Card>
  </div>;
}
