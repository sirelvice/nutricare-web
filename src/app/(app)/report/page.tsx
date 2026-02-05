"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  async function onDownload() {
    const res = await fetch("/api/report", { method: "GET" });
    const json = await res.json();

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    download(`nutricare-report-${ts}.json`, JSON.stringify(json, null, 2));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Export report</h1>
        <p className="text-slate-600">
          Download a partner-friendly snapshot (Profile + BMI + Calories + Weight trend).
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">NutriCare Report (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-700">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Great for sharing with partners/donors in early pilots.</li>
            <li>No account needed — uses local device data.</li>
            <li>Next: PDF export + signed share links after backend.</li>
          </ul>

          <Button onClick={onDownload}>Download JSON report</Button>
        </CardContent>
      </Card>
    </div>
  );
}
