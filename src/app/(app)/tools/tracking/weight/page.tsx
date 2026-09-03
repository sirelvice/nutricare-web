"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { summarize, type WeightEntry } from "@/lib/tracking/domain";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WeightTrackingPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadEntries() {
      try {
        const response = await fetch("/api/weight-entries");

        if (!response.ok) {
          throw new Error("Unable to load weight entries.");
        }

        const data = (await response.json()) as WeightEntry[];
        setEntries(data);
      } catch {
        setLoadError("Unable to load your weight history.");
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, []);

  const stats = useMemo(() => summarize(entries), [entries]);

  const [date, setDate] = useState(todayISO());
  const [weightKg, setWeightKg] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = useMemo(() => {
    const w = Number(weightKg);
    return date.length === 10 && Number.isFinite(w) && w >= 20 && w <= 350;
  }, [date, weightKg]);

  async function onAdd() {
    if (!valid || saving) {
      if (!valid) {
        setError("Enter a valid date and weight (20–350kg).");
      }
      return;
    }

    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/weight-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          weightKg: Number(weightKg),
          note: note.trim() ? note.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error || "Unable to add weight entry.");
      }

      const entry = (await response.json()) as WeightEntry;

      setEntries((current) =>
        [entry, ...current].sort((a, b) => b.date.localeCompare(a.date)),
      );
      setWeightKg("");
      setNote("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to add weight entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setError("");

    try {
      const response = await fetch(`/api/weight-entries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error || "Unable to delete weight entry.");
      }

      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete weight entry.",
      );
    }
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

    return Number((last.weightKg - prev.weightKg).toFixed(1));
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

      {loading && (
        <p className="text-sm text-slate-500">Loading your weight history...</p>
      )}

      {loadError && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {loadError}
        </div>
      )}

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
            <Button onClick={onAdd} disabled={!valid || saving}>
              Add entry
            </Button>

            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY (REDESIGNED) */}
      <Card className="rounded-3xl border shadow-sm bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {stats ? (
            <>
              {/* MAIN STAT */}
              <div>
                <p className="text-sm text-slate-500">Latest weight</p>
                <div className="text-4xl font-semibold">
                  {stats.last.weightKg} kg
                </div>
                <p className="text-xs text-slate-500">
                  {stats.last.date}
                </p>
              </div>

              {/* METRICS */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border p-3 text-center">
                  <p className="text-xs text-slate-500">Start</p>
                  <p className="font-semibold">
                    {stats.first.weightKg} kg
                  </p>
                </div>

                <div className="rounded-2xl border p-3 text-center">
                  <p className="text-xs text-slate-500">Change</p>
                  <p className="font-semibold">
                    {stats.change > 0 ? "+" : ""}
                    {stats.change} kg
                  </p>
                </div>

                <div className="rounded-2xl border p-3 text-center">
                  <p className="text-xs text-slate-500">Last Δ</p>
                  <p className="font-semibold">
                    {latestDelta !== null
                      ? `${latestDelta > 0 ? "+" : ""}${latestDelta} kg`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* TREND */}
              {trendMessage && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm text-slate-600">
                    {trendMessage}
                  </p>
                </div>
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
                    i === 0
                      ? "bg-emerald-50 border-l-4 border-emerald-500"
                      : ""
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