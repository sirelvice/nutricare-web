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

        setEntries(
          data.filter(
            (entry, index, current) =>
              current.findIndex((item) => item.id === entry.id) === index,
          ),
        );
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
        [entry, ...current]
          .filter(
            (item, index, items) =>
              items.findIndex((candidate) => candidate.id === item.id) === index,
          )
          .sort((a, b) => b.date.localeCompare(a.date)),
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

  const latestDelta = useMemo(() => {
    if (!stats || stats.count < 2) return null;

    const sorted = [...entries].sort((a, b) =>
      a.date > b.date ? 1 : -1,
    );

    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];

    return Number((last.weightKg - prev.weightKg).toFixed(1));
  }, [entries, stats]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Tracking tool
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Weight tracking
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Record your weight over time and use the history to understand how
            your progress is changing.
          </p>
        </div>
      </section>

      {loading && (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Loading your weight history...
            </p>
          </CardContent>
        </Card>
      )}

      {loadError && (
        <Card className="rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-red-700">{loadError}</p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Keep your record current
            </p>
            <CardTitle className="mt-1 text-xl text-slate-950">
              Add a weight entry
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="weight-date">Date</Label>
              <Input
                id="weight-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-value">Weight (kg)</Label>
              <Input
                id="weight-value"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 70.5"
              />
              <p className="text-xs text-slate-500">
                Enter a value between 20 and 350 kg.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-note">Note (optional)</Label>
              <Input
                id="weight-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. after workout"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
            <Button onClick={onAdd} disabled={!valid || saving}>
              {saving ? "Adding entry..." : "Add entry"}
            </Button>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Your progress
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Weight summary
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            A quick view of your recorded weight and changes over time.
          </p>
        </div>

        {stats ? (
          <div className="grid gap-5 md:grid-cols-4">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md md:col-span-2">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">
                  Latest weight
                </p>
                <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                  {stats.last.weightKg}
                  <span className="ml-1 text-xl font-medium text-slate-500">
                    kg
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Recorded on {stats.last.date}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">
                  Starting weight
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {stats.first.weightKg}
                  <span className="ml-1 text-base font-medium text-slate-500">
                    kg
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  First recorded entry
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">
                  Overall change
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {stats.change > 0 ? "+" : ""}
                  {stats.change}
                  <span className="ml-1 text-base font-medium text-slate-500">
                    kg
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Since your first entry
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md md:col-span-2">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">
                  Latest change
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {latestDelta !== null
                    ? `${latestDelta > 0 ? "+" : ""}${latestDelta} kg`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Change between the two most recent entries
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-sm md:col-span-2">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recorded entries
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {stats.count}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Keep recording consistently to build a clearer picture of
                  your progress.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-slate-50 shadow-none">
            <CardContent className="p-8 text-center">
              <p className="text-base font-medium text-slate-800">
                No weight entries yet
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                Add your first weight above and your progress summary will
                appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Your record
            </p>
            <CardTitle className="mt-1 text-xl text-slate-950">
              Weight history
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                Your weight history will appear here
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add an entry above to start building your record.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="divide-y divide-slate-100">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${
                      index === 0 ? "bg-emerald-50/70" : "bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-lg font-semibold text-slate-950">
                          {entry.weightKg} kg
                        </span>
                        {index === 0 && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.date}
                        {entry.note ? ` • ${entry.note}` : ""}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => onDelete(entry.id)}
                      className="w-full sm:w-auto"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
