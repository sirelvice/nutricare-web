"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  addWeightEntry,
  deleteWeightEntry,
  loadWeightEntries,
  summarize,
  type WeightEntry,
} from "@/lib/tracking/weight";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WeightTrackingPage() {
  const [entries, setEntries] = useState<WeightEntry[]>(() =>
    loadWeightEntries()
  );
  const stats = useMemo(() => summarize(entries), [entries]);

  const [date, setDate] = useState(todayISO());
  const [weightKg, setWeightKg] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const valid = useMemo(() => {
    const w = Number(weightKg);
    return date.length === 10 && Number.isFinite(w) && w >= 20 && w <= 350;
  }, [date, weightKg]);

  function onAdd() {
    if (!valid) {
      setError("Enter a valid date and weight (20–350kg).");
      return;
    }

    setError("");

    addWeightEntry({
      date,
      weightKg: Number(weightKg),
      note: note.trim() ? note.trim() : undefined,
    });

    setEntries(loadWeightEntries());
    setWeightKg("");
    setNote("");
  }

  function onDelete(id: string) {
    deleteWeightEntry(id);
    setEntries(loadWeightEntries());
  }

  // 🧠 Trend insight
  const trendMessage = useMemo(() => {
    if (!stats) return null;

    if (stats.change < 0) {
      return "You're losing weight — keep going 👍";
    }
    if (stats.change > 0) {
      return "Weight increasing — review intake ⚠️";
    }
    return "Weight stable — maintain consistency";
  }, [stats]);

  // 🔥 Today vs last delta
  const latestDelta = useMemo(() => {
    if (!stats || stats.count < 2) return null;

    const sorted = [...entries].sort((a, b) =>
      a.date > b.date ? 1 : -1
    );

    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];

    const diff = Number((last.weightKg - prev.weightKg).toFixed(1));

    return diff;
  }, [entries, stats]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Weight tracking</h1>
        <p className="text-slate-600">
          Track your weight over time to see progress.
        </p>
      </div>

      {/* ADD ENTRY */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Add entry</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 70.5"
            />
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. after workout"
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center gap-2">
            <Button onClick={onAdd} disabled={!valid}>
              Add entry
            </Button>

            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-slate-700">
          {stats ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Entries: {stats.count}</Badge>
                <Badge variant="secondary">
                  First: {stats.first.weightKg}kg ({stats.first.date})
                </Badge>
                <Badge variant="secondary">
                  Latest: {stats.last.weightKg}kg ({stats.last.date})
                </Badge>
                <Badge variant="secondary">
                  Change: {stats.change > 0 ? "+" : ""}
                  {stats.change}kg
                </Badge>

                {/* 🔥 Delta badge */}
                {latestDelta !== null && (
                  <Badge variant="secondary">
                    Δ {latestDelta > 0 ? "+" : ""}
                    {latestDelta}kg (last entry)
                  </Badge>
                )}
              </div>

              {/* 🧠 Trend message */}
              {trendMessage && (
                <p className="text-sm text-slate-600">
                  {trendMessage}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">
              No entries yet — add your first weight above
            </p>
          )}
        </CardContent>
      </Card>

      {/* ENTRIES */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Entries</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-slate-400">
              Your weight history will appear here
            </p>
          ) : (
            <div className="divide-y rounded-2xl border bg-white">
              {entries.map((e, i) => (
                <div
                  key={e.id}
                  className={`flex items-center justify-between gap-3 p-4 ${
                    i === 0 ? "bg-emerald-50 border-l-4 border-emerald-500" : ""
                  }`}
                >
                  <div>
                    <div className="font-semibold">
                      {e.weightKg} kg
                    </div>
                    <div className="text-sm text-slate-600">
                      {e.date}
                      {e.note ? ` • ${e.note}` : ""}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => onDelete(e.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}