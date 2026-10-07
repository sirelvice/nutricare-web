"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardExplanation } from "@/components/ui/card-explanation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WeightEntry } from "@/lib/tracking/domain";
import { readWeightHistory, saveWeightEntry, deleteWeightEntry, WeightSaveError } from "@/lib/tracking/client";
import { parseWeightDraft } from "./weight-form";

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function WeightTrackingPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [date, setDate] = useState(todayISO);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [historyReviewed, setHistoryReviewed] = useState(false);
  const needsReview = useRef(false);
  const [pending, setPending] = useState("");
  const mutation = useRef<AbortController | null>(null);
  const read = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; mutation.current?.abort(); read.current?.abort(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    read.current = controller;
    setLoading(true);
    setLoadError("");
    readWeightHistory(controller.signal).then((history) => {
      if (controller.signal.aborted) return;
      setEntries(history);
      if (needsReview.current) setHistoryReviewed(true);
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError("Unable to load your weight history.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
      if (read.current === controller) read.current = null;
    });
    return () => controller.abort();
  }, [revision]);

  function refreshHistory() {
    if (mutation.current || read.current) return;
    // Block writes synchronously until the new history request finishes.
    setLoading(true);
    setRevision((current) => current + 1);
  }

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.current || read.current || loading || loadError || uncertain) return;
    const entry = parseWeightDraft(date, weight, note);
    if (!entry) {
      setError("Enter a valid date, a weight from 20 to 350 kg, and a note of up to 500 characters.");
      document.getElementById(!parseWeightDraft(date, "70", "") ? "weight-date"
        : note.trim().length > 500 ? "weight-note" : "weight-value")?.focus();
      return;
    }
    const controller = new AbortController();
    mutation.current = controller;
    setPending("save"); setError(""); setMessage("");
    try {
      const result = await saveWeightEntry(entry, controller.signal);
      if (!mounted.current) return;
      setEntries((current) => [result.entry, ...current.filter((item) => item.id !== result.entry.id)]
        .sort((a, b) => b.date.localeCompare(a.date)));
      setWeight(""); setNote("");
      setMessage(result.progressUnavailable
        ? "Weight saved. Progress is temporarily unavailable. You do not need to save this entry again."
        : "Weight saved.");
    } catch (failure) {
      if (!mounted.current) return;
      const ambiguous = failure instanceof WeightSaveError ? failure.uncertain : true;
      needsReview.current = ambiguous;
      setHistoryReviewed(false);
      setUncertain(ambiguous);
      setError(failure instanceof WeightSaveError ? failure.message : "We could not confirm the save. Check your history before adding another entry.");
    } finally {
      if (mutation.current === controller) mutation.current = null;
      if (mounted.current) setPending("");
    }
  }

  async function onDelete(id: string) {
    if (mutation.current || read.current || loading || loadError || uncertain) return;
    const controller = new AbortController();
    mutation.current = controller;
    setPending(id); setError(""); setMessage("");
    try {
      await deleteWeightEntry(id, controller.signal);
      if (!mounted.current) return;
      setEntries((current) => current.filter((entry) => entry.id !== id));
      setMessage("Weight entry deleted.");
    } catch {
      if (mounted.current) setError("We could not confirm the deletion. Refresh your history to check the entry.");
    } finally {
      if (mutation.current === controller) mutation.current = null;
      if (mounted.current) setPending("");
    }
  }

  const disabled = loading || !!loadError || !!pending || uncertain;
  const latest = entries[0];
  const first = entries[entries.length - 1];
  const change = latest && first ? Number((latest.weightKg - first.weightKg).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-medium uppercase tracking-wider text-primary">Your measurements</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Weight tracking</h1>
          <p className="mt-2 text-sm text-muted-foreground">Record a measurement. Follow the trend over time.</p></div>
        <Link href="/tools/recommendations" className="text-sm font-medium text-primary underline-offset-4 hover:underline">View recommendations</Link>
      </header>

      <Card>
        <CardHeader><CardTitle>Add a weight entry</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onAdd} noValidate className="space-y-4">
            <fieldset disabled={disabled} className="grid min-w-0 gap-4 md:grid-cols-3">
              <legend className="sr-only">Measurement details</legend>
              <div className="min-w-0 space-y-2"><Label htmlFor="weight-date">Date</Label>
                <Input id="weight-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="weight-value">Weight (kg)</Label>
                <Input id="weight-value" inputMode="decimal" placeholder="e.g. 70.5" value={weight} onChange={(event) => setWeight(event.target.value)} aria-describedby="weight-hint" />
                <p id="weight-hint" className="text-xs text-muted-foreground">20 to 350 kg</p></div>
              <div className="space-y-2"><Label htmlFor="weight-note">Note (optional)</Label>
                <Input id="weight-note" placeholder="e.g. after workout" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} /></div>
            </fieldset>
            <Button type="submit" disabled={disabled}>{pending === "save" ? "Adding entry..." : "Add entry"}</Button>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
            {uncertain ? <div className="space-y-3 rounded-xl border p-4 text-sm">
              <p>Refresh the history and review it. Only start another entry if the measurement is missing.</p>
              <Button type="button" variant="outline" disabled={loading || !!pending} onClick={refreshHistory}>Check history</Button>
              {historyReviewed && !loading && !loadError ? <Button type="button" variant="outline" onClick={() => { needsReview.current = false; setHistoryReviewed(false); setUncertain(false); setError(""); setWeight(""); setNote(""); }}>Start another entry</Button> : null}
            </div> : null}
          </form>
        </CardContent>
      </Card>

      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading your weight history...</p> : loadError ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 p-5"><p role="alert" className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" onClick={refreshHistory}>Try again</Button></div>
      ) : <>
        <section aria-label="Weight summary" className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Latest weight</p>
            <div className="mt-2 text-3xl font-semibold">{latest ? `${latest.weightKg} kg` : "Not recorded"}</div>
            {latest ? <p className="mt-1 text-xs text-muted-foreground">{latest.date}</p> : <p className="mt-1 text-xs text-muted-foreground">No weight entries yet</p>}</CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Overall change</p>
            <p className="mt-2 text-3xl font-semibold">{entries.length > 1 ? `${change > 0 ? "+" : ""}${change} kg` : "Not enough entries"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Since your first measurement</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recorded entries</p>
            <p className="mt-2 text-3xl font-semibold">{entries.length}</p>
            <CardExplanation label="About your measurements">Day-to-day changes can reflect timing and hydration. Compare measurements taken in similar conditions.</CardExplanation></CardContent></Card>
        </section>
        <Card><CardHeader className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Weight history</CardTitle>
          <Button variant="outline" disabled={!!pending} onClick={refreshHistory}>Refresh history</Button></CardHeader>
          <CardContent>{entries.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Your weight history will appear here</p> : (
            <ul className="divide-y" aria-label="Weight entries">{entries.map((entry, index) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0"><p className="font-semibold">{entry.weightKg} kg {index === 0 ? <span className="ml-2 text-xs font-normal text-muted-foreground">Latest</span> : null}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">{entry.date}{entry.note ? ` • ${entry.note}` : ""}</p></div>
              <Button variant="outline" disabled={disabled} onClick={() => onDelete(entry.id)}>{pending === entry.id ? "Deleting..." : "Delete"}</Button>
            </li>)}</ul>
          )}</CardContent></Card>
      </>}
    </div>
  );
}
