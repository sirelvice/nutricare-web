"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadBmiHistory, clearBmiHistory } from "@/lib/history/bmi";

export default function BmiHistoryPage() {
  const [refresh, setRefresh] = useState(0);
  const rows = useMemo(() => loadBmiHistory(), [refresh]);

  function onClear() {
    clearBmiHistory();
    setRefresh((x) => x + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">BMI history</h1>
          <p className="text-slate-600">Your recent BMI results saved on this device.</p>
        </div>
        <Button variant="outline" onClick={onClear} disabled={rows.length === 0}>
          Clear history
        </Button>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-slate-600">No history yet. Use the BMI tool first.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.createdAt} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-lg font-semibold">{r.bmi}</div>
                    <Badge variant="secondary">{r.category}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Height: {r.heightCm} cm • Weight: {r.weightKg} kg • Goal: {r.goal}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(r.createdAt).toISOString().slice(0, 10)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
