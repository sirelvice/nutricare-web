"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardExplanation } from "@/components/ui/card-explanation";
import { readWeightHistory } from "@/lib/tracking/client";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";
import { comparePlans, readPlanHistory } from "@/lib/history/client";

type Section = "weight" | "plans";
const goalLabel = { lose: "Lose weight", maintain: "Maintain weight", gain: "Gain weight" };
const signed = (value: number) => `${value > 0 ? "+" : ""}${value}`;
const savedDate = (value: string) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
}).format(new Date(value));

export default function HistoryPage() {
  const [section, setSection] = useState<Section>("weight");
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-medium uppercase tracking-wider text-primary">Your records</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">History</h1>
        <p className="mt-2 text-sm text-muted-foreground">Measurements and saved plan versions.</p></div>
      <Button variant="outline" onClick={refresh}>Refresh</Button>
    </header>
    <div role="group" aria-label="History sections" className="flex flex-wrap gap-2">
      <Button aria-pressed={section === "weight"} variant={section === "weight" ? "default" : "outline"} onClick={() => setSection("weight")}>Weight</Button>
      <Button aria-pressed={section === "plans"} variant={section === "plans" ? "default" : "outline"} onClick={() => setSection("plans")}>Nutrition Plans</Button>
    </div>
    <HistoryRecords key={`${section}-${revision}`} section={section} onRetry={refresh} />
  </div>;
}

function HistoryRecords({ section, onRetry }: { section: Section; onRetry: () => void }) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        if (section === "weight") {
          const entries = await readWeightHistory(controller.signal);
          if (!controller.signal.aborted) setWeights(entries);
        } else {
          const records = await readPlanHistory(controller.signal);
          if (!controller.signal.aborted) setPlans(records);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [section]);
  const heading = section === "weight" ? "Weight history" : "Nutrition plan history";
  const count = section === "weight" ? weights.length : plans.length;
  return <section aria-label={heading} className="space-y-4">
    <Card><CardContent className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{heading}</h2>
        {!loading && !failed ? <p className="text-xs text-muted-foreground">{count} {section === "weight" ? "entries" : "saved versions"}</p> : null}</div>
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading your {section === "weight" ? "weight history" : "saved plans"}...</p>
        : failed ? <div className="space-y-3"><p role="alert" className="text-sm text-destructive">Unable to load your {section === "weight" ? "weight history" : "saved plans"}. Try again.</p>
          <Button variant="outline" onClick={onRetry}>Try again</Button></div>
        : count === 0 ? <div className="space-y-3 py-4">
          <p className="font-medium">{section === "weight" ? "No weight entries yet" : "No nutrition plans yet"}</p>
          <Button asChild variant="outline"><Link href={section === "weight" ? "/tools/tracking/weight" : "/tools/calories"}>{section === "weight" ? "Record weight" : "Review nutrition plan"}</Link></Button>
        </div> : <>
          {section === "weight" ? <ul aria-label="Recorded measurements" className="divide-y">
            {weights.slice(page * pageSize, (page + 1) * pageSize).map((entry) => <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
              <div className="min-w-0 flex-1"><p className="text-sm text-muted-foreground">{entry.date}</p>
                {entry.note ? <details className="mt-1">
                  <summary className="min-h-11 cursor-pointer py-2 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Measurement note</summary>
                  <p className="max-w-prose break-words pb-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">{entry.note}</p>
                </details> : null}</div>
              <p className="shrink-0 font-semibold tabular-nums">{entry.weightKg} kg</p>
            </li>)}
          </ul> : <>
            <p className="text-xs leading-5 text-muted-foreground">Saved targets, not food consumed or a recommendation to reuse an old plan.</p>
            <ul aria-label="Saved nutrition plans" className="divide-y">
              {plans.slice(page * pageSize, (page + 1) * pageSize).map((plan, index) => <li key={plan.id} className="space-y-2 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold tabular-nums">Version {plan.version} • {plan.targetCalories} kcal</h3>
                  {page === 0 && index === 0 ? <span className="text-xs text-primary">Newest saved</span> : null}</div>
                <p className="text-sm text-muted-foreground">Goal: {goalLabel[plan.goal]}</p>
                <p className="text-xs text-muted-foreground">Saved {savedDate(plan.createdAt)} (UTC)</p>
                <details className="rounded-lg border"><summary className="min-h-11 cursor-pointer px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Version {plan.version} details</summary>
                  <dl className="grid grid-cols-3 gap-3 px-3 pb-3 text-sm">{[
                    ["Protein", plan.proteinG], ["Carbs", plan.carbsG], ["Fat", plan.fatG],
                  ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value} g</dd></div>)}</dl>
                </details>
              </li>)}
            </ul>
          </>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-xs text-muted-foreground">Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, count)} of {count} records</p>
            {count > pageSize ? <nav aria-label="History pages" className="flex gap-2">
              <Button variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="outline" disabled={(page + 1) * pageSize >= count} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </nav> : null}
          </div>
        </>}
    </CardContent></Card>
    {!loading && !failed && section === "plans" && plans.length >= 2 ? <PlanComparison plans={plans} /> : null}
    <CardExplanation label="About these records">{section === "weight"
      ? "Dates belong to individual measurements. Multiple entries on one date remain separate. Historical BMI is not recorded here: applying your current height to old measurements would reconstruct a value rather than show a saved result."
      : "Version numbers identify saved plans. Comparing versions shows target differences; it does not establish why a plan changed or whether it improved your health. Historical records remain available even when current planning eligibility changes."}</CardExplanation>
  </section>;
}

function PlanComparison({ plans }: { plans: NutritionPlan[] }) {
  const [firstId, setFirstId] = useState(plans[1].id);
  const [secondId, setSecondId] = useState(plans[0].id);
  const first = plans.find((plan) => plan.id === firstId)!;
  const second = plans.find((plan) => plan.id === secondId)!;
  const result = comparePlans(first, second);
  return <Card><CardContent className="space-y-4 p-5 sm:p-6">
    <h2 className="text-lg font-semibold">Compare saved plans</h2>
    <div className="grid gap-3 sm:grid-cols-2">{[
      { label: "First saved version", value: firstId, change: setFirstId },
      { label: "Second saved version", value: secondId, change: setSecondId },
    ].map(({ label, value, change }) => <label key={label} className="space-y-2 text-sm">{label}
      <select aria-label={label} value={value} onChange={(event) => change(event.target.value)} className="block min-h-11 w-full rounded-lg border bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {plans.map((plan) => <option key={plan.id} value={plan.id}>Version {plan.version}</option>)}
      </select></label>)}</div>
    {firstId === secondId ? <p role="status" className="text-sm text-muted-foreground">Choose two different versions to compare.</p> : <>
      <p className="text-sm">Version {result.older.version} to version {result.newer.version}</p>
      <dl aria-label="Saved target differences" className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[
        ["Calories", `${signed(result.calories)} kcal/day`], ["Protein", `${signed(result.protein)} g/day`],
        ["Carbs", `${signed(result.carbs)} g/day`], ["Fat", `${signed(result.fat)} g/day`],
      ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold tabular-nums">{value}</dd></div>)}</dl>
      <p className="text-sm text-muted-foreground">Goal: {goalLabel[result.older.goal]} to {goalLabel[result.newer.goal]}</p>
      <p className="text-xs text-muted-foreground">Differences are newer minus older saved targets.</p>
    </>}
  </CardContent></Card>;
}
