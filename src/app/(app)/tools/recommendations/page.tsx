"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardExplanation } from "@/components/ui/card-explanation";
import { ProgressGuidance } from "@/components/progress/ProgressGuidance";
import { readRecommendations, type RecommendationRead } from "@/lib/reco/client";

export default function RecommendationsPage() {
  const [result, setResult] = useState<RecommendationRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    readRecommendations(controller.signal).then((value) => {
      if (!controller.signal.aborted) setResult(value);
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [revision]);

  function refreshGuidance() {
    setLoading(true); setError(false); setResult(null); setRevision((value) => value + 1);
  }

  const data = result?.kind === "ready" ? result.data : null;
  const guidance = data?.recommendations;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wider text-primary">Your next steps</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Recommendations</h1>
        <p className="mt-2 text-sm text-muted-foreground">Practical guidance from your saved profile, weight and plan.</p></div>
        <Button variant="outline" disabled={loading} onClick={refreshGuidance}>Refresh guidance</Button></header>
      {loading ? <p role="status" className="text-sm text-muted-foreground">Loading your recommendations...</p>
        : error ? <Card><CardContent className="space-y-4 p-6">
          <p role="alert" className="text-sm text-destructive">Recommendations are temporarily unavailable. Please try again.</p>
          <Button variant="outline" onClick={refreshGuidance}>Try again</Button>
        </CardContent></Card>
        : result && result.kind !== "ready" ? <Card><CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">{result.kind === "setup" ? "Build your starting point" : "About your guidance"}</h2>
          <p role="status" className="text-sm leading-6 text-muted-foreground">{result.kind === "setup"
            ? "Complete your profile, record a weight and create a nutrition plan to see your recommendations."
            : result.message}</p>
          <div className="flex flex-wrap gap-3"><Button asChild><Link href="/profile">Review profile</Link></Button>
            {result.kind === "plan-review" ? <Button asChild variant="outline"><Link href="/tools/calories">Review nutrition plan</Link></Button> : null}
            {result.kind === "setup" ? <><Button asChild variant="outline"><Link href="/tools/tracking/weight">Record weight</Link></Button>
              <Button asChild variant="outline"><Link href="/tools/calories">Review nutrition plan</Link></Button></> : null}</div>
        </CardContent></Card> : null}
      {!loading && !error && data && guidance ? <>
        <Card><CardContent className="space-y-5 p-6">
          <p className="text-xs text-muted-foreground">Plan version {data.context.plan.version} · Weight recorded {data.context.measurement.date}</p>
          <div><h2 className="text-lg font-semibold">Your recommendations</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{guidance.summary}</p></div>
          <section aria-labelledby="next-steps-heading"><h3 id="next-steps-heading" className="font-semibold">Next steps</h3>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">{guidance.actions.map((action) => <li key={action.id} className="space-y-3 rounded-xl border p-4">
              <p className="font-medium">{action.title}</p>
              <CardExplanation label="Why this step">{action.reason}</CardExplanation>
              <Link href={action.href} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
                {action.href === "/profile" ? "Review your goal" : action.href === "/tools/calories" ? "Review your targets" : "Record weight"}
              </Link>
            </li>)}</ul></section>
          <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6">
            <p>Guidance is informational and not a medical diagnosis.</p>
            {guidance.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          </div>
        </CardContent></Card>
        {guidance.guidanceMode === "general" ? <section aria-label="Your current estimates" className="grid gap-4 lg:grid-cols-2">
          <Card><CardContent className="p-5"><h2 className="text-sm font-medium text-muted-foreground">Current plan targets</h2>
            <p className="mt-2"><span className="text-3xl font-semibold tabular-nums">{data.targetCalories}</span> <span className="text-sm text-muted-foreground">kcal/day</span></p>
            <dl className="mt-4 grid grid-cols-3 gap-3">{[
              { label: "Protein", value: data.macros.proteinG },
              { label: "Carbs", value: data.macros.carbsG },
              { label: "Fat", value: data.macros.fatG },
            ].map(({ label, value }) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1"><span className="font-semibold tabular-nums">{value}</span> <span className="text-xs text-muted-foreground">g</span></dd></div>)}</dl>
            <p className="mt-4 text-xs text-muted-foreground">Estimates from your saved plan, not a record of food eaten.</p>
          </CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="text-sm font-medium text-muted-foreground">BMI context</h2>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{data.bmi.toFixed(1)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{data.category.label}</p>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Adult screening context. Your nutritional needs require more than a BMI reading.</p>
          </CardContent></Card>
        </section> : null}
        {guidance.guidanceMode === "general" ? <ProgressGuidance key={data.context.plan.id} planId={data.context.plan.id} /> : null}
        <CardExplanation label="Meal examples">
          <p>{guidance.mealIdeasNote}</p>
          <ul className="list-disc space-y-2 pl-5">{guidance.mealIdeas.map((meal) => <li key={meal}>{meal}</li>)}</ul>
        </CardExplanation>
        <CardExplanation label="More about your guidance">
          {[
            { label: "Top priorities", items: guidance.priorities },
            { label: "Foods to focus", items: guidance.foodsToFocus },
            { label: "Foods to limit", items: guidance.foodsToLimit },
          ].map(({ label, items }) => <section key={label}><h3 className="font-semibold text-foreground">{label}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}
          <h3 className="font-semibold text-foreground">Sources and approach</h3>
          <p>General guidance adapted from WHO principles. These sources do not validate your individual calorie targets or prescribe the example meals.</p>
          <ul>{guidance.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-primary hover:underline">{source.title}</a></li>)}</ul>
          <p className="text-xs">Guidance version: {guidance.contentVersion}</p>
        </CardExplanation>
      </> : null}
    </div>
  );
}
