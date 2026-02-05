"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadCaloriesHistory, clearCaloriesHistory } from "@/lib/history/calories";

export default function CaloriesHistoryPage() {
  const [refresh, setRefresh] = useState(0);
  const rows = useMemo(() => loadCaloriesHistory(), [refresh]);

  function onClear() {
    clearCaloriesHistory();
    setRefresh((x) => x + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calories history</h1>
          <p className="text-slate-600">Saved BMR/TDEE calculations on this device.</p>
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
            <p className="text-slate-600">No history yet. Use the Calories tool first.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.createdAt} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">BMR: {r.bmr}</Badge>
                    <Badge variant="secondary">TDEE: {r.tdee}</Badge>
                    <Badge variant="secondary">Target: {r.targetCalories}</Badge>
                    <Badge variant="secondary">Goal: {r.goal}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Height: {r.heightCm} cm • Weight: {r.weightKg} kg • Age: {r.ageYears} • Gender: {r.gender} • Activity: {r.activity}
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
