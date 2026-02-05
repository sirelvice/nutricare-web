"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { impactMetrics, impactNarrative, impactMeasures } from "@/lib/impact/config";

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

export default function ImpactPage() {
  async function onDownload() {
    const res = await fetch("/api/impact-snapshot");
    const json = await res.json();
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    download(`nutricare-impact-snapshot-${ts}.json`, JSON.stringify(json, null, 2));
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Impact</Badge>
          <Badge variant="secondary">Reporting</Badge>
          <Badge variant="secondary">Privacy-first</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{impactNarrative.title}</h1>
        <div className="max-w-3xl space-y-2 text-slate-600">
          {impactNarrative.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="pt-2">
          <Button onClick={onDownload} variant="outline">
            Download impact snapshot (JSON)
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {impactMetrics.map((m) => (
          <Card key={m.label} className="rounded-3xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm text-slate-500">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-semibold">{m.value}</div>
              <div className="text-xs text-slate-600">{m.note}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {impactMeasures.map((b) => (
          <Card key={b.title} className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">{b.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                {b.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border bg-slate-50 p-6 text-sm text-slate-700">
        <div className="font-semibold">Donor/partner readiness</div>
        <p className="mt-2 text-slate-600">
          NutriCare is designed to support pilots: measurable usage, exportable summaries, and privacy-first handling.
          The backend phase will enable secure, aggregated reporting (site-level and programme-level) while keeping
          individuals protected.
        </p>
      </section>
    </div>
  );
}
